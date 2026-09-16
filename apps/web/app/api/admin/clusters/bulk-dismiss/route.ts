import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { dismissClusters } from "../../../../../lib/db/clusterQueries";

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
  return NextResponse.json({ ok: true, dismissed: parsed.data.ids.length });
}
