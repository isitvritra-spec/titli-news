import assert from "node:assert/strict";
import test from "node:test";

import { cardInputSchema } from "./validation";

const words = (count: number) => Array.from({ length: count }, (_, index) => `word${index}`).join(" ");

const newsCard = {
  cardType: "news" as const,
  status: "published" as const,
  headline: "A carefully checked story",
  slug: "a-carefully-checked-story",
  body: words(45),
  imagePath: "story.webp",
  imageAlt: "A descriptive image",
  imageWidth: 1200,
  imageHeight: 800,
  imageBlurDataUrl: "data:image/webp;base64,abc",
  imageOrigin: "own_upload" as const,
  publishedAt: "2026-09-03T09:00:00.000Z",
  isContested: false,
  topicIds: ["topic-1"],
  primaryTopicId: "topic-1",
  sourceId: "source-1",
  sourceDate: "2026-09-03",
};

test("published news requires at least 120 words of full-story copy", () => {
  const short = cardInputSchema.safeParse({ ...newsCard, deepDiveBody: words(119) });
  assert.equal(short.success, false);
  if (!short.success) {
    assert.equal(short.error.issues.some((issue) => issue.path[0] === "deepDiveBody"), true);
  }

  const complete = cardInputSchema.safeParse({ ...newsCard, deepDiveBody: words(120) });
  assert.equal(complete.success, true);
});

test("draft news can be saved before its full story is written", () => {
  const draft = cardInputSchema.safeParse({ ...newsCard, status: "draft", deepDiveBody: undefined });
  assert.equal(draft.success, true);
});

test("publishing requires the image's origin to be recorded", () => {
  const unrecorded = cardInputSchema.safeParse({
    ...newsCard,
    imageOrigin: "unknown",
    deepDiveBody: words(120),
  });
  assert.equal(unrecorded.success, false);
  if (!unrecorded.success) {
    assert.equal(unrecorded.error.issues.some((issue) => issue.path[0] === "imageOrigin"), true);
  }
});

test("an unrecorded image origin still saves as a draft", () => {
  const draft = cardInputSchema.safeParse({
    ...newsCard,
    status: "draft",
    imageOrigin: "unknown",
    deepDiveBody: undefined,
  });
  assert.equal(draft.success, true);
});

test("a re-hosted publisher image cannot be saved without its credit", () => {
  const uncredited = cardInputSchema.safeParse({
    ...newsCard,
    imageOrigin: "source_permitted",
    deepDiveBody: words(120),
  });
  assert.equal(uncredited.success, false);
  if (!uncredited.success) {
    assert.equal(uncredited.error.issues.some((issue) => issue.path[0] === "imageCredit"), true);
  }

  const credited = cardInputSchema.safeParse({
    ...newsCard,
    imageOrigin: "source_permitted",
    imageCredit: "PIB",
    deepDiveBody: words(120),
  });
  assert.equal(credited.success, true);
});
