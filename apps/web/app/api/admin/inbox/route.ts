import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import { listInboxCandidates, refreshInbox } from "../../../../lib/db/inboxQueries";
import { clusterAndScoreInbox } from "../../../../lib/db/clusterQueries";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listInboxCandidates());
}

/**
 * "Refresh inbox" — fetches all RSS sources now, stores anything new, then
 * reclusters and rescores so the triage board reflects the pull in one step
 * (the same work the morning cron does).
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const newCount = await refreshInbox();
  const triage = await clusterAndScoreInbox();
  return NextResponse.json({ newCount, ...triage });
}
