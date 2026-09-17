import { getEditorialDashboard } from "../../../../lib/db/analyticsQueries";
import { getPulse } from "../../../../lib/db/queries";

export const dynamic = "force-dynamic";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function InsightsPage() {
  const [dashboard, pulse] = await Promise.all([getEditorialDashboard(30), getPulse()]);
  const o = dashboard.overview;

  const tiles = [
    { label: "Readers this month", value: String(o.activeReaders) },
    { label: "Editions finished", value: String(o.editionsCompleted) },
    { label: "Finish rate", value: pct(o.completionRate) },
    { label: "Stories read each time", value: String(o.medianCardsRead) },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-headline text-title text-ink mb-1">Insights</h1>
      <p className="mb-6 text-caption text-muted">How readers are engaging, and the numbers we show them. Last 30 days.</p>

      <div className="mb-8 grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-card border border-hairline bg-surface p-4">
            <div className="font-headline text-[30px] leading-none text-ink tabular-nums">{tile.value}</div>
            <div className="mt-1 text-caption text-muted">{tile.label}</div>
          </div>
        ))}
      </div>

      <h2 className="font-headline text-label text-ink mb-1">The numbers for women</h2>
      <p className="mb-4 text-caption text-muted">
        Live data shown in the app. These refresh from their official source; each carries its own date.
      </p>
      {pulse.length === 0 ? (
        <p className="text-muted">No metrics yet.</p>
      ) : (
        <ul className="grid gap-2">
          {pulse.map((metric) => (
            <li key={metric.key} className="rounded-card border border-hairline bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink">{metric.label}</span>
                <span className="font-headline text-title text-ink tabular-nums">
                  {metric.value}
                  <span className="ml-1 text-caption text-muted">{metric.unit}</span>
                </span>
              </div>
              <div className="mt-1 text-caption text-muted">
                {metric.periodLabel} · {metric.sourceName}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
