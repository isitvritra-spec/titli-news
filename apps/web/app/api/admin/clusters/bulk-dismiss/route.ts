import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { dismissClusters } from "../../../../../lib/db/clusterQueries";
import { recordAdminAction } from "../../../../../lib/db/auditQueries";

const bodySchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nothing to dismiss" }, { status: 400 });
  }

  await dismissClusters(parsed.data.ids);
  await recordAdminAction({
    action: "cluster_dismiss",
    entityType: "cluster",
    entityId: `${parsed.data.ids.length} clusters`,
    detail: "bulk dismiss",
  });
  return NextResponse.json({ ok: true, dismissed: parsed.data.ids.length });
}
