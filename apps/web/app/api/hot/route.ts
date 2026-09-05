import { type NextRequest, NextResponse } from "next/server";

import { withCors, corsPreflight } from "../../../lib/cors";
import { requestOrigin, serializeCard } from "../../../lib/apiSerialize";
import { getHotStories } from "../../../lib/db/analyticsQueries";

export async function GET(request: NextRequest) {
  const editionId = request.nextUrl.searchParams.get("editionId")?.slice(0, 128);
  const stories = await getHotStories({ excludeEditionId: editionId || undefined });
  const origin = requestOrigin(request);
  return withCors(NextResponse.json(
    stories.map((story) => ({ ...story, card: serializeCard(story.card, origin) })),
  ));
}

export function OPTIONS() {
  return corsPreflight();
}
