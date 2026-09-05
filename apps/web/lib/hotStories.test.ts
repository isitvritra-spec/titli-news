import assert from "node:assert/strict";
import test from "node:test";

import { rankHotStorySignals, type HotStoryEvent } from "./hotStories";

test("meaningful dwell outranks shallow views", () => {
  const events: HotStoryEvent[] = [
    ...Array.from({ length: 8 }, (): HotStoryEvent => ({
      cardId: "viewed",
      installationId: "reader-a",
      eventType: "card_view",
      durationMs: null,
    })),
    {
      cardId: "read",
      installationId: "reader-b",
      eventType: "card_dwell",
      durationMs: 90_000,
    },
  ];

  const ranked = rankHotStorySignals(events);
  assert.equal(ranked[0]?.cardId, "read");
  assert.equal(ranked[0]?.reason, "Most read");
});

test("dwell is capped per reader so one open screen cannot dominate", () => {
  const ranked = rankHotStorySignals([
    { cardId: "one-reader", installationId: "reader-a", eventType: "card_dwell", durationMs: 300_000 },
    { cardId: "one-reader", installationId: "reader-a", eventType: "card_dwell", durationMs: 300_000 },
    { cardId: "shared-interest", installationId: "reader-b", eventType: "card_dwell", durationMs: 100_000 },
    { cardId: "shared-interest", installationId: "reader-c", eventType: "card_dwell", durationMs: 100_000 },
  ]);

  assert.equal(ranked[0]?.cardId, "shared-interest");
  assert.equal(ranked.find((item) => item.cardId === "one-reader")?.averageDwellSeconds, 180);
});
