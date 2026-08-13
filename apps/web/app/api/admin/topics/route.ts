import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import { getTopics } from "../../../../lib/db/queries";
import { createTopic } from "../../../../lib/db/adminQueries";

const topicInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getTopics());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = topicInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }
  const id = await createTopic(parsed.data);
  return NextResponse.json({ id }, { status: 201 });
}
