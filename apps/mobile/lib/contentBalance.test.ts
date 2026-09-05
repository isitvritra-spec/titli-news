import assert from "node:assert/strict";
import test from "node:test";
import type { Card, HotStory } from "@repo/api-client";

import { isIntenseStory, selectBalancedHotStories } from "./contentBalance";

test("balanced hot stories lead with a lower-intensity story and interleave difficult news", () => {
  const stories = [
    story("Violence report", "safety-justice"),
    story("A practical money guide", "work-money"),
    story("Rape law update", "rights-policy"),
    story("A science milestone", "sports-science-culture"),
  ];

  assert.equal(isIntenseStory(stories[2]!), true);
  assert.deepEqual(
    selectBalancedHotStories(stories).map((item) => item.card.headline),
    ["A practical money guide", "Violence report", "A science milestone", "Rape law update"],
  );
});

function story(headline: string, topicSlug: string): HotStory {
  const topic = { slug: topicSlug, title: topicSlug };
  const card: Card = {
    id: headline,
    cardType: "news",
    headline,
    slug: headline.toLowerCase().replaceAll(" ", "-"),
    body: "Verified summary.",
    image: { url: "/image.webp", alt: "", width: 1200, height: 800, blurDataURL: "data:" },
    topics: [topic],
    primaryGenre: topic,
    publishedAt: "2026-09-04T00:00:00.000Z",
    source: { name: "Source", url: "https://example.com", trustTier: "trusted" },
    sourceDate: "2026-09-04",
  };
  return { card, reason: "Most read", averageDwellSeconds: 20, readerCount: 10 };
}
