"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "../../../components/BrandMark";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError("Incorrect password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <div className="mb-6">
          <BrandMark size={28} />
        </div>
        <h1 className="font-headline text-title text-ink mb-6">Editor sign-in</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-ink placeholder:text-muted"
        />
        {error ? <p className="mt-2 text-caption text-gold">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-gold px-4 py-2 font-headline font-medium text-label text-bg disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
