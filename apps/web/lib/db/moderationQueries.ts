import { and, asc, desc, eq } from "drizzle-orm";
import { EDITION_ROLE_CONFIG } from "@repo/api-client";

import { db } from "./client";
import { cards, editionCards, feedCandidates, storyClusters, topics } from "./schema";
import { createCard, type CardInput } from "./adminQueries";
import { getInboxCandidateById, markCandidateDrafted, prepareDraft } from "./inboxQueries";
import { ensureEditionDraft, editionDateInIndia } from "./editionQueries";
import { findVerbatimRuns } from "../originality";
import { generatePlaceholderImage, saveImageFromArticle, saveImageFromUrl } from "../images";

const DAILY_TARGET = EDITION_ROLE_CONFIG.length; // 7

export type ModerationStory = {
  clusterId: string;
  headline: string;
  sourceName: string | null;
  outletCount: number;
  topicSlug: string | null;
  previewImageUrl: string | null;
  sourceLink: string | null;
  /** When the source published it — so the moderator can tell new from old. */
  pubDate: string | null;
};

/**
 * The morning queue — the day's stories the moderator hasn't acted on, ranked
 * by the code, presented as plain cards. No scores, no policy, no roles: the
 * only things here are what a person needs to decide "publish or skip".
 */
export async function getModerationQueue(limit = 40): Promise<ModerationStory[]> {
  const rows = await db
    .select({
      clusterId: storyClusters.id,
      headline: storyClusters.canonicalTitle,
      topicSlug: storyClusters.topicGuess,
      outletCount: storyClusters.outletCount,
      relevanceScore: storyClusters.relevanceScore,
      firstSeenAt: storyClusters.firstSeenAt,
      sourceName: feedCandidates.sourceName,
      previewImageUrl: feedCandidates.imageUrl,
      sourceLink: feedCandidates.link,
      pubDate: feedCandidates.pubDate,
    })
    .from(storyClusters)
    .leftJoin(feedCandidates, eq(feedCandidates.id, storyClusters.canonicalCandidateId))
    .where(eq(storyClusters.status, "new"))
    .orderBy(desc(storyClusters.relevanceScore), desc(storyClusters.firstSeenAt))
    .limit(limit);

  return rows.map((row) => ({
    clusterId: row.clusterId,
    headline: row.headline,
    sourceName: row.sourceName,
    outletCount: row.outletCount,
    topicSlug: row.topicSlug,
    previewImageUrl: row.previewImageUrl,
    sourceLink: row.sourceLink,
    pubDate: row.pubDate,
  }));
}

/** How full today's edition is — the only progress the moderator needs to see. */
export async function todayEditionProgress(): Promise<{ chosen: number; target: number; editionDate: string }> {
  const date = editionDateInIndia();
  const edition = await ensureEditionDraft(date);
  const slots = await db.select({ id: editionCards.cardId }).from(editionCards).where(eq(editionCards.editionId, edition.id));
  return { chosen: slots.length, target: DAILY_TARGET, editionDate: date };
}

async function topicIdForSlug(slug: string | null): Promise<string> {
  if (slug) {
    const [row] = await db.select({ id: topics.id }).from(topics).where(eq(topics.slug, slug)).limit(1);
    if (row) return row.id;
  }
  const [fallback] = await db.select({ id: topics.id }).from(topics).limit(1);
  return fallback?.id ?? "";
}

async function topicTitleForSlug(slug: string): Promise<string | null> {
  const [row] = await db.select({ title: topics.title }).from(topics).where(eq(topics.slug, slug)).limit(1);
  return row?.title ?? null;
}

type ResolvedImage = {
  image: { path: string; alt: string; width: number; height: number; blurDataURL: string };
  origin: "own_upload" | "source_permitted" | "generated";
  credit?: string;
  sourceUrl?: string;
};

/** The image waterfall — editor upload → source image (with credit) → topic placeholder. */
async function resolveCardImage(
  input: PublishStoryInput,
  candidate: NonNullable<Awaited<ReturnType<typeof getInboxCandidateById>>>,
  chosenSlug: string | null,
): Promise<ResolvedImage> {
  if (input.image) {
    return { image: { ...input.image, alt: input.image.alt || input.headline }, origin: "own_upload" };
  }

  const sourced =
    (candidate.imageUrl ? await saveImageFromUrl(candidate.imageUrl) : null) ??
    (await saveImageFromArticle(candidate.link));

  if (sourced) {
    return {
      image: { path: sourced.path, alt: input.headline, width: sourced.width, height: sourced.height, blurDataURL: sourced.blurDataURL },
      origin: "source_permitted",
      credit: candidate.sourceName,
      sourceUrl: candidate.link,
    };
  }

  const topicTitle = chosenSlug ? await topicTitleForSlug(chosenSlug) : null;
  const placeholder = await generatePlaceholderImage(input.headline, topicTitle ?? undefined);
  return {
    image: { path: placeholder.path, alt: input.headline, width: placeholder.width, height: placeholder.height, blurDataURL: placeholder.blurDataURL },
    origin: "generated",
  };
}

export type PublishStoryInput = {
  clusterId: string;
  headline: string;
  summary: string;
  deepDive?: string;
  /** Topic the editor chose in the edit view; falls back to the code's guess. */
  topicSlug?: string;
  /** A replacement image the editor uploaded; falls back to the policy-selected one. */
  image?: {
    path: string;
    alt: string;
    width: number;
    height: number;
    blurDataURL: string;
  };
  /** The source text, when the AI produced this draft — used only to score originality, never stored. */
  sourceText?: string;
  aiGenerated?: boolean;
};

