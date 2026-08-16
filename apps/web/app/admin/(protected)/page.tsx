import Link from "next/link";
import { formatCardDate } from "@repo/utils";
import { listCardsForAdmin } from "../../../lib/db/adminQueries";
import { DeleteCardButton } from "../../../components/admin/DeleteCardButton";

export default async function AdminDashboard() {
  const cards = await listCardsForAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-title text-ink">Cards</h1>
        <Link href="/admin/cards/new" className="rounded-full bg-gold px-4 py-2 font-headline font-medium text-label text-bg">
          + New card
        </Link>
      </div>

      {cards.length === 0 ? (
        <p className="text-muted">No cards yet — create the first one.</p>
      ) : (
        <ul>
          {[...cards].reverse().map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between border-b border-hairline py-3"
            >
              <div>
                <span className="text-caption uppercase tracking-wide text-muted mr-2">
                  {card.cardType}
                </span>
                <span className="text-ink">{card.headline}</span>
                <span className="block text-caption text-muted mt-0.5">
                  {formatCardDate(card.publishedAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/cards/${card.id}/edit`} className="font-headline font-medium text-label text-gold">
                  Edit
                </Link>
                <DeleteCardButton id={card.id} headline={card.headline} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
