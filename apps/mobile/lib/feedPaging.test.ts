import assert from "node:assert/strict";
import test from "node:test";

import { feedIndexForOffset } from "./feedPaging";

test("feed paging resolves the nearest full-screen story", () => {
  assert.equal(feedIndexForOffset(0, 640, 9), 0);
  assert.equal(feedIndexForOffset(319, 640, 9), 0);
  assert.equal(feedIndexForOffset(321, 640, 9), 1);
  assert.equal(feedIndexForOffset(1_280, 640, 9), 2);
});

test("feed paging clamps overscroll and empty input", () => {
  assert.equal(feedIndexForOffset(-200, 640, 9), 0);
  assert.equal(feedIndexForOffset(20_000, 640, 9), 8);
  assert.equal(feedIndexForOffset(20, 0, 9), 0);
  assert.equal(feedIndexForOffset(20, 640, 0), 0);
});
