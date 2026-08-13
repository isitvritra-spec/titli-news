import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../../../lib/adminAuth";
import { dismissCandidate } from "../../../../../../lib/db/inboxQueries";

export async function POST(_request: Request, context: RouteContext<"/api/admin/inbox/[id]/dismiss">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  await dismissCandidate(id);
  return NextResponse.json({ ok: true });
}
