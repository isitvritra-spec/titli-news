import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { updateSourcePolicy } from "../../../../../lib/db/adminQueries";

/**
 * Licence policy only. Everything here decides what we are allowed to copy
 * from a publisher, so it is deliberately a separate endpoint from the
 * editorial fields in ../route.ts.
 */
const policySchema = z
  .object({
    imagePolicy: z.enum(["allow", "deny", "manual"]).optional(),
    allowsTextFetch: z.boolean().optional(),
    attributionRequired: z.boolean().optional(),
    licenceNote: z.string().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update" });

export async function PATCH(request: Request, context: RouteContext<"/api/admin/sources/[id]">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = policySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateSourcePolicy(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
