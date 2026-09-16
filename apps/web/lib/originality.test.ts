import assert from "node:assert/strict";
import test from "node:test";

import {
  findVerbatimRuns,
  normalizedHeadlinesMatch,
  remainingSpans,
} from "./originality";

const SOURCE =
  "The Ministry of Rural Development reported that more than one crore women in " +
  "self-help group households have crossed the annual income benchmark set by the scheme.";

test("a headline copied verbatim is flagged, punctuation and case aside", () => {
  assert.equal(
    normalizedHeadlinesMatch(
      "Women's participation rises to 41.7%",
      "women's participation rises to 41.7%!",
    ),
    true,
  );
});

test("a genuinely rewritten headline is not flagged", () => {
  assert.equal(
    normalizedHeadlinesMatch(
      "More women cross the income line under the rural scheme",
      "Ministry reports one crore women past the benchmark",
    ),
    false,
  );
});

test("a long verbatim run copied from the source is detected", () => {
  const body =
    "In a welcome sign, more than one crore women in self-help group households have " +
    "crossed the income line this year.";
  const result = findVerbatimRuns(body, SOURCE);
  assert.ok(result.maxRun >= 8, `maxRun was ${result.maxRun}`);
  assert.ok(result.spans.some((span) => span.includes("crore women in self help group households")));
});

test("a genuine paraphrase is not flagged", () => {
  const body =
    "Government figures suggest a large number of rural women have reached a yearly " +
    "earnings target through a livelihoods programme.";
  const result = findVerbatimRuns(body, SOURCE);
  assert.equal(result.maxRun, 0);
  assert.deepEqual(result.spans, []);
});

test("remainingSpans clears once the editor rewrites the copied fragment", () => {
  const spans = ["more than one crore women in self help group households"];
  const stillCopied =
    "Reportedly more than one crore women in self-help group households now earn more.";
  const rewritten =
    "Government data points to over ten million rural women earning above the line.";
  assert.equal(remainingSpans(stillCopied, spans).length, 1);
  assert.equal(remainingSpans(rewritten, spans).length, 0);
});
