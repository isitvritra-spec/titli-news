import Image from "next/image";
import { isDataCard, type CardDetail } from "@repo/api-client";
import { formatAsOf, formatCardDate } from "@repo/utils";

import { ContestedBadge } from "./ContestedBadge";

export function CardDetailContent({ card }: { card: CardDetail }) {
  const isData = isDataCard(card);
  const deepDiveParagraphs = card.deepDiveBody
    ? card.deepDiveBody.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <article>
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src={card.image.url}
          alt={card.image.alt}
          fill
          sizes="100vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={card.image.blurDataURL}
        />
      </div>

      <div className="px-5 py-5 md:mx-auto md:max-w-xl">
        {card.isContested ? <div className="mb-3"><ContestedBadge /></div> : null}

        <h1 className="font-headline text-3xl text-ink">{card.headline}</h1>

        {isData ? (
          <p className="mt-2 text-sm text-muted">
            {formatAsOf(
              [...card.readings].sort((a, b) => a.year - b.year).at(-1)!.year,
              card.surveySource.name
            )}
          </p>
        ) : (
          <p className="mt-2 text-sm uppercase tracking-wide text-muted">
            {card.source.name} · {formatCardDate(card.sourceDate)}
          </p>
        )}

        <p className="mt-4 text-base leading-relaxed text-ink">{card.body}</p>

        {deepDiveParagraphs.length > 0 ? (
          deepDiveParagraphs.map((paragraph, i) => (
            <p key={i} className="mt-3 text-base leading-relaxed text-ink">
              {paragraph}
            </p>
          ))
        ) : (
          <a
            href={isData ? card.surveySource.url : card.source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-full border border-gold px-4 py-2 text-gold"
          >
            Read the full story at {isData ? card.surveySource.name : card.source.name}
          </a>
        )}

        {isData && card.stateBreakdown && card.stateBreakdown.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-2 font-headline text-lg text-ink">By state</h2>
            <ul>
              {[...card.stateBreakdown]
                .sort((a, b) => b.value - a.value)
                .map((row, i) => (
                  <li
                    key={`${row.state}-${i}`}
                    className="flex items-center justify-between border-b border-hairline py-2 text-sm"
                  >
                    <span className="text-ink">{row.state}</span>
                    <span className="text-muted">
                      {row.value.toLocaleString("en-IN")}
                      {row.year ? ` (${row.year})` : ""}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {isData && card.readings.length > 1 ? (
          <div className="mt-6">
            <h2 className="mb-2 font-headline text-lg text-ink">Over time</h2>
            <ul>
              {[...card.readings]
                .sort((a, b) => a.year - b.year)
                .map((reading) => (
                  <li key={reading.year} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-muted">{reading.year}</span>
                    <span className="text-ink">{reading.value.toLocaleString("en-IN")}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {isData && card.methodologyNote ? (
          <p className="mt-6 text-xs leading-relaxed text-muted">{card.methodologyNote}</p>
        ) : null}
      </div>
    </article>
  );
}
