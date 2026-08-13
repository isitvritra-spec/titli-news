import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./client";
import { feedCandidates, sources } from "./schema";
import { fetchAllCandidates, type FeedCandidateInput } from "../rss";
import { generatePlaceholderImage, saveImageFromUrl } from "../images";

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

/**
 * Idempotent: if the candidate's image was already downloaded+processed on
 * a previous click, this is a no-op. Also ensures a matching `source` row
 * exists so the new-card form has something to select.
 *
 * Every candidate ends up with *some* draft image: the real source image
 * when there is one and the download succeeds, otherwise a branded
 * placeholder — several sources (PIB, Google News, some Behanbox items)
 * never provide an image at all, and a failed/blocked download shouldn't
 * leave the editor blocked on a manual upload either.
 */
export async function prepareDraft(id: string): Promise<{ sourceId: string } | null> {
  const [candidate] = await db.select().from(feedCandidates).where(eq(feedCandidates.id, id)).limit(1);
  if (!candidate) return null;

  if (!candidate.draftImagePath) {
    const saved = (candidate.imageUrl && (await saveImageFromUrl(candidate.imageUrl))) || (await generatePlaceholderImage(candidate.title));

    await db
      .update(feedCandidates)
      .set({
        draftImagePath: saved.path,
        draftImageAlt: candidate.title,
        draftImageWidth: saved.width,
        draftImageHeight: saved.height,
        draftImageBlurDataUrl: saved.blurDataURL,
      })
      .where(eq(feedCandidates.id, id));
  }

  const [existingSource] = await db
    .select()
    .from(sources)
    .where(eq(sources.name, candidate.sourceName))
    .limit(1);

  if (existingSource) return { sourceId: existingSource.id };

  const [created] = await db
    .insert(sources)
    .values({ name: candidate.sourceName, kind: "news", url: candidate.sourceSiteUrl })
    .returning({ id: sources.id });

  return { sourceId: created.id };
}

export async function getInboxCandidateById(id: string) {
  const [row] = await db.select().from(feedCandidates).where(eq(feedCandidates.id, id)).limit(1);
  return row ?? null;
}
