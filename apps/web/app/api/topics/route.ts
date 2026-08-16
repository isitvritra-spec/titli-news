import { NextResponse } from "next/server";
import { getTopics } from "../../../lib/db/queries";
import { withCors, corsPreflight } from "../../../lib/cors";

export async function GET() {
  const topics = await getTopics();
  return withCors(NextResponse.json(topics));
}

export function OPTIONS() {
  return corsPreflight();
}
