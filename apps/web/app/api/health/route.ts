import { topics } from "../../../lib/db/schema";
import { db } from "../../../lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.select({ id: topics.id }).from(topics).limit(1);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
