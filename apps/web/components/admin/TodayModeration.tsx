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

type DraftImage = { path: string; alt: string; width: number; height: number; blurDataURL: string };

type Draft = {
  story: ModerationStory;
  headline: string;
  summary: string;
  deepDive: string;
  topicSlug: string;
  image: DraftImage | null;
  aiGenerated: boolean;
};

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
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<"card" | "inside">("card");
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topicOptions = Object.entries(topicLabels).map(([slug, title]) => ({ slug, title }));
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

  async function openStory(story: ModerationStory) {
    setError(null);
    setTab("card");
    setEditing(false);
    setDraft({
      story,
      headline: story.headline,
      summary: "",
      deepDive: "",
      topicSlug: story.topicSlug ?? topicOptions[0]?.slug ?? "",
      image: null,
      aiGenerated: false,
    });
    if (!aiEnabled) {
      setEditing(true); // nothing to preview yet — go straight to writing
      return;
    }
    setSuggesting(true);
    try {
      const res = await fetch("/api/admin/today/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterId: story.clusterId }),
      });
      const data = await res.json();
      if (data?.enabled) {
        setDraft((current) =>
          current && current.story.clusterId === story.clusterId
            ? { ...current, headline: data.headline ?? current.headline, summary: data.summary ?? "", deepDive: data.deepDive ?? "", aiGenerated: true }
            : current,
        );
      } else {
        setEditing(true);
      }
    } catch {
      setEditing(true);
    } finally {
      setSuggesting(false);
    }
  }

  async function onUploadImage(file: File | null) {
    if (!file || !draft) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      setError("Image upload failed.");
      return;
    }
    const saved = await res.json();
    setDraft({ ...draft, image: { path: saved.path, alt: draft.headline, width: saved.width, height: saved.height, blurDataURL: saved.blurDataURL } });
  }

  async function publish() {
    if (!draft) return;
    if (!draft.headline.trim() || !draft.summary.trim()) {
      setError("Add a headline and a short summary before publishing.");
      setEditing(true);
      return;
    }
    setPublishing(true);
    setError(null);
    const res = await fetch("/api/admin/today/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clusterId: draft.story.clusterId,
        headline: draft.headline,
        summary: draft.summary,
        deepDive: draft.deepDive || undefined,
        topicSlug: draft.topicSlug || undefined,
        image: draft.image ?? undefined,
        aiGenerated: draft.aiGenerated,
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
      { cardId: data.cardId, headline: draft.headline, imagePath: draft.image?.path ?? draft.story.previewImageUrl ?? "", position: current.length },
    ]);
    dropStory(draft.story.clusterId);
    setDraft(null);
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

  const previewImage = draft?.image?.path ?? draft?.story.previewImageUrl ?? null;
  const topicTitle = draft ? topicLabels[draft.topicSlug] ?? draft.topicSlug : "";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-hairline bg-bg/85 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-title text-ink">Today</h1>
            <p className="text-caption text-muted">{prettyDate} · tap a story to review, then publish or skip.</p>
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
              {publishing && !draft ? "Publishing…" : "Publish edition"}
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

      {error && !draft ? (
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
              <button onClick={() => openStory(story)} className="block text-left">
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
                <div className="p-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-2 text-caption text-muted">
                    {story.sourceName ? <span>{story.sourceName}</span> : null}
                    {story.outletCount > 1 ? <span>· {story.outletCount} outlets</span> : null}
                  </div>
                  <h2 className="font-headline text-[18px] leading-snug text-ink line-clamp-3">{story.headline}</h2>
                </div>
              </button>
              <div className="mt-auto flex gap-2 px-4 pb-4">
                <button
                  onClick={() => openStory(story)}
                  className="flex-1 rounded-full bg-gold px-4 py-2.5 font-headline font-medium text-label text-bg transition hover:brightness-95"
                >
                  Review
                </button>
                <button
                  onClick={() => skip(story)}
                  className="rounded-full border border-hairline px-5 py-2.5 font-headline text-label text-muted transition hover:text-ink"
                >
                  Skip
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/45 sm:items-center sm:p-6" onClick={() => !publishing && setDraft(null)}>
          <div
            className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-bg sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl sm:border sm:border-hairline sm:shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
              <div className="flex gap-1 rounded-full bg-pressed p-1">
                <button
                  onClick={() => setTab("card")}
                  className={`rounded-full px-3 py-1 text-caption font-medium ${tab === "card" ? "bg-bg text-ink shadow-sm" : "text-muted"}`}
                >
                  Card
                </button>
                <button
                  onClick={() => setTab("inside")}
                  className={`rounded-full px-3 py-1 text-caption font-medium ${tab === "inside" ? "bg-bg text-ink shadow-sm" : "text-muted"}`}
                >
                  Inside
                </button>
              </div>
              <button onClick={() => setDraft(null)} disabled={publishing} className="text-label text-muted hover:text-ink">Close</button>
            </div>

            <div className="grid flex-1 overflow-y-auto md:grid-cols-2">
              {/* Reader preview */}
              <div className="border-b border-hairline bg-surface2 p-5 md:border-b-0 md:border-r">
                <p className="mb-3 text-caption uppercase tracking-wide text-muted">How readers see it</p>
                {suggesting ? (
                  <p className="text-caption text-gold">Preparing a draft…</p>
                ) : tab === "card" ? (
                  <ReaderCardPreview image={previewImage} topic={topicTitle} headline={draft.headline} summary={draft.summary} />
                ) : (
                  <ReaderInsidePreview image={previewImage} headline={draft.headline} deepDive={draft.deepDive || draft.summary} />
                )}
              </div>

              {/* Details / edit */}
              <div className="p-5">
                {editing ? (
                  <div className="grid gap-3">
                    <p className="text-caption text-muted">Edit anything — readers see exactly the preview on the left.</p>
                    <Field label="Headline">
                      <input value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Summary (about 60 words)">
                      <textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={4} className={inputClass} placeholder="A short, self-contained summary." />
                    </Field>
                    <Field label="The inside (fuller story, optional)">
                      <textarea value={draft.deepDive} onChange={(e) => setDraft({ ...draft, deepDive: e.target.value })} rows={4} className={inputClass} placeholder="A longer explanation for readers who tap in." />
                    </Field>
                    <Field label="Topic">
                      <select value={draft.topicSlug} onChange={(e) => setDraft({ ...draft, topicSlug: e.target.value })} className={inputClass}>
                        {topicOptions.map((topic) => <option key={topic.slug} value={topic.slug}>{topic.title}</option>)}
                      </select>
                    </Field>
                    <Field label="Image">
                      <input type="file" accept="image/*" onChange={(e) => onUploadImage(e.target.files?.[0] ?? null)} className="text-caption text-muted" />
                      {uploading ? <span className="ml-2 text-caption text-gold">Uploading…</span> : null}
                    </Field>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-caption text-muted">
                      {topicTitle ? <span className="rounded-full bg-pressed px-2 py-0.5">{topicTitle}</span> : null}
                      {draft.story.sourceName ? <span>{draft.story.sourceName}</span> : null}
                      {draft.aiGenerated ? <span className="rounded-full border border-plum px-2 py-0.5 text-plum">AI draft</span> : null}
                    </div>
                    <h3 className="font-headline text-title text-ink">{draft.headline}</h3>
                    <p className="mt-2 text-body text-ink">{draft.summary || <span className="text-muted">No summary yet — tap Edit to write one.</span>}</p>
                    {draft.aiGenerated ? (
                      <p className="mt-3 text-caption text-muted">This was drafted by the model. Check the facts before publishing.</p>
                    ) : null}
                    {draft.story.sourceLink ? (
                      <a href={draft.story.sourceLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-caption text-muted underline">Read the original</a>
                    ) : null}
                  </div>
                )}

                {error ? <p className="mt-3 text-caption text-red">{error}</p> : null}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 border-t border-hairline px-5 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
              <button
                onClick={() => setEditing((v) => !v)}
                className="rounded-full border border-hairline px-5 py-2.5 font-headline text-label text-ink hover:border-gold"
              >
                {editing ? "Done editing" : "Edit"}
              </button>
              <button
                onClick={() => skip(draft.story)}
                className="rounded-full border border-hairline px-5 py-2.5 font-headline text-label text-muted hover:text-ink"
              >
                Skip
              </button>
              <button
                onClick={publish}
                disabled={publishing || suggesting}
                className="ml-auto rounded-full bg-gold px-6 py-2.5 font-headline font-medium text-label text-bg disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const inputClass = "w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-caption text-muted">{label}</span>
      {children}
    </label>
  );
}

/** Mimics the reader's feed card so the editor sees what ships. */
function ReaderCardPreview({ image, topic, headline, summary }: { image: string | null; topic: string; headline: string; summary: string }) {
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-card border border-hairline bg-surface shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-pressed">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : null}
        {topic ? <span className="absolute left-3 top-3 rounded-full bg-bg/85 px-2 py-0.5 text-caption text-ink backdrop-blur">{topic}</span> : null}
      </div>
      <div className="p-4">
        <h4 className="font-headline text-[20px] leading-snug text-ink">{headline}</h4>
        <p className="mt-2 text-body text-ink">{summary || <span className="text-muted">Summary appears here.</span>}</p>
      </div>
    </div>
  );
}

/** Mimics the reader's detail (inside) view. */
function ReaderInsidePreview({ image, headline, deepDive }: { image: string | null; headline: string; deepDive: string }) {
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-card border border-hairline bg-surface shadow-sm">
      <div className="relative aspect-[16/9] w-full bg-pressed">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-4">
        <h4 className="font-headline text-title text-ink">{headline}</h4>
        <div className="mt-2 grid gap-2 text-body text-ink">
          {(deepDive || "").split(/\n{2,}/).filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
          {!deepDive ? <span className="text-muted">The fuller story appears here when a reader taps in.</span> : null}
        </div>
      </div>
    </div>
  );
}
