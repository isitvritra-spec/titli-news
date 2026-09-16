import { and, desc, eq, gte, inArray } from "drizzle-orm";

import { db } from "./client";
import { feedCandidates, sources, storyClusters } from "./schema";
import { getSourceProfile } from "../rss";
import { clusterCandidates, type ClusterableCandidate, type TrustTier } from "../clustering";
import { scoreRelevance } from "../relevance";

const RECLUSTER_WINDOW_MS = 48 * 60 * 60 * 1000;

type SourceMeta = {
  trustTier: TrustTier;
  sourceType: "official" | "specialist" | "mainstream" | "data" | "aggregator";
};

/** Resolve a candidate's trust tier and type from the sources table, then the RSS profile, then a safe default. */
function metaFor(sourceName: string, bySavedName: Map<string, SourceMeta>): SourceMeta {
  const saved = bySavedName.get(sourceName);
  if (saved) return saved;

  const profile = getSourceProfile(sourceName);
  if (profile) return { trustTier: profile.trustTier, sourceType: profile.sourceType };

  return { trustTier: "discovery", sourceType: "aggregator" };
}

/**
 * The morning pass that makes a large inbox survivable. It reads the untriaged
 * candidates, drops everything that isn't about women in India (auto_rejected),
 * groups the rest into one row per story, and scores each story so the triage
 * board opens already ranked. Only `new` candidates and `new` clusters are
 * touched — anything an editor has already shortlisted, dismissed, or drafted
 * is left exactly as it is.
 *
 * Idempotent: safe to run repeatedly. Each run rebuilds the `new` clusters from
 * scratch, so a candidate that arrived since the last run slots in correctly.
 */
export async function clusterAndScoreInbox(): Promise<{
  clusters: number;
  kept: number;
  rejected: number;
}> {
  const windowStart = new Date(Date.now() - RECLUSTER_WINDOW_MS).toISOString();

  const candidates = await db
    .select()
    .from(feedCandidates)
    .where(and(eq(feedCandidates.status, "new"), gte(feedCandidates.fetchedAt, windowStart)));

  if (candidates.length === 0) {
    await clearNewClusters();
    return { clusters: 0, kept: 0, rejected: 0 };
  }

  const savedSources = await db
    .select({ name: sources.name, trustTier: sources.trustTier, sourceType: sources.sourceType })
    .from(sources);
  const bySavedName = new Map<string, SourceMeta>(
    savedSources.map((row) => [row.name, { trustTier: row.trustTier, sourceType: row.sourceType }]),
  );

  const scored = candidates.map((candidate) => {
    const meta = metaFor(candidate.sourceName, bySavedName);
    const relevance = scoreRelevance({
      title: candidate.title,
      sourceTrustTier: meta.trustTier,
      sourceType: meta.sourceType,
    });
    return { candidate, meta, relevance };
  });

  const rejected = scored.filter((row) => !row.relevance.keep);
  const kept = scored.filter((row) => row.relevance.keep);

  if (rejected.length > 0) {
    await db
      .update(feedCandidates)
      .set({ status: "auto_rejected", relevanceScore: 0, clusterId: null })
      .where(inArray(feedCandidates.id, rejected.map((row) => row.candidate.id)));
  }

  // Rebuild clusters from the kept set. Deleting the old `new` clusters nulls
  // their members' cluster_id via the FK before we reassign below.
  await clearNewClusters();

  const clusterInputs: ClusterableCandidate[] = kept.map((row) => ({
    id: row.candidate.id,
    title: row.candidate.title,
    sourceName: row.candidate.sourceName,
    trustTier: row.meta.trustTier,
    pubDate: row.candidate.pubDate,
    fetchedAt: row.candidate.fetchedAt,
  }));

  const scoreById = new Map(kept.map((row) => [row.candidate.id, row.relevance]));
  const groups = clusterCandidates(clusterInputs);

  for (const group of groups) {
    const memberScores = group.candidateIds.map((id) => scoreById.get(id));
    const clusterScore = Math.max(...memberScores.map((r) => r?.score ?? 0));
    const canonicalTopic = scoreById.get(group.canonicalCandidateId)?.topicGuess ?? null;
    const topicGuess =
      canonicalTopic ?? memberScores.find((r) => r?.topicGuess)?.topicGuess ?? null;

    const [cluster] = await db
      .insert(storyClusters)
      .values({
        canonicalTitle: group.canonicalTitle,
        canonicalCandidateId: group.canonicalCandidateId,
        topicGuess,
        relevanceScore: clusterScore,
        outletCount: group.outletCount,
        status: "new",
        firstSeenAt: group.firstSeenAt,
      })
      .returning({ id: storyClusters.id });

    for (const id of group.candidateIds) {
      await db
        .update(feedCandidates)
        .set({ clusterId: cluster.id, relevanceScore: scoreById.get(id)?.score ?? 0 })
        .where(eq(feedCandidates.id, id));
    }
  }

  return { clusters: groups.length, kept: kept.length, rejected: rejected.length };
}

