"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Topic } from "@repo/api-client";

export function TopicManager({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"));
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    setSubmitting(true);
    await fetch("/api/admin/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, shortDescription: shortDescription || undefined }),
    });
    setSubmitting(false);
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setShortDescription("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-headline text-title text-ink mb-6">Topics</h1>

      <ul className="mb-8">
        {topics.map((topic) => (
          <li key={topic.id} className="border-b border-hairline py-2 text-ink">
            {topic.title}{" "}
            {topic.shortDescription ? <span className="text-muted text-caption">— {topic.shortDescription}</span> : null}
          </li>
        ))}
        {topics.length === 0 ? <li className="text-muted">No topics yet.</li> : null}
      </ul>

      <form onSubmit={onSubmit}>
        <p className="text-caption text-muted mb-2">Add a topic</p>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Title"
          className="mb-2 w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-ink placeholder:text-muted"
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="slug"
          className="mb-2 w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-ink placeholder:text-muted"
        />
        <input
          type="text"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="mb-3 w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-ink placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gold px-4 py-2 font-headline font-medium text-label text-bg disabled:opacity-50"
        >
          Add topic
        </button>
      </form>
    </div>
  );
}
