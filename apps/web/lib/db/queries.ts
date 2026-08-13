import { and, desc, eq, inArray } from "drizzle-orm";
import type { Card, CardDetail, ImageAsset, Reading, SourceRef, StateReading, Topic, TopicRef } from "@repo/api-client";

import { db } from "./client";
import { cardReadings, cards, cardStateBreakdown, cardTopics, sources, topics } from "./schema";

type CardRow = typeof cards.$inferSelect;
type SourceRow = typeof sources.$inferSelect;

function toImageAsset(row: CardRow): ImageAsset {
  return {
    url: row.imagePath,
    alt: row.imageAlt,
    width: row.imageWidth,
    height: row.imageHeight,
    blurDataURL: row.imageBlurDataUrl,
  };
}

function toSourceRef(row: SourceRow): SourceRef {
  return { name: row.name, url: row.url, publisher: row.publisher ?? undefined };
}

/**
 * Assembles full Card objects from a batch of card rows, using batched
 * IN-clause lookups for topics/sources/readings rather than per-card
 * queries (N+1 avoided, at the cost of assembling the join in JS).
 */
async function hydrateCards(cardRows: CardRow[]): Promise<Card[]> {
  if (cardRows.length === 0) return [];
  const cardIds = cardRows.map((c) => c.id);

  const sourceIds = [
    ...new Set(cardRows.flatMap((c) => [c.sourceId, c.surveySourceId].filter((x): x is string => !!x))),
  ];

  const [topicLinks, sourceRows, readingRows] = await Promise.all([
    db
      .select({ cardId: cardTopics.cardId, title: topics.title, slug: topics.slug })
      .from(cardTopics)
      .innerJoin(topics, eq(cardTopics.topicId, topics.id))
      .where(inArray(cardTopics.cardId, cardIds)),
    sourceIds.length > 0 ? db.select().from(sources).where(inArray(sources.id, sourceIds)) : [],
    db.select().from(cardReadings).where(inArray(cardReadings.cardId, cardIds)),
  ]);

  const topicsByCard = new Map<string, TopicRef[]>();
  for (const link of topicLinks) {
    const list = topicsByCard.get(link.cardId) ?? [];
    list.push({ title: link.title, slug: link.slug });
    topicsByCard.set(link.cardId, list);
  }

  const sourceById = new Map(sourceRows.map((s) => [s.id, toSourceRef(s)]));

  const readingsByCard = new Map<string, Reading[]>();
  for (const r of readingRows) {
    const list = readingsByCard.get(r.cardId) ?? [];
    list.push({ year: r.year, value: r.value });
    readingsByCard.set(r.cardId, list);
  }

  return cardRows.map((row): Card => {
    const base = {
      id: row.id,
      headline: row.headline,
      slug: row.slug,
      body: row.body,
      image: toImageAsset(row),
      topics: topicsByCard.get(row.id) ?? [],
      publishedAt: row.publishedAt,
      isContested: row.isContested,
      contestedNote: row.contestedNote ?? undefined,
    };

    if (row.cardType === "news") {
      return {
        ...base,
        cardType: "news",
        source: row.sourceId ? sourceById.get(row.sourceId)! : { name: "Unknown", url: "#" },
        sourceDate: row.sourceDate ?? row.publishedAt,
      };
    }

    return {
      ...base,
      cardType: "data",
      metric:
        row.metricValue != null && row.metricUnit
          ? { value: row.metricValue, unit: row.metricUnit }
          : undefined,
      readings: readingsByCard.get(row.id) ?? [],
      surveySource: row.surveySourceId ? sourceById.get(row.surveySourceId)! : { name: "Unknown", url: "#" },
    };
  });
}

export async function getFeed(options?: { topicSlugs?: string[] }): Promise<Card[]> {
  let cardIdsFilter: string[] | null = null;

  if (options?.topicSlugs && options.topicSlugs.length > 0) {
    const rows = await db
      .select({ cardId: cardTopics.cardId })
      .from(cardTopics)
      .innerJoin(topics, eq(cardTopics.topicId, topics.id))
      .where(inArray(topics.slug, options.topicSlugs));
    cardIdsFilter = [...new Set(rows.map((r) => r.cardId))];
    if (cardIdsFilter.length === 0) return [];
  }

  const rows = await db
    .select()
    .from(cards)
    .where(cardIdsFilter ? inArray(cards.id, cardIdsFilter) : undefined)
    .orderBy(desc(cards.publishedAt));

  return hydrateCards(rows);
}

export async function getCardBySlug(slug: string): Promise<CardDetail | null> {
  const [row] = await db.select().from(cards).where(eq(cards.slug, slug)).limit(1);
  if (!row) return null;

  const [[card], stateRows] = await Promise.all([
    hydrateCards([row]),
    db.select().from(cardStateBreakdown).where(eq(cardStateBreakdown.cardId, row.id)),
  ]);

  const stateBreakdown: StateReading[] = stateRows.map((s) => ({
    state: s.state,
    value: s.value,
    year: s.year ?? undefined,
  }));

  return {
    ...card,
    deepDiveBody: row.deepDiveBody ?? undefined,
    stateBreakdown: stateBreakdown.length > 0 ? stateBreakdown : undefined,
    methodologyNote: row.methodologyNote ?? undefined,
  };
}

export async function getAllCardSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: cards.slug }).from(cards);
  return rows.map((r) => r.slug);
}

export async function getTopics(): Promise<Topic[]> {
  const rows = await db
    .select()
    .from(topics)
    .where(eq(topics.isActive, true))
    .orderBy(topics.sortOrder);

  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    shortDescription: t.shortDescription ?? undefined,
    sortOrder: t.sortOrder,
  }));
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const [row] = await db.select().from(topics).where(eq(topics.slug, slug)).limit(1);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.shortDescription ?? undefined,
    sortOrder: row.sortOrder,
  };
}

export async function getAllSources() {
  return db.select().from(sources).orderBy(sources.name);
}
