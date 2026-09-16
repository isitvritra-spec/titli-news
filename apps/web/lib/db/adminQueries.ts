import { eq } from "drizzle-orm";
import { db } from "./client";
import { cardReadings, cards, cardStateBreakdown, cardTopics, pulseMetrics, sources, topics } from "./schema";

export type CardInput = {
  cardType: "news" | "data";
  status: "draft" | "published" | "archived";
  headline: string;
  slug: string;
  body: string;
  imagePath: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageBlurDataUrl: string;
  imageOrigin: "licensed_stock" | "source_permitted" | "own_upload" | "generated" | "unknown";
  imageCredit?: string;
  imageLicence?: string;
  imageSourceUrl?: string;
  sourceHeadline?: string;
  publishedAt: string;
  isContested: boolean;
  contestedNote?: string;
  correctionNote?: string;
  correctedAt?: string;
  deepDiveBody?: string;
  topicIds: string[];
  primaryTopicId: string;
  sourceId?: string;
  sourceDate?: string;
  aiGenerated?: boolean;
  aiReviewed?: boolean;
  originalityMaxRun?: number;
  originalitySpans?: string[];
  metricValue?: number;
  metricUnit?: string;
  surveySourceId?: string;
  methodologyNote?: string;
  readings?: { year: number; value: number }[];
  stateBreakdown?: { state: string; value: number; year?: number }[];
};

function cardRowFromInput(input: CardInput) {
  return {
    cardType: input.cardType,
    status: input.status,
    primaryTopicId: input.primaryTopicId,
    headline: input.headline,
    slug: input.slug,
    body: input.body,
    imagePath: input.imagePath,
    imageAlt: input.imageAlt,
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
    imageBlurDataUrl: input.imageBlurDataUrl,
    imageOrigin: input.imageOrigin,
    imageCredit: input.imageCredit || null,
    imageLicence: input.imageLicence || null,
    imageSourceUrl: input.imageSourceUrl || null,
    publishedAt: input.publishedAt,
    reviewedAt: input.status === "published" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
    isContested: input.isContested,
    contestedNote: input.isContested ? input.contestedNote ?? null : null,
    correctionNote: input.correctionNote || null,
    correctedAt: input.correctionNote ? input.correctedAt ?? null : null,
    deepDiveBody: input.deepDiveBody || null,
    aiGenerated: input.aiGenerated ?? false,
    aiReviewed: input.aiReviewed ?? false,
    originalityMaxRun: input.originalityMaxRun ?? null,
    originalitySpans:
      input.originalitySpans && input.originalitySpans.length > 0
        ? JSON.stringify(input.originalitySpans)
        : null,
    sourceId: input.cardType === "news" ? input.sourceId ?? null : null,
    sourceDate: input.cardType === "news" ? input.sourceDate ?? null : null,
    sourceHeadline: input.cardType === "news" ? input.sourceHeadline || null : null,
    metricValue: input.cardType === "data" ? input.metricValue ?? null : null,
    metricUnit: input.cardType === "data" ? input.metricUnit ?? null : null,
    surveySourceId: input.cardType === "data" ? input.surveySourceId ?? null : null,
    methodologyNote: input.cardType === "data" ? input.methodologyNote ?? null : null,
  };
}

async function replaceCardChildren(cardId: string, input: CardInput) {
  await db.delete(cardTopics).where(eq(cardTopics.cardId, cardId));
  await db.delete(cardReadings).where(eq(cardReadings.cardId, cardId));
  await db.delete(cardStateBreakdown).where(eq(cardStateBreakdown.cardId, cardId));

  if (input.topicIds.length > 0) {
    await db.insert(cardTopics).values(input.topicIds.map((topicId) => ({ cardId, topicId })));
  }
  if (input.cardType === "data" && input.readings && input.readings.length > 0) {
    await db.insert(cardReadings).values(
      input.readings.map((r) => ({ cardId, year: r.year, value: r.value }))
    );
  }
  if (input.cardType === "data" && input.stateBreakdown && input.stateBreakdown.length > 0) {
    await db.insert(cardStateBreakdown).values(
      input.stateBreakdown.map((s) => ({ cardId, state: s.state, value: s.value, year: s.year ?? null }))
    );
  }
}

