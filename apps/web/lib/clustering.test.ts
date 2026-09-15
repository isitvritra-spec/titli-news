import assert from "node:assert/strict";
import test from "node:test";

import {
  clusterCandidates,
  titleSimilarity,
  titleTokens,
  type ClusterableCandidate,
} from "./clustering";

const BASE = "2026-09-15T06:00:00.000Z";

function candidate(
  id: string,
  title: string,
  sourceName: string,
  trustTier: ClusterableCandidate["trustTier"] = "trusted",
  pubDate: string | null = BASE,
): ClusterableCandidate {
  return { id, title, sourceName, trustTier, pubDate, fetchedAt: BASE };
}

test("titleTokens drops stopwords, short words, and the country name", () => {
  const tokens = titleTokens("Women's labour force participation in India rose to 41.7%");
  assert.equal(tokens.has("labour"), true);
  assert.equal(tokens.has("participation"), true);
  assert.equal(tokens.has("india"), false); // filler in this corpus
  assert.equal(tokens.has("to"), false);
  assert.equal(tokens.has("in"), false);
});

test("the same story from different outlets scores above threshold", () => {
  const a = "Women's labour force participation rises to 41.7 percent";
  const b = "Female labour force participation rate climbs to 41.7% in India";
  assert.ok(titleSimilarity(a, b) >= 0.5, `similarity was ${titleSimilarity(a, b)}`);
});

test("unrelated stories score below threshold", () => {
  const a = "Women's labour force participation rises to 41.7 percent";
  const b = "Supreme Court reserves verdict on marital rape exception";
  assert.ok(titleSimilarity(a, b) < 0.5, `similarity was ${titleSimilarity(a, b)}`);
});

test("clusters duplicate coverage and keeps unrelated stories apart", () => {
  const candidates = [
    candidate("a1", "Women's labour force participation rises to 41.7 percent", "PLFS", "primary"),
    candidate("a2", "Female labour force participation climbs to 41.7% in India", "Scroll.in"),
    candidate("a3", "PLFS: women's participation in the workforce reaches 41.7%", "The Hindu"),
    candidate("b1", "Supreme Court reserves verdict on marital rape exception", "BehanBox"),
    candidate("c1", "Anganwadi workers demand recognition as government employees", "Khabar Lahariya"),
  ];

  const clusters = clusterCandidates(candidates);

  assert.equal(clusters.length, 3);

  const labourCluster = clusters.find((cluster) => cluster.candidateIds.includes("a1"))!;
  assert.deepEqual([...labourCluster.candidateIds].sort(), ["a1", "a2", "a3"]);
  assert.equal(labourCluster.outletCount, 3);
});

test("the most authoritative outlet becomes canonical", () => {
  const candidates = [
    candidate("agg", "Female labour force participation climbs to 41.7% in India", "Google News", "discovery"),
    candidate("gov", "Women's labour force participation rises to 41.7 percent", "PLFS", "primary"),
    candidate("main", "PLFS shows women's workforce participation at 41.7%", "Scroll.in", "trusted"),
  ];

  const [cluster] = clusterCandidates(candidates);
  assert.equal(cluster.canonicalCandidateId, "gov");
});

test("two items from one outlet count as one outlet", () => {
  const candidates = [
    candidate("x1", "Women's labour force participation rises to 41.7 percent", "Scroll.in"),
    candidate("x2", "Female labour force participation climbs to 41.7% nationally", "Scroll.in"),
  ];

  const [cluster] = clusterCandidates(candidates);
  assert.equal(cluster.candidateIds.length, 2);
  assert.equal(cluster.outletCount, 1);
});

test("items outside the time window do not merge even when similar", () => {
  const candidates = [
    candidate("old", "Women's labour force participation rises to 41.7 percent", "PLFS", "primary", "2026-09-10T06:00:00.000Z"),
    candidate("new", "Female labour force participation climbs to 41.7% in India", "Scroll.in", "trusted", "2026-09-15T06:00:00.000Z"),
  ];

  const clusters = clusterCandidates(candidates, { windowMs: 48 * 60 * 60 * 1000 });
  assert.equal(clusters.length, 2);
});
