import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { saveEditionDraft } from "../../../../../lib/db/editionQueries";
import { editionInputSchema } from "../../../../../lib/validation";

export async function PUT(request: Request, context: RouteContext<"/api/admin/editions/[date]">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await context.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid edition date" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = editionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const id = await saveEditionDraft(date, parsed.data.slots, parsed.data.scheduledFor);
  revalidatePath("/admin/editions");
  return NextResponse.json({ id, status: "draft" });
}
