"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type TriageArticle = {
  id: string;
  title: string;
  sourceName: string;
  link: string;
  pubDate: string | null;
};

export type TriageClusterView = {
  id: string;
  canonicalTitle: string;
  canonicalCandidateId: string | null;
  topicGuess: string | null;
  relevanceScore: number | null;
  outletCount: number;
  status: "new" | "shortlisted";
  firstSeenAt: string;
  canonicalSourceName: string | null;
  canonicalTrustTier: "primary" | "trusted" | "discovery" | null;
  articles: TriageArticle[];
};

type Busy = { kind: "row" | "refresh" | "bulk"; id?: string } | null;

function relativeAge(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const hours = Math.round((Date.now() - then) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function scoreBand(score: number | null): string {
  if (score === null) return "border-hairline text-muted";
  if (score >= 55) return "border-gold text-gold";
  if (score >= 35) return "border-jade text-jade";
  return "border-hairline text-muted";
}

export function TriageBoard({
  clusters,
  topics,
  aiDraftingEnabled,
}: {
  clusters: TriageClusterView[];
  topics: { slug: string; title: string }[];
  aiDraftingEnabled: boolean;
}) {
  const router = useRouter();
  const topicTitle = useMemo(
    () => new Map(topics.map((topic) => [topic.slug, topic.title])),
    [topics],
  );

  const [rows, setRows] = useState(clusters);
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState<Busy>(null);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Server data is the source of truth — resync whenever it changes under us.
  useEffect(() => setRows(clusters), [clusters]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (topicFilter && row.topicGuess !== topicFilter) return false;
      if (tierFilter && row.canonicalTrustTier !== tierFilter) return false;
      if ((row.relevanceScore ?? 0) < minScore) return false;
      if (q) {
        const haystack = `${row.canonicalTitle} ${row.articles.map((a) => a.title).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, topicFilter, tierFilter, minScore]);

  useEffect(() => {
    if (active >= visible.length) setActive(Math.max(0, visible.length - 1));
  }, [visible.length, active]);

  function removeLocal(ids: string[]) {
    const drop = new Set(ids);
    setRows((current) => current.filter((row) => !drop.has(row.id)));
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
  }

  async function dismiss(id: string) {
    setBusy({ kind: "row", id });
    removeLocal([id]);
    await fetch(`/api/admin/clusters/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    });
    setBusy(null);
    router.refresh();
  }

  async function toggleShortlist(row: TriageClusterView) {
    const next = row.status === "shortlisted" ? "new" : "shortlisted";
    setBusy({ kind: "row", id: row.id });
    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, status: next } : item)),
    );
    await fetch(`/api/admin/clusters/${row.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: next === "shortlisted" ? "shortlist" : "unshortlist" }),
    });
    setBusy(null);
    router.refresh();
  }

  async function draft(row: TriageClusterView) {
    if (!row.canonicalCandidateId) return;
    setBusy({ kind: "row", id: row.id });
    await fetch(`/api/admin/inbox/${row.canonicalCandidateId}/draft`, { method: "POST" });
    router.push(`/admin/cards/new?from=${row.canonicalCandidateId}`);
  }

  async function aiDraft(row: TriageClusterView) {
    if (!row.canonicalCandidateId) return;
    setBusy({ kind: "row", id: row.id });
    setActionError(null);
    const res = await fetch(`/api/admin/inbox/${row.canonicalCandidateId}/ai-draft`, { method: "POST" });
    if (res.ok) {
      const { cardId } = await res.json();
      router.push(`/admin/cards/${cardId}/edit`);
      return;
    }
    const data = await res.json().catch(() => null);
    setActionError(data?.error ?? "AI drafting failed. Draft manually instead.");
    setBusy(null);
  }

  async function bulkDismiss() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBusy({ kind: "bulk" });
    removeLocal(ids);
    await fetch("/api/admin/clusters/bulk-dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setBusy(null);
    router.refresh();
  }

  async function refresh() {
    setBusy({ kind: "refresh" });
    setRefreshNote(null);
    const res = await fetch("/api/admin/inbox", { method: "POST" });
    setBusy(null);
    if (res.ok) {
      const data = await res.json();
      setRefreshNote(
        `${data.newCount} new · ${data.clusters} clusters · ${data.rejectedCandidates} off-topic dropped`,
      );
      router.refresh();
    }
  }

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Keyboard triage — j/k move, x select, o open, s shortlist, d dismiss.
  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") {
        return;
      }
      const row = visible[active];
      switch (event.key) {
        case "j":
          setActive((i) => Math.min(visible.length - 1, i + 1));
          event.preventDefault();
          break;
        case "k":
          setActive((i) => Math.max(0, i - 1));
          event.preventDefault();
          break;
        case "x":
          if (row) toggleSelect(row.id);
          event.preventDefault();
          break;
        case "o":
          if (row) toggleExpand(row.id);
          event.preventDefault();
          break;
        case "s":
          if (row) void toggleShortlist(row);
          event.preventDefault();
          break;
        case "d":
          if (row) void dismiss(row.id);
          event.preventDefault();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, active]);

  return (
    <div className="mx-auto max-w-4xl" ref={boardRef}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-title text-ink">Inbox</h1>
          <p className="text-caption text-muted">
            One row per story — the same event from several outlets is grouped. Ranked by relevance,
            off-topic items dropped. Keys: <span className="font-mono">j/k</span> move,{" "}
            <span className="font-mono">o</span> open, <span className="font-mono">s</span> shortlist,{" "}
            <span className="font-mono">d</span> dismiss, <span className="font-mono">x</span> select.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshNote ? <span className="text-caption text-muted">{refreshNote}</span> : null}
          <button
            onClick={refresh}
            disabled={busy?.kind === "refresh"}
            className="rounded-full bg-gold px-4 py-2 font-headline font-medium text-label text-bg disabled:opacity-50"
          >
            {busy?.kind === "refresh" ? "Refreshing…" : "Refresh inbox"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-hairline pb-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search headlines…"
          className="min-w-[180px] flex-1 rounded-md border border-hairline bg-transparent px-3 py-1.5 text-body text-ink placeholder:text-muted"
        />
        <select
          value={topicFilter}
          onChange={(event) => setTopicFilter(event.target.value)}
          className="rounded-md border border-hairline bg-transparent px-2 py-1.5 text-caption text-ink"
          aria-label="Filter by topic"
        >
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic.slug} value={topic.slug}>{topic.title}</option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(event) => setTierFilter(event.target.value)}
          className="rounded-md border border-hairline bg-transparent px-2 py-1.5 text-caption text-ink"
          aria-label="Filter by source tier"
        >
          <option value="">Any source</option>
          <option value="primary">Primary</option>
          <option value="trusted">Trusted</option>
          <option value="discovery">Discovery</option>
        </select>
        <label className="flex items-center gap-2 text-caption text-muted">
          Min score {minScore}
          <input
            type="range"
            min={0}
            max={80}
            step={5}
            value={minScore}
            onChange={(event) => setMinScore(Number(event.target.value))}
          />
        </label>
      </div>

      {selected.size > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-md border border-gold bg-surface px-4 py-2">
          <span className="text-caption text-ink">{selected.size} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(new Set())} className="text-label text-muted hover:text-ink">
              Clear
            </button>
            <button
              onClick={bulkDismiss}
              disabled={busy?.kind === "bulk"}
              className="rounded-full border border-gold px-3 py-1 font-headline text-label text-gold disabled:opacity-50"
            >
              {busy?.kind === "bulk" ? "Dismissing…" : `Dismiss ${selected.size}`}
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? (
        <p className="mb-3 rounded-md border border-maroon bg-maroon/10 px-4 py-2 text-caption text-ink">
          {actionError}
        </p>
      ) : null}

      <p className="mb-3 text-caption text-muted">{visible.length} of {rows.length} clusters</p>

      {visible.length === 0 ? (
        <p className="rounded-md border border-hairline bg-surface p-6 text-center text-muted">
          Nothing to triage — press <span className="font-mono">Refresh inbox</span> to pull the latest.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((row, index) => {
            const isActive = index === active;
            const isOpen = expanded.has(row.id);
            const isBusy = busy?.kind === "row" && busy.id === row.id;
            return (
              <li
                key={row.id}
                onMouseEnter={() => setActive(index)}
                className={`rounded-card border bg-surface p-4 transition-colors ${
                  isActive ? "border-gold" : "border-hairline"
                } ${isBusy ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="mt-1.5"
                    aria-label={`Select ${row.canonicalTitle}`}
                  />

                  <span
                    className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-caption font-medium tabular-nums ${scoreBand(row.relevanceScore)}`}
                    title="Relevance score"
                  >
                    {row.relevanceScore ?? "—"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-caption text-muted">
                      <span>
                        {row.outletCount} outlet{row.outletCount === 1 ? "" : "s"}
                      </span>
                      {row.canonicalTrustTier === "primary" ? (
                        <span className="rounded-full border border-gold px-2 text-gold">Primary</span>
                      ) : null}
                      {row.topicGuess ? (
                        <span className="rounded-full bg-pressed px-2">
                          {topicTitle.get(row.topicGuess) ?? row.topicGuess}
                        </span>
                      ) : null}
                      {row.status === "shortlisted" ? (
                        <span className="rounded-full border border-jade px-2 text-jade">Shortlisted</span>
                      ) : null}
                      <span>· {relativeAge(row.firstSeenAt)}</span>
                    </div>

                    <button
                      onClick={() => toggleExpand(row.id)}
                      className="block text-left text-ink hover:text-gold"
                    >
                      {row.canonicalTitle}
                    </button>
                    {row.canonicalSourceName ? (
                      <span className="text-caption text-muted">via {row.canonicalSourceName}</span>
                    ) : null}

                    {isOpen ? (
                      <ul className="mt-3 flex flex-col gap-1.5 border-t border-hairline pt-3">
                        {row.articles.map((article) => (
                          <li key={article.id} className="text-caption">
                            <span className="uppercase tracking-wide text-muted">{article.sourceName}</span>
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 text-ink hover:underline"
                            >
                              {article.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {aiDraftingEnabled ? (
                      <button
                        onClick={() => aiDraft(row)}
                        disabled={isBusy || !row.canonicalCandidateId}
                        className="whitespace-nowrap rounded-full bg-gold px-3 py-1 font-headline font-medium text-label text-bg disabled:opacity-50"
                        title="Generate a draft the editor then reviews"
                      >
                        AI draft
                      </button>
                    ) : null}
                    <button
                      onClick={() => draft(row)}
                      disabled={isBusy || !row.canonicalCandidateId}
                      className={`whitespace-nowrap rounded-full px-3 py-1 font-headline font-medium text-label disabled:opacity-50 ${
                        aiDraftingEnabled
                          ? "border border-gold text-gold"
                          : "bg-gold text-bg"
                      }`}
                    >
                      {aiDraftingEnabled ? "Manual" : "Draft"}
                    </button>
                    <button
                      onClick={() => toggleShortlist(row)}
                      disabled={isBusy}
                      className="whitespace-nowrap rounded-full border border-jade px-3 py-1 font-headline text-label text-jade disabled:opacity-50"
                    >
                      {row.status === "shortlisted" ? "Unshortlist" : "Shortlist"}
                    </button>
                    <button
                      onClick={() => dismiss(row.id)}
                      disabled={isBusy}
                      className="font-headline text-label text-muted hover:text-ink disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
