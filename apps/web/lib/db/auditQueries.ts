import { desc } from "drizzle-orm";

import { db } from "./client";
import { adminActions } from "./schema";

/** The single editor today; the seam for real accounts later. */
export const CURRENT_ACTOR = "editor";

export type AdminActionInput = {
  action: "card_draft" | "card_publish" | "card_update" | "cluster_dismiss" | "edition_publish";
  entityType: "card" | "cluster" | "edition";
  entityId: string;
  detail?: string;
  actor?: string;
};

/** Best-effort audit write — a logging failure must never break the action it records. */
export async function recordAdminAction(input: AdminActionInput): Promise<void> {
  try {
    await db.insert(adminActions).values({
      actor: input.actor ?? CURRENT_ACTOR,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      detail: input.detail ?? null,
    });
  } catch {
    // Deliberately swallowed — the log is a record, not a gate.
  }
}

export async function listAdminActions(limit = 100) {
  return db.select().from(adminActions).orderBy(desc(adminActions.createdAt)).limit(limit);
}
