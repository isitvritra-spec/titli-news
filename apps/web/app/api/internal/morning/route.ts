import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { ensureEditionDraft, editionDateInIndia } from "../../../../lib/db/editionQueries";
import { refreshInbox } from "../../../../lib/db/inboxQueries";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !token) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const editionDate = editionDateInIndia();
  const [newCandidateCount, edition] = await Promise.all([
    refreshInbox(),
    ensureEditionDraft(editionDate),
  ]);

  return NextResponse.json({
    ok: true,
    editionDate,
    editionId: edition.id,
    editionStatus: edition.status,
    newCandidateCount,
  });
}
