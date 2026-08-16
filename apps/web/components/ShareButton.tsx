"use client";

import { ShareIcon } from "./icons/ShareIcon";

/**
 * The share button on a card footer. Web Share API where available (most
 * mobile browsers), falling back to copying the story's URL to the
 * clipboard on desktop. Card footers sit inside a `<Link>` (see
 * ReadingCard.tsx), so this stops propagation the same way SaveButton does.
 */
export function ShareButton({ slug, headline }: { slug: string; headline: string }) {
  async function onShare(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}/card/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: headline, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <button type="button" onClick={onShare} aria-label="Share" className="text-muted">
      <ShareIcon size={18} />
    </button>
  );
}
