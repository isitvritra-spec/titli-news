"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type InboxCandidate = {
  id: string;
  sourceName: string;
  title: string;
  link: string;
  imageUrl: string | null;
  pubDate: string | null;
};

export function InboxList({ candidates }: { candidates: InboxCandidate[] }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newCount, setNewCount] = useState<number | null>(null);

  async function onCheckForNew() {
    setChecking(true);
    setNewCount(null);
    const res = await fetch("/api/admin/inbox", { method: "POST" });
    setChecking(false);
    if (res.ok) {
      const { newCount } = await res.json();
      setNewCount(newCount);
      router.refresh();
    }
  }

  async function onDraft(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/inbox/${id}/draft`, { method: "POST" });
    setBusyId(null);
    router.push(`/admin/cards/new?from=${id}`);
  }

  async function onDismiss(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/inbox/${id}/dismiss`, { method: "POST" });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onCheckForNew}
          disabled={checking}
          className="rounded-full bg-gold px-4 py-2 text-sm text-bg font-medium disabled:opacity-50"
        >
          {checking ? "Checking…" : "Check for new articles"}
        </button>
        {newCount !== null ? (
          <span className="text-sm text-muted">
            {newCount > 0 ? `${newCount} new item${newCount === 1 ? "" : "s"}` : "No new items"}
          </span>
        ) : null}
      </div>

      {candidates.length === 0 ? (
        <p className="text-muted">
          Nothing here yet — click &quot;Check for new articles&quot; to pull the latest from
          Feminism in India, Scroll.in, IndiaSpend, Behanbox, PIB, The Hindu, and Google News.
        </p>
      ) : (
        <ul className="flex flex-col">
          {candidates.map((item) => (
            <li key={item.id} className="flex gap-4 border-b border-hairline py-4">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-md object-cover bg-pressed"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-md bg-pressed" />
              )}

              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase tracking-wide text-muted">{item.sourceName}</span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-ink hover:underline"
                >
                  {item.title}
                </a>
                {item.pubDate ? (
                  <span className="text-xs text-muted">
                    {new Date(item.pubDate).toLocaleDateString("en-IN")}
                  </span>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  onClick={() => onDraft(item.id)}
                  disabled={busyId === item.id}
                  className="whitespace-nowrap rounded-full border border-gold px-3 py-1 text-sm text-gold disabled:opacity-50"
                >
                  {busyId === item.id ? "…" : "Draft from this"}
                </button>
                <button
                  onClick={() => onDismiss(item.id)}
                  disabled={busyId === item.id}
                  className="text-sm text-muted hover:text-ink disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
