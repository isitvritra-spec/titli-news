"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCardButton({ id, headline }: { id: string; headline: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onClick() {
    if (!confirm(`Delete "${headline}"? This can't be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/cards/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={onClick} disabled={deleting} className="font-headline font-medium text-label text-muted hover:text-ink disabled:opacity-50">
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
