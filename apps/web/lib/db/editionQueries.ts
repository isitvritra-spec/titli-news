import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import type { EditionRole, TodayEdition } from "@repo/api-client";

import { db } from "./client";
import { cards, editionCards, editions } from "./schema";
import { hydrateCards } from "./queries";

export const EDITION_TIMEZONE = "Asia/Kolkata";

export type DistressLevel = "low" | "medium" | "high";

export type EditionSlotInput = {
  cardId: string;
  role: EditionRole;
  recommendationReason: string;
  isMandatory: boolean;
  editorialImportance: number;
  practicalUtility: number;
  distressLevel: DistressLevel;
};

export function editionDateInIndia(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EDITION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function sevenAmIndia(date: string): string {
  return new Date(`${date}T01:30:00.000Z`).toISOString();
}

export async function getPublishedEdition(date = editionDateInIndia()): Promise<TodayEdition | null> {
  const [edition] = await db
    .select()
    .from(editions)
    .where(and(eq(editions.editionDate, date), eq(editions.status, "published")))
    .limit(1);
  if (!edition?.publishedAt) return null;

  const links = await db
    .select()
    .from(editionCards)
    .where(eq(editionCards.editionId, edition.id))
    .orderBy(asc(editionCards.position));
  if (links.length === 0) return null;

  const rows = await db
    .select()
    .from(cards)
    .where(and(inArray(cards.id, links.map((link) => link.cardId)), eq(cards.status, "published")));
  const hydrated = await hydrateCards(rows);
  const cardById = new Map(hydrated.map((card) => [card.id, card]));

  return {
    id: edition.id,
    editionDate: edition.editionDate,
    timezone: edition.timezone,
    version: edition.version,
    publishedAt: edition.publishedAt,
    cards: links.flatMap((link) => {
      const card = cardById.get(link.cardId);
      return card
        ? [{
            card,
            position: link.position,
            role: link.role,
            recommendationReason: link.recommendationReason,
            isMandatory: link.isMandatory,
            editorialImportance: link.editorialImportance,
            practicalUtility: link.practicalUtility,
            distressLevel: link.distressLevel,
          }]
        : [];
    }),
  };
}

export async function getLatestPublishedEdition(): Promise<TodayEdition | null> {
  const [latest] = await db
    .select({ editionDate: editions.editionDate })
    .from(editions)
    .where(eq(editions.status, "published"))
    .orderBy(desc(editions.editionDate))
    .limit(1);

  return latest ? getPublishedEdition(latest.editionDate) : null;
}

export async function getEditionForAdmin(date = editionDateInIndia()) {
  const [edition] = await db
    .select()
    .from(editions)
    .where(eq(editions.editionDate, date))
    .limit(1);
  if (!edition) return null;

  const slots = await db
    .select()
    .from(editionCards)
    .where(eq(editionCards.editionId, edition.id))
    .orderBy(asc(editionCards.position));
  return { ...edition, slots };
}

export async function ensureEditionDraft(date = editionDateInIndia()) {
  const existing = await getEditionForAdmin(date);
  if (existing) return existing;

  await db.insert(editions).values({
    editionDate: date,
    timezone: EDITION_TIMEZONE,
    status: "draft",
    scheduledFor: sevenAmIndia(date),
    updatedAt: new Date().toISOString(),
  });
  return (await getEditionForAdmin(date))!;
}

export async function saveEditionDraft(
  date: string,
  slots: EditionSlotInput[],
  scheduledFor?: string
) {
  const now = new Date().toISOString();

  return db.transaction((tx) => {
    let [edition] = tx
      .select()
      .from(editions)
      .where(eq(editions.editionDate, date))
      .limit(1)
      .all();

    if (!edition) {
      [edition] = tx
        .insert(editions)
        .values({
          editionDate: date,
          timezone: EDITION_TIMEZONE,
          status: "draft",
          scheduledFor: scheduledFor ?? sevenAmIndia(date),
          updatedAt: now,
        })
        .returning()
        .all();
    } else {
      tx
        .update(editions)
        .set({
          status: "draft",
          scheduledFor: scheduledFor ?? edition.scheduledFor,
          updatedAt: now,
        })
        .where(eq(editions.id, edition.id))
        .run();
    }

    tx.delete(editionCards).where(eq(editionCards.editionId, edition.id)).run();
    if (slots.length > 0) {
      tx
        .insert(editionCards)
        .values(
          slots.map((slot, position) => ({
            editionId: edition.id,
            cardId: slot.cardId,
            position,
            role: slot.role,
            recommendationReason: slot.recommendationReason,
            isMandatory: slot.isMandatory,
            editorialImportance: slot.editorialImportance,
            practicalUtility: slot.practicalUtility,
            distressLevel: slot.distressLevel,
          }))
        )
        .run();
    }

    return edition.id;
  });
}

async function requireReadyEdition(date: string) {
  const edition = await getEditionForAdmin(date);
  if (!edition) throw new Error("Create the edition before publishing it.");
  if (edition.slots.length !== 7) throw new Error("A daily edition must contain exactly seven cards.");

  const selectedCards = await db
    .select({ id: cards.id, status: cards.status })
    .from(cards)
    .where(inArray(cards.id, edition.slots.map((slot) => slot.cardId)));
  if (selectedCards.length !== 7 || selectedCards.some((card) => card.status !== "published")) {
    throw new Error("Every edition card must be published before the edition can go live.");
  }

  return edition;
}

export async function scheduleEdition(date: string) {
  const edition = await requireReadyEdition(date);
  const updatedAt = new Date().toISOString();
  await db
    .update(editions)
    .set({ status: "scheduled", updatedAt })
    .where(eq(editions.id, edition.id));
  return { id: edition.id, scheduledFor: edition.scheduledFor };
}

export async function publishEdition(date: string): Promise<{ id: string; version: number }> {
  const edition = await requireReadyEdition(date);

  const nextVersion = edition.publishedAt ? edition.version + 1 : edition.version;
  const publishedAt = new Date().toISOString();
  await db
    .update(editions)
    .set({ status: "published", version: nextVersion, publishedAt, updatedAt: publishedAt })
    .where(eq(editions.id, edition.id));

  return { id: edition.id, version: nextVersion };
}

export async function publishDueEditions(now = new Date()) {
  const due = await db
    .select({ editionDate: editions.editionDate })
    .from(editions)
    .where(and(eq(editions.status, "scheduled"), lte(editions.scheduledFor, now.toISOString())));

  const published = [];
  for (const edition of due) published.push(await publishEdition(edition.editionDate));
  return published;
}
