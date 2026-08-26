import { and, eq, gte, inArray } from "drizzle-orm";
import type { AnalyticsEventInput } from "@repo/api-client";

import { db } from "./client";
import { analyticsEvents, cards, topics } from "./schema";

export async function insertAnalyticsEvents(events: AnalyticsEventInput[]): Promise<number> {
  if (events.length === 0) return 0;

  const cardIds = [...new Set(events.flatMap((event) => (event.cardId ? [event.cardId] : [])))];
  const topicSlugs = [
    ...new Set(events.flatMap((event) => (event.topicSlug ? [event.topicSlug] : []))),
  ];

  const [cardRows, topicRows] = await Promise.all([
    cardIds.length > 0
      ? db
          .select({ id: cards.id, primaryTopicId: cards.primaryTopicId })
          .from(cards)
          .where(inArray(cards.id, cardIds))
      : [],
    topicSlugs.length > 0
      ? db
          .select({ id: topics.id, slug: topics.slug })
          .from(topics)
          .where(inArray(topics.slug, topicSlugs))
      : [],
  ]);

  const cardById = new Map(cardRows.map((row) => [row.id, row]));
  const topicBySlug = new Map(topicRows.map((row) => [row.slug, row.id]));

  await db.insert(analyticsEvents).values(
    events.map((event) => {
      const card = event.cardId ? cardById.get(event.cardId) : undefined;
      return {
        installationId: event.installationId,
        sessionId: event.sessionId,
        eventType: event.eventType,
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
