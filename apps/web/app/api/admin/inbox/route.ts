import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import { listInboxCandidates, refreshInbox } from "../../../../lib/db/inboxQueries";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listInboxCandidates());
}

/** "Check for new articles" — fetches all RSS sources now and stores anything not already seen. */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const newCount = await refreshInbox();
  return NextResponse.json({ newCount });
}
