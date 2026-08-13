import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import { listCardsForAdmin, createCard } from "../../../../lib/db/adminQueries";
import { markCandidateDrafted } from "../../../../lib/db/inboxQueries";
import { cardInputSchema } from "../../../../lib/validation";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cards = await listCardsForAdmin();
  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = cardInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const id = await createCard(parsed.data);

  const fromCandidate = request.nextUrl.searchParams.get("fromCandidate");
  if (fromCandidate) {
    await markCandidateDrafted(fromCandidate, id);
  }

  // Everything shares the root layout, so this invalidates every cached
  // page in one call — simple and correct for a low-traffic self-hosted
  // site with cheap local DB reads; no need to chase individual slugs.
  revalidatePath("/", "layout");

  return NextResponse.json({ id }, { status: 201 });
}
