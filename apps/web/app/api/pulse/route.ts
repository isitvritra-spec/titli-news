import { type NextRequest, NextResponse } from "next/server";

import { withCors, corsPreflight } from "../../../lib/cors";
import { requestOrigin } from "../../../lib/apiSerialize";
import { getPulse } from "../../../lib/db/queries";

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const metrics = (await getPulse()).map((metric) => ({
    ...metric,
    sourceUrl: metric.sourceUrl.startsWith("/")
      ? new URL(metric.sourceUrl, origin).toString()
      : metric.sourceUrl,
  }));
  return withCors(NextResponse.json(metrics));
}

export function OPTIONS() {
  return corsPreflight();
}
