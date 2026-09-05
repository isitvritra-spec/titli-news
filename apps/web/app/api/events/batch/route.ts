import { NextResponse } from "next/server";
import { z } from "zod";

import { withCors, corsPreflight } from "../../../../lib/cors";
import { insertAnalyticsEvents } from "../../../../lib/db/analyticsQueries";

const eventSchema = z.object({
  installationId: z.string().min(8).max(128),
  sessionId: z.string().min(8).max(128),
  eventType: z.enum([
    "app_open",
    "edition_start",
    "edition_complete",
    "card_view",
    "card_dwell",
    "card_detail_open",
    "card_save",
    "card_unsave",
    "card_share",
    "source_open",
    "genre_follow",
    "genre_unfollow",
    "pulse_open",
    "why_this_open",
    "less_like_this",
  ]),
  editionId: z.string().max(128).optional(),
  cardId: z.string().max(128).optional(),
  topicSlug: z.string().max(128).optional(),
  durationMs: z.number().int().min(0).max(300_000).optional(),
  position: z.number().int().min(0).max(100_000).optional(),
  occurredAt: z.iso.datetime(),
});

const batchSchema = z.object({ events: z.array(eventSchema).min(1).max(50) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: "Invalid analytics batch" }, { status: 400 })
    );
  }

  const accepted = await insertAnalyticsEvents(parsed.data.events);
  return withCors(NextResponse.json({ accepted }, { status: 202 }));
}

export function OPTIONS() {
  return corsPreflight();
}
