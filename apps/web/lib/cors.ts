import { NextResponse } from "next/server";

/**
 * These three routes (feed, cards/[slug], topics) are the public,
 * unauthenticated read API the README already documents as existing for
 * apps/mobile's HTTP client — cross-origin by design. Native fetch on
 * iOS/Android never enforces CORS, so this only started mattering once the
 * mobile app could also run as a web build (localhost:8081) reading from
 * the site's own origin (e.g. 192.168.29.148:3000).
 *
 * Deliberately not applied to /api/admin/* — those mutate data and rely on
 * a same-origin cookie session; opening CORS there would be a real
 * regression, not a convenience.
 */
export const PUBLIC_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
} as const;

export function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(PUBLIC_CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: PUBLIC_CORS_HEADERS });
}
