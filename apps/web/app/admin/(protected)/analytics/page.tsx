import Link from "next/link";

import { getEditorialDashboard, getGenreAnalytics } from "../../../../lib/db/analyticsQueries";

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return "-";
  return formatRate(numerator / denominator);
}

function formatRate(value: number) {
  return `${Math.round(value * 1_000) / 10}%`;
}

export default async function AnalyticsPage() {
  const [dashboard, genres] = await Promise.all([
    getEditorialDashboard(30),
    getGenreAnalytics(30),
  ]);
  const overview = dashboard.overview;

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <h1 className="mb-1 font-headline text-title text-ink">Editorial health</h1>
      <p className="mb-6 text-caption text-muted">
        Anonymous completion, balance, source, and correction signals from the last 30 days.
      </p>

      <div className="mb-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Completion" value={formatRate(overview.completionRate)} detail={`${overview.editionsCompleted} of ${overview.editionsStarted} reader-editions`} />
        <Metric label="Trusted editions / reader" value={overview.completedEditionsPerReader.toFixed(1)} detail={`${overview.activeReaders} active readers`} />
        <Metric label="Median cards read" value={overview.medianCardsRead.toFixed(1)} detail="Distinct cards per reader-edition" />
        <Metric label="Primary-source share" value={formatRate(overview.primarySourceShare)} detail="Across published edition cards" />
        <Metric label="Corrections" value={formatRate(overview.correctionRate)} detail="Of unique edition cards" />
        <Metric label="Less like this" value={String(overview.lessLikeThis)} detail="Direct reader feedback" />
      </div>

      <Section title="Edition completion and balance">
        {dashboard.editions.length === 0 ? (
          <EmptyState>No published editions in this window.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline text-caption text-muted">
                  <th className="py-3 pr-4 font-medium">Edition</th>
                  <th className="py-3 pr-4 font-medium">Completion</th>
                  <th className="py-3 pr-4 font-medium">Topics</th>
                  <th className="py-3 pr-4 font-medium">Sources</th>
                  <th className="py-3 pr-4 font-medium">Primary</th>
                  <th className="py-3 font-medium">Corrections</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.editions.map((edition) => (
                  <tr key={edition.id} className="border-b border-hairline text-body text-ink">
                    <td className="py-3 pr-4 font-headline">{edition.editionDate} / v{edition.version}</td>
                    <td className="py-3 pr-4 tabular-nums">{percent(edition.completions, edition.starts)}</td>
                    <td className="py-3 pr-4 tabular-nums">{edition.topicDiversity}</td>
                    <td className="py-3 pr-4 tabular-nums">{edition.sourceDiversity}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatRate(edition.primarySourceShare)}</td>
                    <td className="py-3 tabular-nums">{edition.corrections}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Source quality">
        {dashboard.sources.length === 0 ? (
          <EmptyState>No edition sources in this window.</EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {dashboard.sources.map((source) => (
              <div key={source.id} className="flex items-center rounded-md border border-hairline p-4">
                <div>
                  <p className="font-headline text-body text-ink">{source.name}</p>
                  <p className="mt-0.5 text-caption capitalize text-muted">{source.trustTier} source</p>
                </div>
                <div className="ml-auto text-right text-caption text-muted">
                  <p><span className="tabular-nums text-ink">{source.cards}</span> cards</p>
                  <p><span className="tabular-nums text-ink">{source.sourceOpens}</span> opens</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Correction log">
        {dashboard.corrections.length === 0 ? (
          <EmptyState>No corrected edition cards in this window.</EmptyState>
        ) : (
          <div className="space-y-3">
            {dashboard.corrections.map((correction) => (
              <div key={correction.cardId} className="rounded-md border border-hairline p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link href={`/card/${correction.slug}`} className="font-headline text-body text-gold">
                    {correction.headline}
                  </Link>
                  <span className="text-caption text-muted">
                    {new Date(correction.correctedAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="mt-2 text-caption leading-relaxed text-ink">{correction.correctionNote}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Genre engagement">
        {genres.length === 0 ? (
          <EmptyState>No mobile engagement recorded yet.</EmptyState>
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
                {genres.map((genre) => (
                  <tr key={genre.id} className="border-b border-hairline text-body text-ink">
                    <td className="py-3 pr-4 font-headline">{genre.title}</td>
                    <td className="py-3 pr-4 tabular-nums">{genre.activeReaders}</td>
                    <td className="py-3 pr-4 tabular-nums">{genre.views}</td>
                    <td className="py-3 pr-4 tabular-nums">{percent(genre.detailOpens, genre.views)}</td>
                    <td className="py-3 pr-4 tabular-nums">{percent(genre.saves, genre.views)}</td>
                    <td className="py-3 pr-4 tabular-nums">{percent(genre.shares, genre.views)}</td>
                    <td className="py-3 tabular-nums">{genre.averageDwellSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-hairline bg-surface p-4">
      <p className="text-caption uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-headline text-title tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-caption text-muted">{detail}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3 font-headline text-[24px] text-ink">{title}</h2>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-hairline p-5 text-caption text-muted">{children}</p>;
}
