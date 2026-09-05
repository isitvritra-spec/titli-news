import assert from "node:assert/strict";
import test from "node:test";

import {
  summarizeEditorialDashboard,
  type DashboardEvent,
  type EditionComposition,
} from "./analyticsSummary";

test("editorial dashboard deduplicates readers and reports trust and diversity", () => {
  const events: DashboardEvent[] = [
    event("reader-a", "edition_start", "edition-1"),
    event("reader-a", "edition_start", "edition-1"),
    event("reader-a", "card_view", "edition-1", "card-1"),
    event("reader-a", "card_view", "edition-1", "card-2"),
    event("reader-a", "edition_complete", "edition-1"),
    event("reader-b", "edition_start", "edition-1"),
    event("reader-b", "card_view", "edition-1", "card-1"),
    event("reader-b", "less_like_this", "edition-1", "card-2"),
    event("reader-b", "source_open", "edition-1", "card-1"),
    event("reader-c", "edition_start", "edition-1"),
  ];
  const composition: EditionComposition[] = [
    card("card-1", "topic-1", "source-1", "Primary source", "primary"),
    {
      ...card("card-2", "topic-2", "source-2", "Trusted source", "trusted"),
      correctionNote: "The original figure was corrected.",
      correctedAt: "2026-09-02T04:00:00.000Z",
    },
  ];

  const dashboard = summarizeEditorialDashboard(events, composition);

  assert.equal(dashboard.overview.activeReaders, 3);
  assert.equal(dashboard.overview.editionsStarted, 3);
  assert.equal(dashboard.overview.editionsCompleted, 1);
  assert.equal(dashboard.overview.completionRate, 1 / 3);
  assert.equal(dashboard.overview.medianCardsRead, 1);
  assert.equal(dashboard.overview.primarySourceShare, 0.5);
  assert.equal(dashboard.overview.correctionRate, 0.5);
  assert.equal(dashboard.editions[0]?.topicDiversity, 2);
  assert.equal(dashboard.editions[0]?.sourceDiversity, 2);
  assert.equal(dashboard.sources[0]?.name, "Primary source");
  assert.equal(dashboard.sources[0]?.sourceOpens, 1);
  assert.equal(dashboard.corrections[0]?.cardId, "card-2");
});

function event(
  installationId: string,
  eventType: DashboardEvent["eventType"],
  editionId: string,
  cardId: string | null = null,
): DashboardEvent {
  return { installationId, eventType, editionId, cardId, position: null };
}

function card(
  cardId: string,
  topicId: string,
  sourceId: string,
  sourceName: string,
  trustTier: EditionComposition["trustTier"],
): EditionComposition {
  return {
    editionId: "edition-1",
    editionDate: "2026-09-02",
    version: 1,
    cardId,
    headline: `Headline ${cardId}`,
    slug: `headline-${cardId}`,
    topicId,
    sourceId,
    sourceName,
    trustTier,
    correctionNote: null,
    correctedAt: null,
  };
}
