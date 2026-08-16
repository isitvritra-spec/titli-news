"use client";

import { useSavedCardIds, useToggleSaved } from "../lib/savedCards";
import { BookmarkIcon } from "./icons/BookmarkIcon";

/**
 * The save/bookmark toggle on a card footer. Card footers sit inside a
 * `<Link>` to the story (see ReadingCard.tsx), so this stops propagation —
 * otherwise toggling save would also navigate.
 */
export function SaveButton({ cardId }: { cardId: string }) {
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();
  const isSaved = savedIds.includes(cardId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSaved(cardId);
      }}
      aria-label={isSaved ? "Remove from saved" : "Save"}
      className={isSaved ? "text-gold" : "text-muted"}
    >
      <BookmarkIcon size={18} active={isSaved} />
    </button>
  );
}
