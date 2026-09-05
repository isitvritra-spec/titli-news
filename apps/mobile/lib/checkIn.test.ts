import assert from "node:assert/strict";
import test from "node:test";

import { getCheckInFeedback, HOLD_DURATION_MS, pressureFromDuration } from "./checkIn";

test("pressureFromDuration clamps the hold duration to a zero-to-one value", () => {
  assert.equal(pressureFromDuration(-100), 0);
  assert.equal(pressureFromDuration(HOLD_DURATION_MS / 2), 0.5);
  assert.equal(pressureFromDuration(HOLD_DURATION_MS * 2), 1);
  assert.equal(pressureFromDuration(Number.NaN), 0);
});

test("getCheckInFeedback maps the full pressure range to stable bands", () => {
  assert.equal(getCheckInFeedback(-1).band, "light");
  assert.equal(getCheckInFeedback(0.29).band, "light");
  assert.equal(getCheckInFeedback(0.3).band, "tender");
  assert.equal(getCheckInFeedback(0.69).band, "tender");
  assert.equal(getCheckInFeedback(0.7).band, "heavy");
  assert.equal(getCheckInFeedback(2).band, "heavy");
});
