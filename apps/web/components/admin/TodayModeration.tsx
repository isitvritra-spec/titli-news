"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ModerationStory = {
  clusterId: string;
  headline: string;
  sourceName: string | null;
  outletCount: number;
  topicSlug: string | null;
  previewImageUrl: string | null;
  sourceLink: string | null;
};

export type ChosenCard = { cardId: string; headline: string; imagePath: string; position: number };

type Sheet = { story: ModerationStory; headline: string; summary: string; deepDive: string; aiGenerated: boolean } | null;

export function TodayModeration({
  stories,
  chosen,
  target,
  editionDate,
  aiEnabled,
  topicLabels,
}: {
  stories: ModerationStory[];
  chosen: ChosenCard[];
  target: number;
  editionDate: string;
  aiEnabled: boolean;
  topicLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState(stories);
  const [chosenCount, setChosenCount] = useState(chosen.length);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readyToPublish = chosenCount >= target;

  function dropStory(clusterId: string) {
    setQueue((current) => current.filter((story) => story.clusterId !== clusterId));
  }

  async function skip(story: ModerationStory) {
    setBusyId(story.clusterId);
    dropStory(story.clusterId);
    await fetch(`/api/admin/clusters/${story.clusterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function openSheet(story: ModerationStory) {
    setError(null);
    setSheet({ story, headline: story.headline, summary: "", deepDive: "", aiGenerated: false });
    if (!aiEnabled) return;

    setSuggesting(true);
    try {
      const res = await fetch("/api/admin/today/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterId: story.clusterId }),
      });
      const data = await res.json();
      if (data?.enabled) {
        setSheet((current) =>
          current && current.story.clusterId === story.clusterId
            ? { ...current, headline: data.headline ?? current.headline, summary: data.summary ?? "", deepDive: data.deepDive ?? "", aiGenerated: true }
            : current,
        );
      }
    } catch {
      // Pre-fill is best-effort; the moderator can still write it.
    } finally {
      setSuggesting(false);
    }
  }

  async function confirmPublish() {
    if (!sheet) return;
    if (!sheet.headline.trim() || !sheet.summary.trim()) {
      setError("Add a headline and a short summary before publishing.");
      return;
    }
    setPublishing(true);
    setError(null);
    const res = await fetch("/api/admin/today/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clusterId: sheet.story.clusterId,
        headline: sheet.headline,
        summary: sheet.summary,
        deepDive: sheet.deepDive || undefined,
        aiGenerated: sheet.aiGenerated,
      }),
    });
    setPublishing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not publish this story.");
      return;
    }
    const data = await res.json();
    setChosenCount(data.chosen ?? chosenCount + 1);
    dropStory(sheet.story.clusterId);
    setSheet(null);
    router.refresh();
  }

  async function publishEdition() {
    setPublishing(true);
    setError(null);
    const res = await fetch(`/api/admin/editions/${editionDate}/publish`, { method: "POST" });
    setPublishing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not publish today's edition.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="sticky-safe mb-5">
        <h1 className="font-headline text-title text-ink">Today</h1>
        <p className="text-caption text-muted">
          The stories that came in. Publish the ones worth sharing, skip the rest.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-pressed">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${Math.min(100, (chosenCount / target) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-caption text-muted tabular-nums">
            {chosenCount} of {target} chosen
          </span>
        </div>

        {readyToPublish ? (
          <button
            onClick={publishEdition}
            disabled={publishing}
            className="mt-3 w-full rounded-full bg-gold px-5 py-3 font-headline font-medium text-label text-bg disabled:opacity-50"
          >
            {publishing ? "Publishing…" : "Publish today’s edition"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-maroon bg-maroon/10 px-4 py-2 text-caption text-ink">{error}</p>
      ) : null}

      {queue.length === 0 ? (
        <div className="rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-ink">You’re all caught up.</p>
          <p className="mt-1 text-caption text-muted">New stories arrive through the day.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {queue.map((story) => (
            <li
              key={story.clusterId}
              className={`overflow-hidden rounded-card border border-hairline bg-surface ${busyId === story.clusterId ? "opacity-50" : ""}`}
            >
              {story.previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.previewImageUrl} alt="" className="h-44 w-full object-cover" />
              ) : (
                <div className="h-2 w-full bg-pressed" />
              )}
              <div className="p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-caption text-muted">
                  {story.topicSlug ? (
                    <span className="rounded-full bg-pressed px-2 py-0.5">
                      {topicLabels[story.topicSlug] ?? story.topicSlug}
                    </span>
                  ) : null}
                  {story.sourceName ? <span>{story.sourceName}</span> : null}
                  {story.outletCount > 1 ? <span>· {story.outletCount} outlets</span> : null}
                </div>

                <h2 className="font-headline text-[19px] leading-snug text-ink">{story.headline}</h2>

                {story.sourceLink ? (
                  <a
                    href={story.sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-caption text-muted underline"
                  >
                    Read the original
                  </a>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openSheet(story)}
                    className="flex-1 rounded-full bg-gold px-4 py-2.5 font-headline font-medium text-label text-bg"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => skip(story)}
                    className="rounded-full border border-hairline px-5 py-2.5 font-headline text-label text-muted hover:text-ink"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {sheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => !publishing && setSheet(null)}>
          <div
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-bg p-5 sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-headline text-title text-ink">Publish this story</h3>
              <button onClick={() => setSheet(null)} className="text-label text-muted hover:text-ink" disabled={publishing}>
                Close
              </button>
            </div>

            {suggesting ? (
              <p className="mb-3 text-caption text-gold">Drafting a suggestion…</p>
            ) : sheet.aiGenerated ? (
              <p className="mb-3 text-caption text-muted">Draft suggested — check the facts and edit freely before publishing.</p>
            ) : (
              <p className="mb-3 text-caption text-muted">Write a short summary in your own words.</p>
            )}

            <label className="mb-3 block">
              <span className="mb-1 block text-caption text-muted">Headline</span>
              <input
                value={sheet.headline}
                onChange={(event) => setSheet({ ...sheet, headline: event.target.value })}
                className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-caption text-muted">Summary (about 60 words)</span>
              <textarea
                value={sheet.summary}
                onChange={(event) => setSheet({ ...sheet, summary: event.target.value })}
                rows={5}
                className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink"
                placeholder="A short, self-contained summary a reader understands on its own."
              />
            </label>

            {error ? <p className="mb-3 text-caption text-red">{error}</p> : null}

            <button
              onClick={confirmPublish}
              disabled={publishing || suggesting}
              className="w-full rounded-full bg-gold px-5 py-3 font-headline font-medium text-label text-bg disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
