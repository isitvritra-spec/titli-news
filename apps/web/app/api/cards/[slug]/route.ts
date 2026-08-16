import { type NextRequest, NextResponse } from "next/server";
import { getCardBySlug } from "../../../../lib/db/queries";
import { serializeCardDetail, requestOrigin } from "../../../../lib/apiSerialize";
import { withCors, corsPreflight } from "../../../../lib/cors";

export async function GET(request: NextRequest, context: RouteContext<"/api/cards/[slug]">) {
  const { slug } = await context.params;
  const card = await getCardBySlug(slug);

  if (!card) {
    return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
  }

  return withCors(NextResponse.json(serializeCardDetail(card, requestOrigin(request))));
}

export function OPTIONS() {
  return corsPreflight();
}
