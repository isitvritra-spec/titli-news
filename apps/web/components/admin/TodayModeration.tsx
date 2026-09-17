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
  const [chosenList, setChosenList] = useState(chosen);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosenCount = chosenList.length;
  const readyToPublish = chosenCount >= target;

  const prettyDate = new Date(`${editionDate}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
    setChosenList((current) => [
      ...current,
      { cardId: data.cardId, headline: sheet.headline, imagePath: sheet.story.previewImageUrl ?? "", position: current.length },
    ]);
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
    <div className="mx-auto max-w-6xl">
      {/* Action bar — full width on desktop, stacks on phone */}
      <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-hairline bg-bg/85 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-title text-ink">Today</h1>
            <p className="text-caption text-muted">{prettyDate} · publish the stories worth sharing, skip the rest.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-pressed sm:w-40">
                <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.min(100, (chosenCount / target) * 100)}%` }} />
              </div>
              <span className="shrink-0 text-caption text-muted tabular-nums">{chosenCount} of {target}</span>
            </div>
            <button
              onClick={publishEdition}
              disabled={!readyToPublish || publishing}
              className="rounded-full bg-gold px-5 py-2.5 font-headline font-medium text-label text-bg disabled:cursor-not-allowed disabled:opacity-40"
              title={readyToPublish ? "Publish today's edition" : `Choose ${target - chosenCount} more to publish`}
            >
              {publishing ? "Publishing…" : "Publish edition"}
            </button>
          </div>
        </div>

        {chosenList.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-caption text-muted">Chosen:</span>
            {chosenList.map((card) => (
              <span key={card.cardId} title={card.headline} className="shrink-0 overflow-hidden rounded-md border border-hairline">
                {card.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.imagePath} alt="" className="h-8 w-12 object-cover" />
                ) : (
                  <span className="flex h-8 w-12 items-center justify-center bg-pressed text-caption text-muted">{card.position + 1}</span>
                )}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-maroon bg-maroon/10 px-4 py-2 text-caption text-ink">{error}</p>
      ) : null}

      {queue.length === 0 ? (
        <div className="rounded-card border border-hairline bg-surface p-12 text-center">
          <p className="font-headline text-title text-ink">You’re all caught up</p>
          <p className="mt-1 text-caption text-muted">New stories arrive through the day. Check back later.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {queue.map((story) => (
            <li
              key={story.clusterId}
              className={`group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface transition hover:border-gold ${busyId === story.clusterId ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-pressed">
                {story.previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.previewImageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                ) : null}
                {story.topicSlug ? (
                  <span className="absolute left-3 top-3 rounded-full bg-bg/85 px-2 py-0.5 text-caption text-ink backdrop-blur">
                    {topicLabels[story.topicSlug] ?? story.topicSlug}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 text-caption text-muted">
                  {story.sourceName ? <span>{story.sourceName}</span> : null}
                  {story.outletCount > 1 ? <span>· {story.outletCount} outlets</span> : null}
                </div>

                <h2 className="font-headline text-[18px] leading-snug text-ink line-clamp-3">{story.headline}</h2>

                {story.sourceLink ? (
                  <a href={story.sourceLink} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-caption text-muted underline">
                    Read the original
                  </a>
                ) : null}

                <div className="mt-4 flex gap-2 pt-1">
                  <button
                    onClick={() => openSheet(story)}
                    className="flex-1 rounded-full bg-gold px-4 py-2.5 font-headline font-medium text-label text-bg transition hover:brightness-95"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => skip(story)}
                    className="rounded-full border border-hairline px-5 py-2.5 font-headline text-label text-muted transition hover:text-ink"
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
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6"
          onClick={() => !publishing && setSheet(null)}
        >
          <div
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-bg sm:rounded-2xl sm:border sm:border-hairline sm:shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid sm:grid-cols-[200px_1fr]">
              {/* Context rail — image + source, hidden on the smallest screens */}
              <div className="hidden bg-pressed sm:block">
                {sheet.story.previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sheet.story.previewImageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-headline text-title text-ink">Publish this story</h3>
                  <button onClick={() => setSheet(null)} className="text-label text-muted hover:text-ink" disabled={publishing}>Close</button>
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

                <div className="flex gap-2">
                  <button
                    onClick={confirmPublish}
                    disabled={publishing || suggesting}
                    className="flex-1 rounded-full bg-gold px-5 py-3 font-headline font-medium text-label text-bg disabled:opacity-50"
                  >
                    {publishing ? "Publishing…" : "Publish"}
                  </button>
                  <button
                    onClick={() => setSheet(null)}
                    disabled={publishing}
                    className="rounded-full border border-hairline px-5 py-3 font-headline text-label text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
