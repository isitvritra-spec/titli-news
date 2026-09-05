"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type PrototypeVariant = "A" | "B" | "C";

const ORDER: PrototypeVariant[] = ["A", "B", "C"];

export function PrototypeSwitcher({
  current,
  labels,
}: {
  current: PrototypeVariant;
  labels: Record<PrototypeVariant, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function move(direction: -1 | 1) {
    const index = ORDER.indexOf(current);
    const next = ORDER[(index + direction + ORDER.length) % ORDER.length]!;
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, textarea, select, [contenteditable='true']") ||
        (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
      ) {
        return;
      }

      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-black/90 p-1.5 text-white shadow-2xl backdrop-blur"
      aria-label="Prototype variants"
    >
      <button
        type="button"
        onClick={() => move(-1)}
        className="grid size-9 place-items-center rounded-full text-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label="Previous variant"
      >
        &larr;
      </button>
      <div className="min-w-48 px-3 text-center font-headline text-label">
        {current} &middot; {labels[current]}
      </div>
      <button
        type="button"
        onClick={() => move(1)}
        className="grid size-9 place-items-center rounded-full text-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label="Next variant"
      >
        &rarr;
      </button>
    </div>
  );
}
