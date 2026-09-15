import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./client";
import { feedCandidates, sources } from "./schema";
import { fetchAllCandidates, getSourceProfile, type FeedCandidateInput } from "../rss";
import {
  generatePlaceholderImage,
  saveImageFromArticle,
  saveImageFromUrl,
} from "../images";

/** Pulls all sources, skips anything already stored (dedup by link), inserts the rest. Returns how many were actually new. */
export async function refreshInbox(): Promise<number> {
  const fetched = await fetchAllCandidates();
  if (fetched.length === 0) return 0;

  const links = fetched.map((c) => c.link);
  const existing = await db
    .select({ link: feedCandidates.link })
    .from(feedCandidates)
    .where(inArray(feedCandidates.link, links));
  const existingLinks = new Set(existing.map((e) => e.link));

  const toInsert: FeedCandidateInput[] = fetched.filter((c) => !existingLinks.has(c.link));
  if (toInsert.length === 0) return 0;

  await db.insert(feedCandidates).values(
    toInsert.map((c) => ({
      sourceName: c.sourceName,
      sourceSiteUrl: c.sourceSiteUrl,
      title: c.title,
      link: c.link,
      imageUrl: c.imageUrl,
      pubDate: c.pubDate,
    }))
  );

  return toInsert.length;
}

/** Only items neither dismissed nor already turned into a published card — this is a to-do list, not an archive. */
export async function listInboxCandidates() {
  return db
    .select()
    .from(feedCandidates)
    .where(and(eq(feedCandidates.dismissed, false), isNull(feedCandidates.draftedCardId)))
    .orderBy(desc(feedCandidates.pubDate), desc(feedCandidates.fetchedAt));
}

export async function dismissCandidate(id: string): Promise<void> {
  await db.update(feedCandidates).set({ dismissed: true }).where(eq(feedCandidates.id, id));
}

/** Called once the card that started from this candidate is actually published — see app/api/admin/cards/route.ts. */
export async function markCandidateDrafted(candidateId: string, cardId: string): Promise<void> {
  await db.update(feedCandidates).set({ draftedCardId: cardId }).where(eq(feedCandidates.id, candidateId));
}

/** Finds the `source` row for a candidate, creating it on first sight so the new-card form has something to select. */
async function ensureSource(candidate: { sourceName: string; sourceSiteUrl: string }) {
  const [existing] = await db
    .select()
    .from(sources)
    .where(eq(sources.name, candidate.sourceName))
    .limit(1);
  if (existing) return existing;

  const profile = getSourceProfile(candidate.sourceName);
  const [created] = await db
    .insert(sources)
    .values({
      name: candidate.sourceName,
      kind: "news",
      url: candidate.sourceSiteUrl,
      trustTier: profile?.trustTier ?? "discovery",
      sourceType: profile?.sourceType ?? "aggregator",
      feedUrl: profile?.feedUrl ?? null,
      // imagePolicy/allowsTextFetch are left at their schema defaults, which
      // deny both: an editor opts a new source in on /admin/sources once its
      // licence has actually been read.
      ingestMethod: profile ? "rss" : "manual",
    })
    .returning();

  return created;
}

/**
 * Idempotent: if the candidate's image was already downloaded+processed on
 * a previous click, this is a no-op.
 *
 * The source's `imagePolicy` decides whether we may re-host its photography
 * at all. Only "allow" reaches saveImageFromUrl/saveImageFromArticle; every
 * other source gets the branded placeholder instead, so a licensed wire photo
 * is never silently copied onto our domain. Either way the candidate ends up
 * with *some* draft image — a failed download or a locked-down source should
 * not leave the editor blocked.
 */
export async function prepareDraft(id: string): Promise<{ sourceId: string } | null> {
  const [candidate] = await db.select().from(feedCandidates).where(eq(feedCandidates.id, id)).limit(1);
  if (!candidate) return null;

  const source = await ensureSource(candidate);

  if (!candidate.draftImagePath) {
    const permitted = source.imagePolicy === "allow";

    const sourceImage = permitted
      ? (candidate.imageUrl ? await saveImageFromUrl(candidate.imageUrl) : null) ??
        (await saveImageFromArticle(candidate.link))
      : null;

    const saved = sourceImage ?? (await generatePlaceholderImage(candidate.title));
    const origin = sourceImage ? "source_permitted" : "generated";

    await db
      .update(feedCandidates)
      .set({
        draftImagePath: saved.path,
        draftImageAlt: candidate.title,
        draftImageWidth: saved.width,
        draftImageHeight: saved.height,
        draftImageBlurDataUrl: saved.blurDataURL,
        draftImageOrigin: origin,
        draftImageCredit: sourceImage ? candidate.sourceName : null,
      })
      .where(eq(feedCandidates.id, id));
  }

  return { sourceId: source.id };
}

export async function getInboxCandidateById(id: string) {
  const [row] = await db.select().from(feedCandidates).where(eq(feedCandidates.id, id)).limit(1);
  return row ?? null;
}
