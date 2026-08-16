import Image from "next/image";
import Link from "next/link";
import { isDataCard, type Card } from "@repo/api-client";
import { formatAsOf, formatCardDate, computeTrend } from "@repo/utils";

import { TrendBadge } from "./TrendBadge";
import { ContestedBadge } from "./ContestedBadge";
import { SaveButton } from "./SaveButton";
import { ShareButton } from "./ShareButton";

/**
 * Mirrors apps/mobile/components/ReadingCard.tsx: same tokens, same layout
 * proportions, same copy — a separate implementation because RN has no DOM,
 * but built to look like the same product. Image is its own block up top,
 * ~40% of the card (not a full-bleed background with text overlaid) — text
 * sits below it on the flat near-black, so no gradient scrim is needed.
 */
export function ReadingCard({ card }: { card: Card }) {
  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;

  return (
    <section className="h-dvh w-full snap-start snap-always shrink-0 flex flex-col bg-bg">
      <div className="relative h-[40%] w-full shrink-0 overflow-hidden">
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
      </div>

      <Link
        href={`/card/${card.slug}`}
        className="flex flex-1 flex-col px-5 pt-4 md:mx-auto md:w-full md:max-w-xl"
      >
        {card.isContested ? <div className="mb-3"><ContestedBadge /></div> : null}

        <h2 className="font-headline text-title text-ink line-clamp-3">{card.headline}</h2>

        {isData && card.metric ? (
          <p className="mt-1 font-headline text-hero text-ink tabular-nums">
            {card.metric.value}
            {card.metric.unit}
          </p>
        ) : null}

        {isData && trend ? (
          <div className="mt-1">
            <TrendBadge readings={card.readings} />
          </div>
        ) : null}

        {isData && trend?.latest ? (
          <p className="mt-0.5 text-caption text-muted">
            {formatAsOf(trend.latest.year, card.surveySource.name)}
          </p>
        ) : null}

        <p className="mt-3 text-body leading-relaxed text-ink line-clamp-6">{card.body}</p>

        <div className="mt-auto mb-6 flex items-center justify-between border-t border-hairline pt-3">
          {isData ? (
            <span />
          ) : (
            <span className="text-caption uppercase tracking-wide text-muted">
              {card.source.name} · {formatCardDate(card.sourceDate)}
            </span>
          )}
          <div className="flex items-center gap-4">
            <SaveButton cardId={card.id} />
            <ShareButton slug={card.slug} headline={card.headline} />
          </div>
        </div>
      </Link>
    </section>
  );
}
