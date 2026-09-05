import assert from "node:assert/strict";
import test from "node:test";
import type { Card, EditionCard, EditionRole, TodayEdition } from "@repo/api-client";

import {
  BEHAVIOR_HALF_LIFE_MS,
  MAX_TOPIC_AFFINITY,
  applyReaderSignal,
  createReaderProfile,
  getTopicAffinity,
  personalizeEdition,
  restoreEditionOrder,
} from "./personalization";

const NOW = Date.parse("2026-09-02T02:00:00.000Z");

test("explicit topics reorder only movable cards and explain the match", () => {
  const edition = makeEdition();
  edition.cards = edition.cards.map((item) => ({ ...item, practicalUtility: 50 }));
  const returningProfile = applyReaderSignal(createReaderProfile(), "healthy_dwell", ["other"], NOW);
  const result = personalizeEdition(edition, ["money"], returningProfile, NOW);

  assert.deepEqual(
    result.cards.map((item) => item.role),
    ["anchor", "useful_now", "for_you", "number", "beyond_metro", "another_lens", "lift"],
  );
  assert.equal(result.cards[0]?.role, "anchor");
  assert.equal(result.cards[5]?.role, "another_lens");
  assert.equal(result.cards[6]?.role, "lift");
  assert.equal(result.cards[1]?.recommendationReason, "Because you follow Money");
});

test("a first session keeps its first three cards editor-led", () => {
  const edition = makeEdition();
  edition.cards = edition.cards.map((item) => ({ ...item, practicalUtility: 50 }));
  const result = personalizeEdition(edition, ["rural"], createReaderProfile(), NOW);

  assert.deepEqual(
    result.cards.slice(0, 3).map((item) => item.card.id),
    edition.cards.slice(0, 3).map((item) => item.card.id),
  );
  assert.equal(result.cards[3]?.role, "beyond_metro");
});

test("mandatory and high-distress cards keep their editorial positions", () => {
  const edition = makeEdition();
  edition.cards[1] = { ...edition.cards[1]!, distressLevel: "high" };
  edition.cards[2] = { ...edition.cards[2]!, isMandatory: true };

  const result = personalizeEdition(edition, ["money"], createReaderProfile(), NOW);

  assert.equal(result.cards[1]?.card.id, edition.cards[1]?.card.id);
  assert.equal(result.cards[2]?.card.id, edition.cards[2]?.card.id);
  assert.equal(result.cards[3]?.role, "useful_now");
});

test("behavior learns slowly, repeats skips more strongly, and caps affinity", () => {
  let profile = createReaderProfile();
  profile = applyReaderSignal(profile, "fast_skip", ["health"], NOW);
  profile = applyReaderSignal(profile, "fast_skip", ["health"], NOW);
  assert.equal(profile.topics.health?.behaviorWeight, -3);
  assert.equal(profile.topics.health?.fastSkipStreak, 2);

  profile = applyReaderSignal(profile, "save", ["health"], NOW);
  assert.equal(profile.topics.health?.behaviorWeight, 1);
  assert.equal(profile.topics.health?.fastSkipStreak, 0);

  for (let index = 0; index < 5; index += 1) {
    profile = applyReaderSignal(profile, "save", ["health"], NOW);
  }
  assert.equal(profile.topics.health?.behaviorWeight, MAX_TOPIC_AFFINITY);
});

test("behavior decays at 21 days while explicit preferences do not", () => {
  const profile = applyReaderSignal(createReaderProfile(), "save", ["work"], NOW);
  const afterHalfLife = NOW + BEHAVIOR_HALF_LIFE_MS;

  assert.equal(getTopicAffinity(profile, new Set(), "work", afterHalfLife), 2);
  assert.equal(getTopicAffinity(profile, new Set(["work"]), "work", afterHalfLife), 7);
});

test("learned affinity produces a transparent recommendation reason", () => {
  const profile = applyReaderSignal(createReaderProfile(), "detail_open", ["money"], NOW);
  const result = personalizeEdition(makeEdition(), [], profile, NOW);
  const moneyCard = result.cards.find((item) => item.card.primaryGenre?.slug === "money");

  assert.equal(moneyCard?.recommendationReason, "More on Money, shaped by your reading");
});

test("a stored order restores positions only when it exactly matches the edition", () => {
  const edition = makeEdition();
  const reversedIds = edition.cards.map((item) => item.card.id).reverse();
  const restored = restoreEditionOrder(edition, reversedIds);

  assert.deepEqual(restored?.cards.map((item) => item.card.id), reversedIds);
  assert.deepEqual(restored?.cards.map((item) => item.position), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(restoreEditionOrder(edition, reversedIds.slice(1)), null);
  assert.equal(restoreEditionOrder(edition, [...reversedIds.slice(0, 6), "missing"]), null);
});

function makeEdition(): TodayEdition {
  const definitions: Array<[EditionRole, string, string]> = [
    ["anchor", "anchor", "Essential"],
    ["for_you", "work", "Work"],
    ["number", "health", "Health"],
    ["useful_now", "money", "Money"],
    ["beyond_metro", "rural", "Rural India"],
    ["another_lens", "culture", "Culture"],
    ["lift", "wins", "Women's Wins"],
  ];

  return {
    id: "edition-1",
    editionDate: "2026-09-02",
    timezone: "Asia/Kolkata",
    version: 1,
    publishedAt: new Date(NOW).toISOString(),
    cards: definitions.map(([role, topicSlug, topicTitle], position) =>
      makeEditionCard(role, position, topicSlug, topicTitle),
    ),
  };
}

function makeEditionCard(
  role: EditionRole,
  position: number,
  topicSlug: string,
  topicTitle: string,
): EditionCard {
  return {
    card: makeCard(`${position}-${role}`, topicSlug, topicTitle),
    position,
    role,
    recommendationReason: `Editorial reason for ${role}`,
    isMandatory: role === "anchor",
    editorialImportance: role === "anchor" ? 100 : 50,
    practicalUtility: role === "useful_now" ? 100 : 50,
    distressLevel: "low",
  };
}

function makeCard(id: string, topicSlug: string, topicTitle: string): Card {
  const topic = { slug: topicSlug, title: topicTitle };
  return {
    id,
    cardType: "news",
    headline: `Headline ${id}`,
    slug: `headline-${id}`,
    body: "A verified summary.",
    image: {
      url: "/image.webp",
      alt: "Test image",
      width: 1200,
      height: 800,
      blurDataURL: "data:image/webp;base64,test",
    },
    topics: [topic],
    primaryGenre: topic,
    publishedAt: new Date(NOW).toISOString(),
    source: { name: "Test Source", url: "https://example.com", trustTier: "trusted" },
    sourceDate: new Date(NOW).toISOString(),
  };
}
