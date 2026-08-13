export type Reading = {
  year: number;
  value: number;
};

export type Trend = {
  direction: "up" | "down" | "flat";
  delta: number;
  latest: Reading;
  previous: Reading | null;
};

/**
 * The single source of truth for the ▲/▼ trend badge. Both the mobile app
 * and the website call this — the ordering/rounding logic must never drift
 * between platforms, since a wrong arrow on a gender-data card is exactly
 * the kind of error this product exists to avoid making.
 *
 * `readings` should be ordered oldest -> newest, but this sorts by year
 * defensively in case the editor entered them out of order in the admin form.
 */
export function computeTrend(readings: Reading[]): Trend | null {
  if (readings.length === 0) return null;

  const sorted = [...readings].sort((a, b) => a.year - b.year);
  const latest = sorted[sorted.length - 1]!;
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2]! : null;

  if (!previous) {
    return { direction: "flat", delta: 0, latest, previous: null };
  }

  const delta = latest.value - previous.value;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return { direction, delta, latest, previous };
}
