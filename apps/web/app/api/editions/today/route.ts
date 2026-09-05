import { type NextRequest, NextResponse } from "next/server";

import { withCors, corsPreflight } from "../../../../lib/cors";
import { serializeTodayEdition, requestOrigin } from "../../../../lib/apiSerialize";
import { getLatestPublishedEdition, getPublishedEdition } from "../../../../lib/db/editionQueries";

export async function GET(request: NextRequest) {
  const edition = await getPublishedEdition() ?? await getLatestPublishedEdition();
  if (!edition) {
    return withCors(
      NextResponse.json({ error: "Today's edition is being prepared." }, { status: 404 })
    );
  }

  const response = NextResponse.json(serializeTodayEdition(edition, requestOrigin(request)));
  response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return withCors(response);
}

export function OPTIONS() {
  return corsPreflight();
}
