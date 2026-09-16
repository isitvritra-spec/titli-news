import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { deleteCard, getCardForEdit, updateCard } from "../../../../../lib/db/adminQueries";
import { recordAdminAction } from "../../../../../lib/db/auditQueries";
import { cardInputSchema } from "../../../../../lib/validation";
import { deleteUploadedImage } from "../../../../../lib/images";

export async function GET(_request: Request, context: RouteContext<"/api/admin/cards/[id]">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const card = await getCardForEdit(id);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(card);
}

export async function PUT(request: Request, context: RouteContext<"/api/admin/cards/[id]">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  const parsed = cardInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  await updateCard(id, parsed.data);
  await recordAdminAction({
    action: parsed.data.status === "published" ? "card_publish" : "card_update",
    entityType: "card",
    entityId: id,
    detail: parsed.data.headline,
  });
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext<"/api/admin/cards/[id]">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const existing = await getCardForEdit(id);
  await deleteCard(id);
  if (existing) await deleteUploadedImage(existing.imagePath);

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
