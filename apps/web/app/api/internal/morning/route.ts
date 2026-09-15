import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { ensureEditionDraft, editionDateInIndia } from "../../../../lib/db/editionQueries";
import { refreshInbox } from "../../../../lib/db/inboxQueries";
import { clusterAndScoreInbox } from "../../../../lib/db/clusterQueries";

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

  // Pull first, then cluster+score the whole untriaged set, so the inbox is
  // deduplicated and ranked before the editor opens it. Clustering depends on
  // the freshly-pulled rows, so it runs after refresh rather than alongside it.
  const [newCandidateCount, edition] = await Promise.all([
    refreshInbox(),
    ensureEditionDraft(editionDate),
  ]);
  const triage = await clusterAndScoreInbox();

  return NextResponse.json({
    ok: true,
    editionDate,
    editionId: edition.id,
    editionStatus: edition.status,
    newCandidateCount,
    clusters: triage.clusters,
    keptCandidates: triage.kept,
    rejectedCandidates: triage.rejected,
  });
}
