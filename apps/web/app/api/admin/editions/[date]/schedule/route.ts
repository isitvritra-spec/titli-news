import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "../../../../../../lib/adminAuth";
import { scheduleEdition } from "../../../../../../lib/db/editionQueries";

export async function POST(_request: Request, context: RouteContext<"/api/admin/editions/[date]/schedule">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await context.params;
  try {
    const scheduled = await scheduleEdition(date);
    revalidatePath("/admin/editions");
    return NextResponse.json({ ...scheduled, status: "scheduled" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not schedule edition" },
      { status: 400 }
    );
  }
}
