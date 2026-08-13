import type { Card, CardDetail } from "@repo/api-client";

/**
 * DB/query-layer image URLs are root-relative (next/image on the web app
 * is fine with that). The JSON API routes serve mobile too, which has no
 * concept of "relative to this origin" — so responses get the image URL
 * resolved to absolute using the incoming request's own origin.
 */
function absolutize<T extends { image: { url: string } }>(item: T, origin: string): T {
  if (!item.image.url.startsWith("/")) return item;
  return { ...item, image: { ...item.image, url: origin + item.image.url } };
}

export function serializeCard(card: Card, origin: string): Card {
  return absolutize(card, origin);
}

export function serializeCards(cards: Card[], origin: string): Card[] {
  return cards.map((card) => absolutize(card, origin));
}

export function serializeCardDetail(card: CardDetail, origin: string): CardDetail {
  return absolutize(card, origin);
}