export async function createCard(input: CardInput): Promise<string> {
  const [row] = await db.insert(cards).values(cardRowFromInput(input)).returning({ id: cards.id });
  await replaceCardChildren(row.id, input);
  return row.id;
}

export async function updateCard(id: string, input: CardInput): Promise<void> {
  await db.update(cards).set(cardRowFromInput(input)).where(eq(cards.id, id));
  await replaceCardChildren(id, input);
}

export async function deleteCard(id: string): Promise<void> {
  await db.delete(cards).where(eq(cards.id, id));
}

export async function listCardsForAdmin() {
  return db
    .select({
      id: cards.id,
      cardType: cards.cardType,
      headline: cards.headline,
      slug: cards.slug,
      publishedAt: cards.publishedAt,
      status: cards.status,
      primaryTopicId: cards.primaryTopicId,
      sourceId: cards.sourceId,
      surveySourceId: cards.surveySourceId,
    })
    .from(cards)
    .orderBy(cards.publishedAt);
}

export async function getCardForEdit(id: string) {
  const [row] = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  if (!row) return null;

  const [topicLinks, readingRows, stateRows] = await Promise.all([
    db.select({ topicId: cardTopics.topicId }).from(cardTopics).where(eq(cardTopics.cardId, id)),
    db.select().from(cardReadings).where(eq(cardReadings.cardId, id)),
    db.select().from(cardStateBreakdown).where(eq(cardStateBreakdown.cardId, id)),
  ]);

  return {
    ...row,
    // Stored as a JSON string; the form needs it as an array.
    originalitySpans: parseSpans(row.originalitySpans),
    topicIds: topicLinks.map((t) => t.topicId),
    readings: readingRows.map((r) => ({ year: r.year, value: r.value })),
    stateBreakdown: stateRows.map((s) => ({ state: s.state, value: s.value, year: s.year ?? undefined })),
  };
}

function parseSpans(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export async function createTopic(input: { title: string; slug: string; shortDescription?: string; sortOrder?: number }) {
  const [row] = await db
    .insert(topics)
    .values({
      title: input.title,
      slug: input.slug,
      shortDescription: input.shortDescription || null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning({ id: topics.id });
  return row.id;
}

export async function createSource(input: {
  name: string;
  kind: "news" | "data";
  url: string;
  publisher?: string;
  trustTier?: "primary" | "trusted" | "discovery";
  sourceType?: "official" | "specialist" | "mainstream" | "data" | "aggregator";
  feedUrl?: string;
  ingestMethod?: "rss" | "api" | "manual";
  editorialNotes?: string;
}) {
  const [row] = await db
    .insert(sources)
    .values({
      name: input.name,
      kind: input.kind,
      url: input.url,
      publisher: input.publisher || null,
      trustTier: input.trustTier ?? "trusted",
      sourceType: input.sourceType ?? (input.kind === "data" ? "data" : "mainstream"),
      feedUrl: input.feedUrl || null,
      ingestMethod: input.ingestMethod ?? "manual",
      editorialNotes: input.editorialNotes || null,
    })
    .returning({ id: sources.id });
  return row.id;
}

export async function updateSourcePolicy(
  id: string,
  policy: {
    imagePolicy?: "allow" | "deny" | "manual";
    allowsTextFetch?: boolean;
    attributionRequired?: boolean;
    licenceNote?: string;
  },
): Promise<boolean> {
  const [row] = await db
    .update(sources)
    .set(policy)
    .where(eq(sources.id, id))
    .returning({ id: sources.id });
  return Boolean(row);
}

export async function listPulseMetricsForAdmin() {
  return db.select().from(pulseMetrics).orderBy(pulseMetrics.sortOrder);
}

export async function updatePulseMetric(
  key: string,
  input: {
    label: string;
    value: number;
    unit: string;
    periodLabel: string;
    sourceName: string;
    sourceUrl: string;
    methodology: string;
    isActive: boolean;
  }
) {
  await db
    .update(pulseMetrics)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(pulseMetrics.key, key));
}
