import Image from "next/image";
import Link from "next/link";
import { isDataCard, type Card } from "@repo/api-client";
import { formatAsOf, formatCardDate, computeTrend } from "@repo/utils";

import { TrendBadge } from "./TrendBadge";
import { ContestedBadge } from "./ContestedBadge";
import { SaveButton } from "./SaveButton";
import { ShareButton } from "./ShareButton";

/**
 * Mirrors apps/mobile/components/ReadingCard.tsx: same editorial canvas,
 * proportions, and reading hierarchy, with DOM-native navigation and actions.
 */
export function ReadingCard({ card, index = 0 }: { card: Card; index?: number }) {
  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;
  const canvases = ["bg-peach", "bg-lilac", "bg-lime", "bg-sage", "bg-sky"];
  const canvas = canvases[index % canvases.length];

  return (
    <section className={`h-dvh w-full snap-start snap-always shrink-0 flex flex-col ${canvas}`}>
      <div className="relative h-[31%] min-h-[170px] w-full shrink-0 overflow-hidden md:mx-auto md:mt-14 md:h-[36%] md:max-w-2xl md:rounded-[28px]">
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
        className="flex flex-1 flex-col bg-surface px-5 pt-4 md:mx-auto md:mt-3 md:w-full md:max-w-2xl md:rounded-[28px] md:px-7"
      >
        {card.isContested || card.correctedAt ? (
          <div className="mb-3 flex items-center gap-2">
            {card.isContested ? <ContestedBadge /> : null}
            {card.correctedAt ? (
              <span className="rounded-full border border-gold px-2.5 py-1 text-caption text-gold">
                Corrected
              </span>
            ) : null}
          </div>
        ) : null}

        <h2 className="font-headline text-[28px] leading-[35px] text-ink line-clamp-3">{card.headline}</h2>

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
            <span className="font-label text-caption uppercase tracking-[1.4px] text-muted">
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
