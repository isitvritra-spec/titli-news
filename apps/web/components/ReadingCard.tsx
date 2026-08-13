import Image from "next/image";
import Link from "next/link";
import { isDataCard, type Card } from "@repo/api-client";
import { formatAsOf, formatCardDate, computeTrend } from "@repo/utils";

import { TrendBadge } from "./TrendBadge";
import { ContestedBadge } from "./ContestedBadge";

/**
 * Mirrors apps/mobile/components/ReadingCard.tsx: same tokens, same layout
 * proportions, same copy — a separate implementation because RN has no DOM,
 * but built to look like the same product. Image is its own block up top
 * (not a full-bleed background with text overlaid), matching the brand's
 * usage notes: photos and the ~60-word body both stay legible on the near-
 * black base.
 */
export function ReadingCard({ card }: { card: Card }) {
  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;

  return (
    <section className="h-dvh w-full snap-start snap-always shrink-0 flex flex-col bg-bg">
      <div className="relative h-[56%] w-full shrink-0 overflow-hidden">
        <Image
          src={card.image.url}
          alt={card.image.alt}
          fill
          sizes="100vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={card.image.blurDataURL}
          priority={false}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <Link
        href={`/card/${card.slug}`}
        className="flex flex-1 flex-col px-5 pt-4 md:mx-auto md:w-full md:max-w-xl"
      >
        {card.isContested ? <div className="mb-3"><ContestedBadge /></div> : null}

        <h2 className="font-headline text-2xl text-ink line-clamp-3">{card.headline}</h2>

        {isData && trend?.latest ? (
          <p className="mt-1 text-xs text-muted">
            {formatAsOf(trend.latest.year, card.surveySource.name)}
          </p>
        ) : null}

        <p className="mt-3 text-base leading-relaxed text-ink line-clamp-6">{card.body}</p>

        <div className="mt-auto mb-6 flex items-center justify-between">
          {isData ? (
            trend ? <TrendBadge readings={card.readings} /> : <span />
          ) : (
            <span className="text-xs uppercase tracking-wide text-muted">
              {card.source.name} · {formatCardDate(card.sourceDate)}
            </span>
          )}
          <span className="text-xs text-muted">Read more</span>
        </div>
      </Link>
    </section>
  );
}
