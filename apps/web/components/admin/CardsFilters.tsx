"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CardsFilters({ topics }: { topics: { id: string; title: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function apply(next: Record<string, string>) {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    query.delete("page"); // any filter change returns to the first page
    router.push(`/admin?${query.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <input
        defaultValue={params.get("q") ?? ""}
        onKeyDown={(event) => {
          if (event.key === "Enter") apply({ q: (event.target as HTMLInputElement).value });
        }}
        placeholder="Search headlines… (Enter)"
        className="min-w-[200px] flex-1 rounded-md border border-hairline bg-transparent px-3 py-1.5 text-body text-ink placeholder:text-muted"
      />
      <select
        value={params.get("status") ?? ""}
        onChange={(event) => apply({ status: event.target.value })}
        className="rounded-md border border-hairline bg-transparent px-2 py-1.5 text-caption text-ink"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
      <select
        value={params.get("topic") ?? ""}
        onChange={(event) => apply({ topic: event.target.value })}
        className="rounded-md border border-hairline bg-transparent px-2 py-1.5 text-caption text-ink"
        aria-label="Filter by topic"
      >
        <option value="">All topics</option>
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>{topic.title}</option>
        ))}
      </select>
    </div>
  );
}
