import assert from "node:assert/strict";
import test from "node:test";

import { scoreRelevance, type RelevanceInput } from "./relevance";

function input(title: string, over: Partial<RelevanceInput> = {}): RelevanceInput {
  return {
    title,
    sourceTrustTier: over.sourceTrustTier ?? "discovery",
    sourceType: over.sourceType ?? "aggregator",
  };
}

test("keeps a clearly on-topic aggregator item", () => {
  const result = scoreRelevance(input("Women's labour force participation rises to 41.7%"));
  assert.equal(result.keep, true);
  assert.equal(result.topicGuess, "work-money");
  assert.ok(result.score > 0);
});

test("rejects an off-topic item from the firehose", () => {
  const result = scoreRelevance(input("India's men's cricket team wins the series decider"));
  assert.equal(result.keep, false);
  assert.equal(result.score, 0);
  assert.equal(result.topicGuess, null);
});

test("keeps a women-focused specialist source even without an obvious keyword", () => {
  const result = scoreRelevance(
    input("Inside the long fight for recognition at the state assembly", {
      sourceType: "specialist",
      sourceTrustTier: "trusted",
    }),
  );
  assert.equal(result.keep, true);
});

test("a primary official source outscores a discovery aggregator on the same story", () => {
  const official = scoreRelevance(
    input("Maternity Benefit Act leave rarely reaches women informal workers", {
      sourceTrustTier: "primary",
      sourceType: "official",
    }),
  );
  const aggregator = scoreRelevance(
    input("Maternity Benefit Act leave rarely reaches women informal workers", {
      sourceTrustTier: "discovery",
      sourceType: "aggregator",
    }),
  );
  assert.ok(official.score > aggregator.score);
});

test("maps a safety story to safety-justice", () => {
  const result = scoreRelevance(input("Court reserves verdict on the marital rape exception for women"));
  assert.equal(result.keep, true);
  assert.equal(result.topicGuess, "safety-justice");
});

test("maps a rural story to rural-grassroots", () => {
  const result = scoreRelevance(
    input("Anganwadi and ASHA women workers demand recognition in the village scheme"),
  );
  assert.equal(result.keep, true);
  assert.equal(result.topicGuess, "rural-grassroots");
});
