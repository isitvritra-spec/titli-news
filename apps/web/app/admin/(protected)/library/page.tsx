import Link from "next/link";
import { formatCardDate } from "@repo/utils";
import { listCardsPage } from "../../../../lib/db/adminQueries";
import { getTopics } from "../../../../lib/db/queries";
import { DeleteCardButton } from "../../../../components/admin/DeleteCardButton";
import { CardsFilters } from "../../../../components/admin/CardsFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminDashboard(props: PageProps<"/admin/library">) {
  const searchParams = await props.searchParams;
  const pick = (key: string) =>
    typeof searchParams[key] === "string" ? (searchParams[key] as string) : undefined;

  const page = Math.max(1, Number(pick("page") ?? "1") || 1);
  const status = pick("status") as "draft" | "published" | "archived" | undefined;

  const [{ rows, total }, topics] = await Promise.all([
    listCardsPage({
      search: pick("q"),
      status,
      topicId: pick("topic"),
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    getTopics(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = new URLSearchParams();
  for (const key of ["q", "status", "topic"]) {
    const value = pick(key);
    if (value) query.set(key, value);
  }
  const pageHref = (n: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(n));
    return `/admin/library?${q.toString()}`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-title text-ink">Cards</h1>
        <Link href="/admin/cards/new" className="rounded-full bg-gold px-4 py-2 font-headline font-medium text-label text-bg">
          + New card
        </Link>
      </div>

      <CardsFilters topics={topics.map((topic) => ({ id: topic.id, title: topic.title }))} />

      <p className="mb-3 text-caption text-muted">
        {total} card{total === 1 ? "" : "s"}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </p>

      {rows.length === 0 ? (
        <p className="text-muted">No cards match these filters.</p>
      ) : (
        <ul>
          {rows.map((card) => (
            <li key={card.id} className="flex items-center justify-between border-b border-hairline py-3">
              <div>
                <span
                  className={`mr-2 rounded-full border px-2 py-0.5 text-caption uppercase tracking-wide ${
                    card.status === "published" ? "border-gold text-gold" : "border-hairline text-muted"
                  }`}
                >
                  {card.status}
                </span>
                <span className="text-caption uppercase tracking-wide text-muted mr-2">{card.cardType}</span>
                {card.aiGenerated ? (
                  <span className="mr-2 rounded-full bg-pressed px-2 py-0.5 text-caption text-plum">AI</span>
                ) : null}
                <span className="text-ink">{card.headline}</span>
                <span className="block text-caption text-muted mt-0.5">
                  {card.status === "published" ? "Published" : "Updated"} {formatCardDate(card.publishedAt)}
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

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-headline text-label text-gold">← Newer</Link>
          ) : <span />}
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="font-headline text-label text-gold">Older →</Link>
          ) : <span />}
        </div>
      ) : null}
    </div>
  );
}
