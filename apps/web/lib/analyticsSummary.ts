import type { AnalyticsEventType } from "@repo/api-client";

export type DashboardEvent = {
  installationId: string;
  eventType: AnalyticsEventType;
  editionId: string | null;
  cardId: string | null;
  position: number | null;
};

export type EditionComposition = {
  editionId: string;
  editionDate: string;
  version: number;
  cardId: string;
  headline: string;
  slug: string;
  topicId: string | null;
  sourceId: string | null;
  sourceName: string;
  trustTier: "primary" | "trusted" | "discovery";
  correctionNote: string | null;
  correctedAt: string | null;
};

export type EditorialDashboard = ReturnType<typeof summarizeEditorialDashboard>;

export function summarizeEditorialDashboard(
  events: readonly DashboardEvent[],
  composition: readonly EditionComposition[],
) {
  const activeReaders = new Set(events.map((event) => event.installationId));
  const starts = uniqueReaderEditions(events, "edition_start");
  const completions = uniqueReaderEditions(events, "edition_complete");
  const cardsReadByReaderEdition = new Map<string, Set<string>>();

  for (const event of events) {
    if (event.eventType !== "card_view" || !event.editionId || !event.cardId) continue;
    const key = readerEditionKey(event.installationId, event.editionId);
    const cards = cardsReadByReaderEdition.get(key) ?? new Set<string>();
    cards.add(event.cardId);
    cardsReadByReaderEdition.set(key, cards);
  }
  for (const startedReaderEdition of starts) {
    if (!cardsReadByReaderEdition.has(startedReaderEdition)) {
      cardsReadByReaderEdition.set(startedReaderEdition, new Set());
    }
  }

  const correctedCards = new Map(
    composition
      .filter((item) => item.correctionNote && item.correctedAt)
      .map((item) => [item.cardId, item]),
  );
  const totalEditionCards = composition.length;
  const primaryEditionCards = composition.filter((item) => item.trustTier === "primary").length;

  return {
    overview: {
      activeReaders: activeReaders.size,
      editionsStarted: starts.size,
      editionsCompleted: completions.size,
      completionRate: ratio(completions.size, starts.size),
      completedEditionsPerReader: ratio(completions.size, activeReaders.size),
      medianCardsRead: median([...cardsReadByReaderEdition.values()].map((cards) => cards.size)),
      lessLikeThis: events.filter((event) => event.eventType === "less_like_this").length,
      primarySourceShare: ratio(primaryEditionCards, totalEditionCards),
      correctionRate: ratio(correctedCards.size, new Set(composition.map((item) => item.cardId)).size),
    },
    editions: summarizeEditions(events, composition),
    sources: summarizeSources(events, composition),
    corrections: [...correctedCards.values()]
      .map((item) => ({
        cardId: item.cardId,
        headline: item.headline,
        slug: item.slug,
        correctionNote: item.correctionNote!,
        correctedAt: item.correctedAt!,
      }))
      .sort((a, b) => b.correctedAt.localeCompare(a.correctedAt)),
  };
}

function summarizeEditions(
  events: readonly DashboardEvent[],
  composition: readonly EditionComposition[],
) {
  const editions = new Map<string, EditionComposition[]>();
  for (const item of composition) {
    const cards = editions.get(item.editionId) ?? [];
    cards.push(item);
    editions.set(item.editionId, cards);
  }

  return [...editions.entries()]
    .map(([editionId, cards]) => {
      const starts = uniqueReaderEditions(
        events.filter((event) => event.editionId === editionId),
        "edition_start",
      );
      const completions = uniqueReaderEditions(
        events.filter((event) => event.editionId === editionId),
        "edition_complete",
      );
      return {
        id: editionId,
        editionDate: cards[0]!.editionDate,
        version: cards[0]!.version,
        starts: starts.size,
        completions: completions.size,
        completionRate: ratio(completions.size, starts.size),
        topicDiversity: new Set(cards.flatMap((item) => item.topicId ? [item.topicId] : [])).size,
        sourceDiversity: new Set(cards.flatMap((item) => item.sourceId ? [item.sourceId] : [])).size,
        primarySourceShare: ratio(
          cards.filter((item) => item.trustTier === "primary").length,
          cards.length,
        ),
        corrections: cards.filter((item) => item.correctionNote && item.correctedAt).length,
      };
    })
    .sort((a, b) => b.editionDate.localeCompare(a.editionDate));
}

function summarizeSources(
  events: readonly DashboardEvent[],
  composition: readonly EditionComposition[],
) {
  const cardToSource = new Map(composition.map((item) => [item.cardId, item.sourceId]));
  const sourceOpens = new Map<string, number>();
  for (const event of events) {
    if (event.eventType !== "source_open" || !event.cardId) continue;
    const sourceId = cardToSource.get(event.cardId);
    if (sourceId) sourceOpens.set(sourceId, (sourceOpens.get(sourceId) ?? 0) + 1);
  }

  const sources = new Map<
    string,
    { id: string; name: string; trustTier: EditionComposition["trustTier"]; cardIds: Set<string> }
  >();
  for (const item of composition) {
    if (!item.sourceId) continue;
    const source = sources.get(item.sourceId) ?? {
      id: item.sourceId,
      name: item.sourceName,
      trustTier: item.trustTier,
      cardIds: new Set<string>(),
    };
    source.cardIds.add(item.cardId);
    sources.set(item.sourceId, source);
  }

  return [...sources.values()]
    .map((source) => ({
      id: source.id,
      name: source.name,
      trustTier: source.trustTier,
      cards: source.cardIds.size,
      sourceOpens: sourceOpens.get(source.id) ?? 0,
    }))
    .sort((a, b) => trustOrder(a.trustTier) - trustOrder(b.trustTier) || b.cards - a.cards);
}

function uniqueReaderEditions(events: readonly DashboardEvent[], type: AnalyticsEventType) {
  return new Set(
    events.flatMap((event) =>
      event.eventType === type && event.editionId
        ? [readerEditionKey(event.installationId, event.editionId)]
        : [],
    ),
  );
}

function readerEditionKey(installationId: string, editionId: string) {
  return `${installationId}:${editionId}`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function trustOrder(tier: EditionComposition["trustTier"]): number {
  if (tier === "primary") return 0;
  if (tier === "trusted") return 1;
  return 2;
}
