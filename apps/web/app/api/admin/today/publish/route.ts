import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { publishStoryFromCluster } from "../../../../../lib/db/moderationQueries";
import { recordAdminAction } from "../../../../../lib/db/auditQueries";

const bodySchema = z.object({
  clusterId: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  deepDive: z.string().optional(),
  aiGenerated: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing story details" }, { status: 400 });
  }

  try {
    const result = await publishStoryFromCluster(parsed.data);
    await recordAdminAction({
      action: "card_publish",
      entityType: "card",
      entityId: result.cardId,
      detail: parsed.data.headline,
    });
    revalidatePath("/", "layout");
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish this story" },
      { status: 400 },
    );
  }
}
