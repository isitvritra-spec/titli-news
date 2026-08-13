import Link from "next/link";
import { BrandMark } from "./BrandMark";

/**
 * The persistent brand nav across the reading surfaces (feed, topic feeds).
 * The mark itself is the "back to feed" affordance — clicking it goes home,
 * the way a site logo conventionally does — so there's no separate back
 * link competing for space in this slim overlay bar.
 */
export function FeedHeader({ title }: { title?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
      <Link href="/" className="pointer-events-auto flex items-center gap-2">
        <BrandMark />
        {title ? <span className="text-sm text-muted">· {title}</span> : null}
      </Link>
      <Link
        href="/topics"
        className="pointer-events-auto rounded-full border border-gold bg-pressed px-4 py-2 text-sm text-ink"
      >
        Topics
      </Link>
    </div>
  );
}
