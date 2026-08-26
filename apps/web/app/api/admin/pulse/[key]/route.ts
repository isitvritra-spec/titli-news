import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { updatePulseMetric } from "../../../../../lib/db/adminQueries";

const pulseInputSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.number().nonnegative(),
  unit: z.string().min(1).max(120),
  periodLabel: z.string().min(1).max(120),
  sourceName: z.string().min(1).max(160),
  sourceUrl: z.string().url(),
  methodology: z.string().min(1).max(2000),
  isActive: z.boolean(),
});

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/pulse/[key]">
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = pulseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const { key } = await context.params;
  await updatePulseMetric(key, parsed.data);
  return NextResponse.json({ ok: true });
}
