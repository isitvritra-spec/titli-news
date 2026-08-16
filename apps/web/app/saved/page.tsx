"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isDataCard, type Card } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";

import { useSavedCardIds, useToggleSaved } from "../../lib/savedCards";
import { BrandMark } from "../../components/BrandMark";
import { BookmarkIcon } from "../../components/icons/BookmarkIcon";

function savedSubtitle(card: Card) {
  if (isDataCard(card)) {
    const trend = computeTrend(card.readings);
    const asOf = trend?.latest ? formatAsOf(trend.latest.year, card.surveySource.name) : card.surveySource.name;
    return card.metric ? `${card.metric.value}${card.metric.unit} · ${asOf}` : asOf;
  }
  return `${card.source.name} · ${formatCardDate(card.sourceDate)}`;
}

/**
 * No accounts, no server-side saved state — reads /api/feed (the same JSON
 * apps/mobile consumes) and filters to the localStorage-backed ids from
 * lib/savedCards.ts, unfiltered by topic so a saved card stays visible even
 * if its topic gets turned off later.
 */
export default function SavedPage() {
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    fetch("/api/feed")
      .then((res) => res.json())
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  const savedCards = (cards ?? []).filter((card) => savedIds.includes(card.id));

  return (
    <main className="min-h-dvh px-6 py-10 md:mx-auto md:max-w-xl">
      <Link href="/" className="inline-flex">
        <BrandMark />
      </Link>
      <h1 className="font-headline text-title text-ink mt-4 mb-1">Saved</h1>

      {cards === null ? (
        <p className="text-caption text-muted mt-8">Loading…</p>
      ) : savedCards.length === 0 ? (
        <p className="text-body leading-relaxed text-muted mt-8">
          Nothing saved yet — tap the bookmark on any card to keep it here.
        </p>
      ) : (
        <ul className="flex flex-col mt-6">
          {savedCards.map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between gap-3 border-b border-hairline py-4"
            >
              <Link href={`/card/${card.slug}`} className="min-w-0 flex-1">
                <span className="block font-headline text-body text-ink truncate">{card.headline}</span>
                <span className="block text-caption text-muted mt-0.5 tabular-nums">
                  {savedSubtitle(card)}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => toggleSaved(card.id)}
                aria-label="Remove from saved"
                className="shrink-0 text-gold"
              >
                <BookmarkIcon size={18} active />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
