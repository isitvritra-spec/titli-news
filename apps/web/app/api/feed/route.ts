import { type NextRequest, NextResponse } from "next/server";
import { getFeed } from "../../../lib/db/queries";
import { serializeCards } from "../../../lib/apiSerialize";

export async function GET(request: NextRequest) {
  const topicsParam = request.nextUrl.searchParams.get("topics");
  const topicSlugs = topicsParam ? topicsParam.split(",").filter(Boolean) : undefined;

  const cards = await getFeed({ topicSlugs });
  return NextResponse.json(serializeCards(cards, request.nextUrl.origin));
}
