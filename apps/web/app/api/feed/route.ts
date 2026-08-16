import { type NextRequest, NextResponse } from "next/server";
import { getFeed } from "../../../lib/db/queries";
import { serializeCards, requestOrigin } from "../../../lib/apiSerialize";
import { withCors, corsPreflight } from "../../../lib/cors";

export async function GET(request: NextRequest) {
  const topicsParam = request.nextUrl.searchParams.get("topics");
  const topicSlugs = topicsParam ? topicsParam.split(",").filter(Boolean) : undefined;

  const cards = await getFeed({ topicSlugs });
  return withCors(NextResponse.json(serializeCards(cards, requestOrigin(request))));
}

export function OPTIONS() {
  return corsPreflight();
}
