import type { NextRequest } from "next/server";
import type { Card, CardDetail } from "@repo/api-client";

/**
 * request.nextUrl.origin doesn't reflect the Host header actually used to
 * reach this server in this Next.js version — it returns a fixed
 * localhost:PORT regardless of what host/IP the client connected through
 * (confirmed: identical across localhost, LAN IP, and an explicit Host
 * header override). That silently breaks every image URL for any client
 * that isn't literally the machine running the server — including a real
 * phone on the LAN, where "localhost" means the phone itself. Read the
 * Host header directly instead; it always reflects how the client actually
 * addressed the request.
 */
export function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

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
