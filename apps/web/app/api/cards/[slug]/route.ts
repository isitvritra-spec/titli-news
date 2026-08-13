import { type NextRequest, NextResponse } from "next/server";
import { getCardBySlug } from "../../../../lib/db/queries";
import { serializeCardDetail } from "../../../../lib/apiSerialize";

export async function GET(request: NextRequest, context: RouteContext<"/api/cards/[slug]">) {
  const { slug } = await context.params;
  const card = await getCardBySlug(slug);

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeCardDetail(card, request.nextUrl.origin));
}