/**
 * The moderator's one action: turn an approved story into a published card and
 * drop it into today's edition. Everything the old admin made a human decide —
 * topic, image, edition role, position — is assigned here by code. The reader's
 * seven-card edition contract is preserved; the moderator just fills it.
 */
export async function publishStoryFromCluster(
  input: PublishStoryInput,
): Promise<{ cardId: string; chosen: number; target: number }> {
  const [cluster] = await db.select().from(storyClusters).where(eq(storyClusters.id, input.clusterId)).limit(1);
  if (!cluster?.canonicalCandidateId) throw new Error("Story not found");

  const candidateId = cluster.canonicalCandidateId;
  const prepared = await prepareDraft(candidateId);
  const candidate = await getInboxCandidateById(candidateId);
  if (!prepared || !candidate) throw new Error("Could not prepare this story");

  const chosenSlug = input.topicSlug ?? cluster.topicGuess;
  const primaryTopicId = await topicIdForSlug(chosenSlug);
  const deepDive = input.deepDive?.trim() || input.summary;
  const originality = input.sourceText ? findVerbatimRuns(input.summary, input.sourceText) : null;

  // Every card gets an image. In order: an editor upload; then the source's own
  // image (RSS thumbnail, then the article's social image) shown with a credit,
  // Inshorts-style; and only if none can be sourced, a generated placeholder
  // tinted and labelled for the topic. So there is never a blank card.
  const resolved = await resolveCardImage(input, candidate, chosenSlug);

  const cardInput: CardInput = {
    cardType: "news",
    status: "published",
    headline: input.headline,
    slug: slugify(input.headline, candidateId),
    body: input.summary,
    deepDiveBody: deepDive,
    imagePath: resolved.image.path,
    imageAlt: resolved.image.alt || input.headline,
    imageWidth: resolved.image.width,
    imageHeight: resolved.image.height,
    imageBlurDataUrl: resolved.image.blurDataURL,
    imageOrigin: resolved.origin,
    imageCredit: resolved.credit,
    imageSourceUrl: resolved.sourceUrl,
    publishedAt: new Date().toISOString(),
    isContested: false,
    topicIds: primaryTopicId ? [primaryTopicId] : [],
    primaryTopicId,
    sourceId: prepared.sourceId,
    sourceDate: candidate.pubDate ? candidate.pubDate.slice(0, 10) : undefined,
    sourceHeadline: candidate.title,
    aiGenerated: input.aiGenerated ?? false,
    aiReviewed: input.aiGenerated ?? false, // a moderator approving IS the review
    originalityMaxRun: originality?.maxRun,
    originalitySpans: originality?.spans,
  };

  const cardId = await createCard(cardInput);
  await markCandidateDrafted(candidateId, cardId);
  await db.update(storyClusters).set({ status: "dismissed" }).where(eq(storyClusters.id, cluster.id));

  const progress = await appendToTodayEdition(cardId);
  return { cardId, ...progress };
}

async function appendToTodayEdition(cardId: string): Promise<{ chosen: number; target: number }> {
  const date = editionDateInIndia();
  const edition = await ensureEditionDraft(date);

  const existing = await db
    .select()
    .from(editionCards)
    .where(eq(editionCards.editionId, edition.id))
    .orderBy(asc(editionCards.position));

  // Idempotent: if this card is somehow already placed, don't duplicate it.
  if (existing.some((slot) => slot.cardId === cardId)) {
    return { chosen: existing.length, target: DAILY_TARGET };
  }

  const position = existing.length;
  const config = EDITION_ROLE_CONFIG[position] ?? EDITION_ROLE_CONFIG[EDITION_ROLE_CONFIG.length - 1]!;

  await db.insert(editionCards).values({
    editionId: edition.id,
    cardId,
    position,
    role: config.role,
    recommendationReason: config.defaultReason,
    isMandatory: config.mandatory,
    editorialImportance: config.role === "anchor" ? 100 : 50,
    practicalUtility: config.role === "useful_now" ? 100 : 50,
    distressLevel: "low",
  });

  return { chosen: position + 1, target: DAILY_TARGET };
}

/** Remove a card the moderator changed their mind about from today's edition (before it goes live). */
export async function removeFromTodayEdition(cardId: string): Promise<void> {
  const date = editionDateInIndia();
  const edition = await ensureEditionDraft(date);
  await db
    .delete(editionCards)
    .where(and(eq(editionCards.editionId, edition.id), eq(editionCards.cardId, cardId)));
  // Re-pack positions so roles stay contiguous.
  const remaining = await db
    .select()
    .from(editionCards)
    .where(eq(editionCards.editionId, edition.id))
    .orderBy(asc(editionCards.position));
  for (let i = 0; i < remaining.length; i += 1) {
    const config = EDITION_ROLE_CONFIG[i] ?? EDITION_ROLE_CONFIG[EDITION_ROLE_CONFIG.length - 1]!;
    await db
      .update(editionCards)
      .set({ position: i, role: config.role })
      .where(and(eq(editionCards.editionId, edition.id), eq(editionCards.cardId, remaining[i]!.cardId)));
  }
}

/** The cards already chosen for today, for the "chosen" strip on the moderation screen. */
export async function getTodayChosen() {
  const date = editionDateInIndia();
  const edition = await ensureEditionDraft(date);
  return db
    .select({
      cardId: editionCards.cardId,
      position: editionCards.position,
      headline: cards.headline,
      imagePath: cards.imagePath,
    })
    .from(editionCards)
    .innerJoin(cards, eq(cards.id, editionCards.cardId))
    .where(eq(editionCards.editionId, edition.id))
    .orderBy(asc(editionCards.position));
}

function slugify(headline: string, salt: string): string {
  const base = headline
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 88);
  return `${base}-${salt.slice(0, 6)}`;
}
