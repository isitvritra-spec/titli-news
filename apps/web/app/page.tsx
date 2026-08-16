import { getFeed } from "../lib/db/queries";
import { FeedScroll } from "../components/FeedScroll";
import { FeedHeader } from "../components/FeedHeader";

/** Safety-net time-based refresh; the admin UI triggers on-demand revalidation on every write (see app/api/admin/cards/route.ts). */
export const revalidate = 3600;

export default async function Home() {
  const cards = await getFeed();

  if (cards.length === 0) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-headline text-title text-ink">No cards yet.</p>
        <p className="text-caption text-muted">Check back soon.</p>
      </main>
    );
  }

  return (
    <main className="relative">
      <FeedHeader />
      <FeedScroll cards={cards} />
    </main>
  );
}
