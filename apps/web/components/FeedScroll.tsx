"use client";

import { useEffect, useRef } from "react";
import type { Card } from "@repo/api-client";
import { ReadingCard } from "./ReadingCard";

/**
 * Native CSS scroll-snap for the "one full card at a time" feel — works
 * with wheel/trackpad/touch for free, no JS gesture reimplementation. The
 * only JS here is an ArrowUp/ArrowDown affordance mirroring the swipe
 * metaphor for keyboard users.
 */
export function FeedScroll({ cards }: { cards: Card[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const container = containerRef.current;
      if (!container) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      event.preventDefault();
      const cardHeight = container.clientHeight;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      container.scrollBy({ top: cardHeight * direction, behavior: "smooth" });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-dvh w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
    >
      {cards.map((card) => (
        <ReadingCard key={card.id} card={card} />
      ))}
    </div>
  );
}
