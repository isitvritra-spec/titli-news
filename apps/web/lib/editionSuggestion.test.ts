import assert from "node:assert/strict";
import test from "node:test";

import { suggestEdition, type SuggestCard } from "./editionSuggestion";

const ROLES = ["anchor", "for_you", "number", "useful_now", "beyond_metro", "another_lens", "lift"];

function card(id: string, topic: string, source: string, type: "news" | "data" = "news"): SuggestCard {
  return { id, cardType: type, primaryTopicId: topic, sourceKey: source };
}

test("fills all seven roles from a varied pool", () => {
  const pool = [
    card("d1", "t-work", "s1", "data"),
    card("n1", "t-safety", "s2"),
    card("n2", "t-health", "s3"),
    card("n3", "t-rural", "s4"),
    card("n4", "t-education", "s5"),
    card("n5", "t-rights", "s6"),
    card("n6", "t-culture", "s7"),
    card("n7", "t-work", "s2"),
  ];
  const result = suggestEdition(pool, ROLES);
  assert.equal(Object.keys(result).length, 7);
  assert.equal(new Set(Object.values(result)).size, 7); // all distinct cards
});

test("puts a data card in the Number slot when one is available", () => {
  const pool = [
    card("d1", "t-work", "s1", "data"),
    card("n1", "t-safety", "s2"),
    card("n2", "t-health", "s3"),
    card("n3", "t-rural", "s4"),
    card("n4", "t-education", "s5"),
    card("n5", "t-rights", "s6"),
    card("n6", "t-culture", "s7"),
  ];
  const result = suggestEdition(pool, ROLES);
  assert.equal(result.number, "d1");
});

test("aims for topic spread and respects source concentration", () => {
  const pool = [
    card("a", "t-work", "s1", "data"),
    card("b", "t-safety", "s1"),
    card("c", "t-safety", "s1"),
    card("d", "t-health", "s2"),
    card("e", "t-rural", "s2"),
    card("f", "t-education", "s3"),
    card("g", "t-rights", "s3"),
    card("h", "t-culture", "s4"),
  ];
  const result = suggestEdition(pool, ROLES);
  const chosen = Object.values(result).map((id) => pool.find((c) => c.id === id)!);

  const topics = new Set(chosen.map((c) => c.primaryTopicId));
  assert.ok(topics.size >= 4, `only ${topics.size} distinct topics`);

  const perSource = new Map<string, number>();
  for (const c of chosen) perSource.set(c.sourceKey!, (perSource.get(c.sourceKey!) ?? 0) + 1);
  assert.ok([...perSource.values()].every((n) => n <= 2), "a source appears more than twice");
});

test("returns a partial result when the pool cannot fill seven roles", () => {
  const pool = [card("a", "t-work", "s1"), card("b", "t-safety", "s1"), card("c", "t-health", "s1")];
  // Source s1 capped at 2, so at most two can be placed.
  const result = suggestEdition(pool, ROLES);
  assert.ok(Object.keys(result).length <= 2);
});
