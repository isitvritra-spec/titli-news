import { and, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import type { AnalyticsEventInput, HotStory } from "@repo/api-client";

import { db } from "./client";
import {
  analyticsEvents,
  cards,
  editionCards,
  editions,
  sources,
  topics,
} from "./schema";
import { summarizeEditorialDashboard } from "../analyticsSummary";
import { rankHotStorySignals } from "../hotStories";
import { hydrateCards } from "./queries";

export async function insertAnalyticsEvents(events: AnalyticsEventInput[]): Promise<number> {
  if (events.length === 0) return 0;

  const cardIds = [...new Set(events.flatMap((event) => (event.cardId ? [event.cardId] : [])))];
  const editionIds = [
    ...new Set(events.flatMap((event) => (event.editionId ? [event.editionId] : []))),
  ];
  const topicSlugs = [
    ...new Set(events.flatMap((event) => (event.topicSlug ? [event.topicSlug] : []))),
  ];

  const [cardRows, editionRows, topicRows] = await Promise.all([
    cardIds.length > 0
      ? db
          .select({ id: cards.id, primaryTopicId: cards.primaryTopicId })
          .from(cards)
          .where(inArray(cards.id, cardIds))
      : [],
    editionIds.length > 0
      ? db.select({ id: editions.id }).from(editions).where(inArray(editions.id, editionIds))
      : [],
    topicSlugs.length > 0
      ? db
          .select({ id: topics.id, slug: topics.slug })
          .from(topics)
          .where(inArray(topics.slug, topicSlugs))
      : [],
  ]);

  const cardById = new Map(cardRows.map((row) => [row.id, row]));
  const validEditionIds = new Set(editionRows.map((row) => row.id));
  const topicBySlug = new Map(topicRows.map((row) => [row.slug, row.id]));

  await db.insert(analyticsEvents).values(
    events.map((event) => {
      const card = event.cardId ? cardById.get(event.cardId) : undefined;
      return {
        installationId: event.installationId,
        sessionId: event.sessionId,
        eventType: event.eventType,
        editionId: event.editionId && validEditionIds.has(event.editionId) ? event.editionId : null,
        cardId: card?.id ?? null,
        primaryTopicId:
          card?.primaryTopicId ?? (event.topicSlug ? topicBySlug.get(event.topicSlug) : undefined) ?? null,
        topicSlug: event.topicSlug ?? null,
        durationMs: event.durationMs ?? null,
        position: event.position ?? null,
        occurredAt: event.occurredAt,
      };
    })
  );

  return events.length;
}

export type GenreAnalytics = {
  id: string;
  title: string;
  views: number;
  detailOpens: number;
  saves: number;
  shares: number;
  sourceOpens: number;
  averageDwellSeconds: number;
  activeReaders: number;
};

export async function getGenreAnalytics(days = 30): Promise<GenreAnalytics[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows = await db
    .select({
      topicId: topics.id,
      title: topics.title,
      eventType: analyticsEvents.eventType,
      durationMs: analyticsEvents.durationMs,
      installationId: analyticsEvents.installationId,
    })
    .from(analyticsEvents)
    .innerJoin(topics, eq(analyticsEvents.primaryTopicId, topics.id))
    .where(and(gte(analyticsEvents.occurredAt, since), eq(topics.isActive, true)));

  const byTopic = new Map<
    string,
    GenreAnalytics & { dwellTotal: number; dwellCount: number; readers: Set<string> }
  >();

  for (const row of rows) {
    const current = byTopic.get(row.topicId) ?? {
      id: row.topicId,
      title: row.title,
      views: 0,
      detailOpens: 0,
      saves: 0,
      shares: 0,
      sourceOpens: 0,
      averageDwellSeconds: 0,
      activeReaders: 0,
      dwellTotal: 0,
      dwellCount: 0,
      readers: new Set<string>(),
    };

    current.readers.add(row.installationId);
    if (row.eventType === "card_view") current.views += 1;
    if (row.eventType === "card_detail_open") current.detailOpens += 1;
    if (row.eventType === "card_save") current.saves += 1;
    if (row.eventType === "card_share") current.shares += 1;
    if (row.eventType === "source_open") current.sourceOpens += 1;
    if (row.eventType === "card_dwell" && row.durationMs != null) {
      current.dwellTotal += row.durationMs;
      current.dwellCount += 1;
    }
    byTopic.set(row.topicId, current);
  }

  return [...byTopic.values()]
    .map(({ dwellTotal, dwellCount, readers, ...metric }) => ({
      ...metric,
      averageDwellSeconds: dwellCount > 0 ? Math.round(dwellTotal / dwellCount / 100) / 10 : 0,
      activeReaders: readers.size,
    }))
    .sort((a, b) => b.views - a.views);
}

export async function getHotStories(
  options: { excludeEditionId?: string; days?: number; limit?: number } = {},
): Promise<HotStory[]> {
  const since = new Date(Date.now() - (options.days ?? 7) * 86_400_000).toISOString();
  const limit = options.limit ?? 6;
  const excludedRows = options.excludeEditionId
    ? await db
        .select({ cardId: editionCards.cardId })
        .from(editionCards)
        .where(eq(editionCards.editionId, options.excludeEditionId))
    : [];
  const excludedIds = new Set(excludedRows.map((row) => row.cardId));
  const eventRows = await db
    .select({
      cardId: analyticsEvents.cardId,
      installationId: analyticsEvents.installationId,
      eventType: analyticsEvents.eventType,
      durationMs: analyticsEvents.durationMs,
    })
    .from(analyticsEvents)
    .where(and(gte(analyticsEvents.occurredAt, since), isNotNull(analyticsEvents.cardId)));
  const rankedSignals = rankHotStorySignals(
    eventRows.flatMap((row) => row.cardId ? [{ ...row, cardId: row.cardId }] : []),
  ).filter((signal) => !excludedIds.has(signal.cardId));
  const rankedIds = rankedSignals.map((signal) => signal.cardId);

  const [rankedRows, recentRows] = await Promise.all([
    rankedIds.length > 0
      ? db
          .select()
          .from(cards)
          .where(and(eq(cards.status, "published"), inArray(cards.id, rankedIds)))
      : [],
    db
      .select()
      .from(cards)
      .where(eq(cards.status, "published"))
      .orderBy(desc(cards.publishedAt))
      .limit(limit + excludedIds.size + rankedIds.length),
  ]);
  const rowsById = new Map([...rankedRows, ...recentRows].map((row) => [row.id, row]));
  const orderedIds = [
    ...rankedIds.filter((id) => rowsById.has(id)),
    ...recentRows.map((row) => row.id).filter((id) => !rankedIds.includes(id)),
  ].filter((id) => !excludedIds.has(id)).slice(0, limit);
  const hydrated = await hydrateCards(
    orderedIds.flatMap((id) => {
      const row = rowsById.get(id);
      return row ? [row] : [];
    }),
  );
  const cardById = new Map(hydrated.map((card) => [card.id, card]));
  const signalById = new Map(rankedSignals.map((signal) => [signal.cardId, signal]));

  return orderedIds.flatMap((id) => {
    const card = cardById.get(id);
    if (!card) return [];
    const signal = signalById.get(id);
    return [{
      card,
      reason: signal?.reason ?? "Fresh from Titli",
      averageDwellSeconds: signal?.averageDwellSeconds ?? 0,
      readerCount: signal?.readerCount ?? 0,
    }];
  });
}

export async function getEditorialDashboard(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const sinceDate = since.slice(0, 10);
  const [eventRows, editionRows] = await Promise.all([
    db
      .select({
        installationId: analyticsEvents.installationId,
        eventType: analyticsEvents.eventType,
        editionId: analyticsEvents.editionId,
        cardId: analyticsEvents.cardId,
        position: analyticsEvents.position,
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.occurredAt, since)),
    db
      .select({ id: editions.id, editionDate: editions.editionDate, version: editions.version })
      .from(editions)
      .where(and(eq(editions.status, "published"), gte(editions.editionDate, sinceDate))),
  ]);

  if (editionRows.length === 0) return summarizeEditorialDashboard(eventRows, []);

  const editionIds = editionRows.map((edition) => edition.id);
  const links = await db
    .select({ editionId: editionCards.editionId, cardId: editionCards.cardId })
    .from(editionCards)
    .where(inArray(editionCards.editionId, editionIds));
  const cardIds = [...new Set(links.map((link) => link.cardId))];
  if (cardIds.length === 0) return summarizeEditorialDashboard(eventRows, []);

  const cardRows = await db
    .select({
      id: cards.id,
      headline: cards.headline,
      slug: cards.slug,
      primaryTopicId: cards.primaryTopicId,
      sourceId: cards.sourceId,
      surveySourceId: cards.surveySourceId,
      correctionNote: cards.correctionNote,
      correctedAt: cards.correctedAt,
    })
    .from(cards)
    .where(inArray(cards.id, cardIds));
  const sourceIds = [
    ...new Set(
      cardRows.flatMap((card) => {
        const sourceId = card.sourceId ?? card.surveySourceId;
        return sourceId ? [sourceId] : [];
      }),
    ),
  ];
  const sourceRows = sourceIds.length > 0
    ? await db
        .select({ id: sources.id, name: sources.name, trustTier: sources.trustTier })
        .from(sources)
        .where(inArray(sources.id, sourceIds))
    : [];

  const editionById = new Map(editionRows.map((edition) => [edition.id, edition]));
  const cardById = new Map(cardRows.map((card) => [card.id, card]));
  const sourceById = new Map(sourceRows.map((source) => [source.id, source]));
  const composition = links.flatMap((link) => {
    const edition = editionById.get(link.editionId);
    const card = cardById.get(link.cardId);
    if (!edition || !card) return [];

    const sourceId = card.sourceId ?? card.surveySourceId;
    const source = sourceId ? sourceById.get(sourceId) : undefined;
    return [{
      editionId: edition.id,
      editionDate: edition.editionDate,
      version: edition.version,
      cardId: card.id,
      headline: card.headline,
      slug: card.slug,
      topicId: card.primaryTopicId,
      sourceId: sourceId ?? null,
      sourceName: source?.name ?? "Unknown source",
      trustTier: source?.trustTier ?? "discovery" as const,
      correctionNote: card.correctionNote,
      correctedAt: card.correctedAt,
    }];
  });

  return summarizeEditorialDashboard(eventRows, composition);
}
