import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "../../../../../../lib/adminAuth";
import { publishEdition } from "../../../../../../lib/db/editionQueries";

export async function POST(_request: Request, context: RouteContext<"/api/admin/editions/[date]/publish">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await context.params;
  try {
    const published = await publishEdition(date);
    revalidatePath("/", "layout");
    return NextResponse.json({ ...published, status: "published" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish edition" },
      { status: 400 }
    );
  }
}
