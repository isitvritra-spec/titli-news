import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { dismissCluster, shortlistCluster } from "../../../../../lib/db/clusterQueries";
import { recordAdminAction } from "../../../../../lib/db/auditQueries";

const actionSchema = z.object({
  action: z.enum(["dismiss", "shortlist", "unshortlist"]),
});

export async function POST(request: Request, context: RouteContext<"/api/admin/clusters/[id]">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (parsed.data.action === "dismiss") {
    await dismissCluster(id);
    await recordAdminAction({ action: "cluster_dismiss", entityType: "cluster", entityId: id });
  } else {
    await shortlistCluster(id, parsed.data.action === "shortlist");
  }

  return NextResponse.json({ ok: true });
}
