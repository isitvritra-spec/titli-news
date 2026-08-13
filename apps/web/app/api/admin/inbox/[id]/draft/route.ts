import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../../../lib/adminAuth";
import { getInboxCandidateById, prepareDraft } from "../../../../../../lib/db/inboxQueries";

export async function POST(_request: Request, context: RouteContext<"/api/admin/inbox/[id]/draft">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const candidate = await getInboxCandidateById(id);
  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prepareDraft(id);
  return NextResponse.json({ ok: true });
}
