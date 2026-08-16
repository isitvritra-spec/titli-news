import { computeTrend, type Reading } from "@repo/utils";

/**
 * Mirrors apps/mobile/components/TrendBadge.tsx — same shared computeTrend
 * call, so the arrow direction can never disagree between platforms.
 */
export function TrendBadge({ readings }: { readings: Reading[] }) {
  const trend = computeTrend(readings);
  if (!trend || trend.direction === "flat" || !trend.previous) return null;

  const arrow = trend.direction === "up" ? "▲" : "▼";

  return (
    <span className="inline-flex items-center gap-1 text-muted text-caption">
      <span>{arrow}</span>
      <span>
        {Math.abs(trend.delta).toLocaleString("en-IN")} since {trend.previous.year}
      </span>
    </span>
  );
}
