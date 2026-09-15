"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SourceRow = {
  id: string;
  name: string;
  kind: "news" | "data";
  url: string;
  publisher: string | null;
  trustTier: "primary" | "trusted" | "discovery";
  sourceType: "official" | "specialist" | "mainstream" | "data" | "aggregator";
  feedUrl: string | null;
  ingestMethod: "rss" | "api" | "manual";
  isActive: boolean;
  editorialNotes: string | null;
  imagePolicy: "allow" | "deny" | "manual";
  allowsTextFetch: boolean;
  licenceNote: string | null;
  attributionRequired: boolean;
  createdAt: string;
};

const inputClass =
  "w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-ink placeholder:text-muted";

export function SourceManager({ sources }: { sources: SourceRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<"news" | "data">("news");
  const [trustTier, setTrustTier] = useState<"primary" | "trusted" | "discovery">("trusted");
  const [sourceType, setSourceType] = useState<SourceRow["sourceType"]>("mainstream");
  const [feedUrl, setFeedUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function savePolicy(id: string, patch: Record<string, unknown>) {
    setSavingId(id);
    setError(null);
    const response = await fetch(`/api/admin/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavingId(null);
    if (!response.ok) {
      setError("Could not save that policy change.");
      return;
    }
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        url,
        kind,
        trustTier,
        sourceType,
        feedUrl: feedUrl || undefined,
        ingestMethod: feedUrl ? "rss" : "manual",
      }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setError("Could not add this source. Check the URLs and try again.");
      return;
    }
    setName("");
    setUrl("");
    setFeedUrl("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-headline text-title text-ink mb-1">Trusted sources</h1>
      <p className="mb-6 text-caption text-muted">
        Primary sources establish records, trusted sources support editorial reporting, and discovery sources only create leads.
      </p>

      <div className="mb-6 rounded-md border border-hairline bg-surface p-4">
        <h2 className="font-headline text-label text-ink">Reuse policy</h2>
        <p className="mt-1 text-caption text-muted">
          Every source starts at <strong className="text-ink">deny</strong>. Only set a source to
          allow once you have actually read its licence and confirmed that re-hosting its
          photography is permitted — a licensed wire photo copied onto our domain is the largest
          legal risk in the product. Text fetching follows the same rule for the source&apos;s terms
          and robots.txt.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline text-caption text-muted">
              <th className="py-3 pr-4 font-medium">Source</th>
              <th className="py-3 pr-4 font-medium">Tier</th>
              <th className="py-3 pr-4 font-medium">Type</th>
              <th className="py-3 pr-4 font-medium">Ingestion</th>
              <th className="py-3 pr-4 font-medium">Images</th>
              <th className="py-3 font-medium">Text</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-b border-hairline text-body text-ink">
                <td className="py-3 pr-4">
                  <a href={source.url} target="_blank" rel="noreferrer" className="font-headline font-medium hover:text-gold">
                    {source.name}
                  </a>
                  {source.licenceNote ? (
                    <span className="mt-0.5 block max-w-xs text-caption text-muted">{source.licenceNote}</span>
                  ) : null}
                </td>
                <td className="py-3 pr-4 capitalize">{source.trustTier}</td>
                <td className="py-3 pr-4 capitalize">{source.sourceType}</td>
                <td className="py-3 pr-4 capitalize">{source.ingestMethod}</td>
                <td className="py-3 pr-4">
                  <select
                    value={source.imagePolicy}
                    disabled={savingId === source.id}
                    onChange={(event) => savePolicy(source.id, { imagePolicy: event.target.value })}
                    aria-label={`Image reuse policy for ${source.name}`}
                    className="rounded-md border border-hairline bg-transparent px-2 py-1 text-caption text-ink disabled:opacity-50"
                  >
                    <option value="deny">Deny</option>
                    <option value="manual">Manual only</option>
                    <option value="allow">Allow</option>
                  </select>
                </td>
                <td className="py-3">
                  <label className="flex items-center gap-2 text-caption text-muted">
                    <input
                      type="checkbox"
                      checked={source.allowsTextFetch}
                      disabled={savingId === source.id}
                      onChange={(event) => savePolicy(source.id, { allowsTextFetch: event.target.checked })}
                      aria-label={`Allow article text fetching from ${source.name}`}
                    />
                    Fetch
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={onSubmit} className="mt-10 max-w-2xl rounded-md border border-hairline p-5">
        <h2 className="mb-4 font-headline text-label text-ink">Add a source</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Source name" required />
          <input className={inputClass} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Website URL" type="url" required />
          <select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value as "news" | "data")}>
            <option value="news">News</option>
            <option value="data">Data</option>
          </select>
          <select className={inputClass} value={trustTier} onChange={(event) => setTrustTier(event.target.value as SourceRow["trustTier"])}>
            <option value="primary">Primary evidence</option>
            <option value="trusted">Trusted reporting</option>
            <option value="discovery">Discovery only</option>
          </select>
          <select className={inputClass} value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceRow["sourceType"])}>
            <option value="official">Official</option>
            <option value="specialist">Specialist</option>
            <option value="mainstream">Mainstream</option>
            <option value="data">Data newsroom</option>
            <option value="aggregator">Aggregator</option>
          </select>
          <input className={inputClass} value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} placeholder="RSS URL (optional)" type="url" />
        </div>
        {error ? <p className="mt-3 text-caption text-gold">{error}</p> : null}
        <button type="submit" disabled={submitting} className="mt-4 rounded-full bg-gold px-4 py-2 font-headline font-medium text-label text-bg disabled:opacity-50">
          {submitting ? "Adding…" : "Add source"}
        </button>
      </form>
    </div>
  );
}
