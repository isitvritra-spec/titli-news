import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isNewsCard } from "@repo/api-client";
import { getAllCardSlugs, getCardBySlug } from "../../../lib/db/queries";
import { CardDetailContent } from "../../../components/CardDetailContent";
import { BrandMark } from "../../../components/BrandMark";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllCardSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/card/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const card = await getCardBySlug(slug);
  if (!card) return {};

  return {
    title: card.headline,
    description: card.body,
    openGraph: {
      title: card.headline,
      description: card.body,
      images: [card.image.url],
      type: "article",
    },
  };
}

export default async function CardPage(props: PageProps<"/card/[slug]">) {
  const { slug } = await props.params;
  const card = await getCardBySlug(slug);
  if (!card) notFound();

  const jsonLd = isNewsCard(card)
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: card.headline,
        image: [card.image.url],
        datePublished: card.sourceDate,
        description: card.body,
      }
    : null;

  return (
    <main className="min-h-dvh bg-surface2">
      <div className="flex items-center justify-between px-5 pt-5 md:mx-auto md:max-w-xl">
        <Link href="/" className="inline-flex">
          <BrandMark />
        </Link>
        <Link href="/" className="font-headline font-medium text-label text-muted">
          ← Feed
        </Link>
      </div>
      <CardDetailContent card={card} />
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </main>
  );
}
