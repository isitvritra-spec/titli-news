"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PulseRow = {
  key: string;
  kind: "safety" | "progress";
  label: string;
  value: number;
  unit: string;
  periodLabel: string;
  sourceName: string;
  sourceUrl: string;
  methodology: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

const inputClass =
  "w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-ink placeholder:text-muted";

export function PulseManager({ metrics }: { metrics: PulseRow[] }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-headline text-title text-ink mb-1">Women&apos;s Pulse</h1>
      <p className="mb-6 text-caption text-muted">
        Update only from the original published dataset. Women&apos;s Wins is calculated automatically from published cards.
      </p>
      <div className="flex flex-col gap-5">
        {metrics.map((metric) => (
          <PulseMetricForm key={metric.key} initial={metric} />
        ))}
      </div>
    </div>
  );
}

function PulseMetricForm({ initial }: { initial: PulseRow }) {
  const router = useRouter();
  const [metric, setMetric] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/admin/pulse/${encodeURIComponent(metric.key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: metric.label,
        value: Number(metric.value),
        unit: metric.unit,
        periodLabel: metric.periodLabel,
        sourceName: metric.sourceName,
        sourceUrl: metric.sourceUrl,
        methodology: metric.methodology,
        isActive: metric.isActive,
      }),
    });
    setSaving(false);
    setMessage(response.ok ? "Saved" : "Could not save");
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-md border border-hairline p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-headline text-label capitalize text-gold">{metric.kind}</span>
        <label className="flex items-center gap-2 text-caption text-muted">
          <input
            type="checkbox"
            checked={metric.isActive}
            onChange={(event) => setMetric({ ...metric, isActive: event.target.checked })}
          />
          Visible
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} value={metric.label} onChange={(event) => setMetric({ ...metric, label: event.target.value })} placeholder="Label" />
        <input className={inputClass} value={metric.value} onChange={(event) => setMetric({ ...metric, value: Number(event.target.value) })} type="number" min="0" placeholder="Value" />
        <input className={inputClass} value={metric.unit} onChange={(event) => setMetric({ ...metric, unit: event.target.value })} placeholder="Unit" />
        <input className={inputClass} value={metric.periodLabel} onChange={(event) => setMetric({ ...metric, periodLabel: event.target.value })} placeholder="Period" />
        <input className={inputClass} value={metric.sourceName} onChange={(event) => setMetric({ ...metric, sourceName: event.target.value })} placeholder="Source name" />
        <input className={inputClass} value={metric.sourceUrl} onChange={(event) => setMetric({ ...metric, sourceUrl: event.target.value })} type="url" placeholder="Source URL" />
      </div>
      <textarea className={`${inputClass} mt-3`} value={metric.methodology} onChange={(event) => setMetric({ ...metric, methodology: event.target.value })} rows={3} placeholder="Methodology and limitations" />
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-gold px-4 py-2 font-headline font-medium text-label text-bg disabled:opacity-50">
          {saving ? "Saving…" : "Save metric"}
        </button>
        {message ? <span className="text-caption text-muted">{message}</span> : null}
      </div>
    </form>
  );
}
