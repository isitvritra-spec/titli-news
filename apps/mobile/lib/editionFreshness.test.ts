import assert from "node:assert/strict";
import test from "node:test";

import { dateInIndia, editionDateLabel } from "./editionFreshness";

test("dateInIndia uses the product timezone near midnight", () => {
  assert.equal(dateInIndia(new Date("2026-09-03T20:00:00.000Z")), "2026-09-04");
});

test("editionDateLabel marks fallback editions instead of presenting them as today", () => {
  const now = new Date("2026-09-04T06:00:00.000Z");

  assert.equal(editionDateLabel("2026-09-04", now), "Friday, 4 September");
  assert.equal(
    editionDateLabel("2026-09-03", now),
    "Latest edition · Thursday, 3 September",
  );
});
