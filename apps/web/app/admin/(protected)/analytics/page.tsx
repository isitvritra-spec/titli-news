import { getGenreAnalytics } from "../../../../lib/db/analyticsQueries";

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

export default async function AnalyticsPage() {
  const metrics = await getGenreAnalytics(30);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-headline text-title text-ink mb-1">Genre analytics</h1>
      <p className="text-caption text-muted mb-6">
        Anonymous reader activity from the last 30 days. A view counts after two visible seconds.
      </p>

      {metrics.length === 0 ? (
        <div className="rounded-md border border-hairline p-6">
          <p className="text-ink">No mobile engagement recorded yet.</p>
          <p className="mt-1 text-caption text-muted">
            Metrics will appear after readers use a build containing the new event tracker.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline text-caption text-muted">
                <th className="py-3 pr-4 font-medium">Genre</th>
                <th className="py-3 pr-4 font-medium">Readers</th>
                <th className="py-3 pr-4 font-medium">Views</th>
                <th className="py-3 pr-4 font-medium">Open rate</th>
                <th className="py-3 pr-4 font-medium">Save rate</th>
                <th className="py-3 pr-4 font-medium">Share rate</th>
                <th className="py-3 font-medium">Avg. dwell</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id} className="border-b border-hairline text-body text-ink">
                  <td className="py-3 pr-4 font-headline font-medium">{metric.title}</td>
                  <td className="py-3 pr-4 tabular-nums">{metric.activeReaders}</td>
                  <td className="py-3 pr-4 tabular-nums">{metric.views}</td>
                  <td className="py-3 pr-4 tabular-nums">{percent(metric.detailOpens, metric.views)}</td>
                  <td className="py-3 pr-4 tabular-nums">{percent(metric.saves, metric.views)}</td>
                  <td className="py-3 pr-4 tabular-nums">{percent(metric.shares, metric.views)}</td>
                  <td className="py-3 tabular-nums">{metric.averageDwellSeconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
