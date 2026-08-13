import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import { getAllSources } from "../../../../lib/db/queries";
import { createSource } from "../../../../lib/db/adminQueries";

const sourceInputSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["news", "data"]),
  url: z.string().url(),
  publisher: z.string().optional(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getAllSources());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = sourceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }
  const id = await createSource(parsed.data);
  return NextResponse.json({ id }, { status: 201 });
}