async function clearNewClusters(): Promise<void> {
  await db.delete(storyClusters).where(eq(storyClusters.status, "new"));
}

export type TriageArticle = {
  id: string;
  title: string;
  sourceName: string;
  link: string;
  pubDate: string | null;
};

export type TriageCluster = {
  id: string;
  canonicalTitle: string;
  canonicalCandidateId: string | null;
  topicGuess: string | null;
  relevanceScore: number | null;
  outletCount: number;
  status: "new" | "shortlisted";
  firstSeenAt: string;
  canonicalSourceName: string | null;
  canonicalTrustTier: TrustTier | null;
  articles: TriageArticle[];
};

/**
 * The triage board's data (Phase 3 UI): one active story cluster per row,
 * ranked by relevance, each enriched with its canonical outlet's trust tier
 * (for the primary-source badge) and its member articles (for the expanded
 * view). This is what the editor reads first thing each morning.
 */
export async function listTriageClusters(): Promise<TriageCluster[]> {
  const clusters = await db
    .select()
    .from(storyClusters)
    .where(inArray(storyClusters.status, ["new", "shortlisted"]))
    .orderBy(desc(storyClusters.relevanceScore), desc(storyClusters.firstSeenAt));

  if (clusters.length === 0) return [];

  const members = await db
    .select()
    .from(feedCandidates)
    .where(inArray(feedCandidates.clusterId, clusters.map((cluster) => cluster.id)));

  const savedSources = await db
    .select({ name: sources.name, trustTier: sources.trustTier, sourceType: sources.sourceType })
    .from(sources);
  const bySavedName = new Map<string, SourceMeta>(
    savedSources.map((row) => [row.name, { trustTier: row.trustTier, sourceType: row.sourceType }]),
  );

  const byCluster = new Map<string, TriageArticle[]>();
  const canonicalName = new Map<string, string>();
  for (const member of members) {
    if (!member.clusterId) continue;
    const list = byCluster.get(member.clusterId) ?? [];
    list.push({
      id: member.id,
      title: member.title,
      sourceName: member.sourceName,
      link: member.link,
      pubDate: member.pubDate,
    });
    byCluster.set(member.clusterId, list);
    if (member.id === clusters.find((c) => c.id === member.clusterId)?.canonicalCandidateId) {
      canonicalName.set(member.clusterId, member.sourceName);
    }
  }

  return clusters.map((cluster) => {
    const sourceName = canonicalName.get(cluster.id) ?? null;
    return {
      id: cluster.id,
      canonicalTitle: cluster.canonicalTitle,
      canonicalCandidateId: cluster.canonicalCandidateId,
      topicGuess: cluster.topicGuess,
      relevanceScore: cluster.relevanceScore,
      outletCount: cluster.outletCount,
      status: cluster.status as "new" | "shortlisted",
      firstSeenAt: cluster.firstSeenAt,
      canonicalSourceName: sourceName,
      canonicalTrustTier: sourceName ? metaFor(sourceName, bySavedName).trustTier : null,
      articles: (byCluster.get(cluster.id) ?? []).sort((a, b) =>
        (b.pubDate ?? "").localeCompare(a.pubDate ?? ""),
      ),
    };
  });
}

/** Dismiss a whole cluster in one action — the main time saving over per-article triage. */
export async function dismissCluster(id: string): Promise<void> {
  await db.update(storyClusters).set({ status: "dismissed" }).where(eq(storyClusters.id, id));
  await db
    .update(feedCandidates)
    .set({ status: "dismissed", dismissed: true })
    .where(eq(feedCandidates.clusterId, id));
}

export async function dismissClusters(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.update(storyClusters).set({ status: "dismissed" }).where(inArray(storyClusters.id, ids));
  await db
    .update(feedCandidates)
    .set({ status: "dismissed", dismissed: true })
    .where(inArray(feedCandidates.clusterId, ids));
}

/** Mark a cluster for the edition composer's shortlist without drafting yet. */
export async function shortlistCluster(id: string, shortlisted: boolean): Promise<void> {
  const clusterStatus = shortlisted ? "shortlisted" : "new";
  const candidateStatus = shortlisted ? "shortlisted" : "new";
  await db.update(storyClusters).set({ status: clusterStatus }).where(eq(storyClusters.id, id));
  await db
    .update(feedCandidates)
    .set({ status: candidateStatus })
    .where(eq(feedCandidates.clusterId, id));
}

