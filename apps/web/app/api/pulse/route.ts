import { NextResponse } from "next/server";

import { withCors, corsPreflight } from "../../../lib/cors";
import { getPulse } from "../../../lib/db/queries";

export async function GET() {
  return withCors(NextResponse.json(await getPulse()));
}

export function OPTIONS() {
  return corsPreflight();
}
