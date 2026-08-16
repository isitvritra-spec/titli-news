"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { ChevronLeftIcon } from "./icons/ChevronLeftIcon";

/**
 * The overlay chrome for the intercepted-route modal (app/@modal/(.)card/[slug]).
 * The feed underneath stays mounted; this closes back to it via router.back()
 * rather than a hardcoded href, so back-navigation behaves correctly.
 */
export function CardModalShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-surface2">
      <button
        onClick={() => router.back()}
        className="fixed left-5 top-5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-pressed text-ink"
        aria-label="Close"
      >
        <ChevronLeftIcon size={20} />
      </button>
      {children}
    </div>
  );
}
