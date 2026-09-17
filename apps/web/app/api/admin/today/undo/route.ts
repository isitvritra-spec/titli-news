import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { undoPublish } from "../../../../../lib/db/moderationQueries";
import { recordAdminAction } from "../../../../../lib/db/auditQueries";

const bodySchema = z.object({ cardId: z.string().min(1), clusterId: z.string().optional() });

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing card" }, { status: 400 });
  }

  await undoPublish(parsed.data.cardId, parsed.data.clusterId);
  await recordAdminAction({ action: "card_update", entityType: "card", entityId: parsed.data.cardId, detail: "unpublished" });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
