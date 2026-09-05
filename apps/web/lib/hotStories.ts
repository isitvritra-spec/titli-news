import type { AnalyticsEventType } from "@repo/api-client";

export type HotStoryEvent = {
  cardId: string;
  installationId: string;
  eventType: AnalyticsEventType;
  durationMs: number | null;
};

export type HotStorySignal = {
  cardId: string;
  score: number;
  reason: "Most read" | "Most opened" | "Sources checked";
  averageDwellSeconds: number;
  readerCount: number;
};

type ReaderSignal = {
  cardId: string;
  installationId: string;
  dwellSeconds: number;
  views: number;
  detailOpens: number;
  sourceOpens: number;
  saves: number;
  shares: number;
};

const MAX_DWELL_SECONDS_PER_READER = 180;

export function rankHotStorySignals(events: HotStoryEvent[]): HotStorySignal[] {
  const byReader = new Map<string, ReaderSignal>();

  for (const event of events) {
    const key = `${event.cardId}:${event.installationId}`;
    const signal = byReader.get(key) ?? {
      cardId: event.cardId,
      installationId: event.installationId,
      dwellSeconds: 0,
      views: 0,
      detailOpens: 0,
      sourceOpens: 0,
      saves: 0,
      shares: 0,
    };

    if (event.eventType === "card_dwell" && event.durationMs != null) {
      signal.dwellSeconds = Math.min(
        MAX_DWELL_SECONDS_PER_READER,
        signal.dwellSeconds + event.durationMs / 1_000,
      );
    }
    if (event.eventType === "card_view") signal.views = Math.min(signal.views + 1, 3);
    if (event.eventType === "card_detail_open") signal.detailOpens = 1;
    if (event.eventType === "source_open") signal.sourceOpens = 1;
    if (event.eventType === "card_save") signal.saves = 1;
    if (event.eventType === "card_share") signal.shares = 1;
    byReader.set(key, signal);
  }

  const byCard = new Map<string, ReaderSignal[]>();
  for (const signal of byReader.values()) {
    const readers = byCard.get(signal.cardId) ?? [];
    readers.push(signal);
    byCard.set(signal.cardId, readers);
  }

  return [...byCard.entries()]
    .map(([cardId, readers]) => {
      const dwellReaders = readers.filter((reader) => reader.dwellSeconds > 0);
      const dwellSeconds = dwellReaders.reduce((total, reader) => total + reader.dwellSeconds, 0);
      const detailOpens = readers.reduce((total, reader) => total + reader.detailOpens, 0);
      const sourceOpens = readers.reduce((total, reader) => total + reader.sourceOpens, 0);
      const score = readers.reduce(
        (total, reader) => total
          + reader.dwellSeconds
          + reader.views * 3
          + reader.detailOpens * 20
          + reader.sourceOpens * 25
          + reader.saves * 18
          + reader.shares * 15,
        0,
      );
      const averageDwellSeconds = dwellReaders.length > 0
        ? Math.round(dwellSeconds / dwellReaders.length)
        : 0;
      const reason = averageDwellSeconds >= 45
        ? "Most read" as const
        : sourceOpens > detailOpens
          ? "Sources checked" as const
          : "Most opened" as const;

      return {
        cardId,
        score,
        reason,
        averageDwellSeconds,
        readerCount: readers.length,
      };
    })
    .sort((a, b) => b.score - a.score || a.cardId.localeCompare(b.cardId));
}
