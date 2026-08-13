import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
};

export const sources = sqliteTable("sources", {
  id: id(),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["news", "data"] }).notNull(),
  url: text("url").notNull(),
  publisher: text("publisher"),
  ...timestamps,
});

export const topics = sqliteTable("topics", {
  id: id(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const cards = sqliteTable("cards", {
  id: id(),
  cardType: text("card_type", { enum: ["news", "data"] }).notNull(),
  headline: text("headline").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(),

  imagePath: text("image_path").notNull(),
  imageAlt: text("image_alt").notNull(),
  imageWidth: integer("image_width").notNull(),
  imageHeight: integer("image_height").notNull(),
  imageBlurDataUrl: text("image_blur_data_url").notNull(),

  publishedAt: text("published_at").notNull(),
  isContested: integer("is_contested", { mode: "boolean" }).notNull().default(false),
  contestedNote: text("contested_note"),
  deepDiveBody: text("deep_dive_body"),

  // News-only
  sourceId: text("source_id").references(() => sources.id),
  sourceDate: text("source_date"),

  // Data-only
  metricValue: real("metric_value"),
  metricUnit: text("metric_unit"),
  surveySourceId: text("survey_source_id").references(() => sources.id),
  methodologyNote: text("methodology_note"),

  ...timestamps,
});

export const cardTopics = sqliteTable(
  "card_topics",
  {
    cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
    topicId: text("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.topicId] })]
);

export const cardReadings = sqliteTable("card_readings", {
  id: id(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  value: real("value").notNull(),
});

export const cardStateBreakdown = sqliteTable("card_state_breakdown", {
  id: id(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  state: text("state").notNull(),
  value: real("value").notNull(),
  year: integer("year"),
});

/**
 * Raw RSS items pulled from the sources in lib/rss.ts, reviewed by the
 * editor in /admin/inbox before (maybe) becoming a card. Never shown to
 * readers directly — the editor still writes the card body fresh (see
 * lib/rss.ts's header comment for why this stays an inbox, not an
 * auto-publish pipeline).
 */
export const feedCandidates = sqliteTable("feed_candidates", {
  id: id(),
  sourceName: text("source_name").notNull(),
  sourceSiteUrl: text("source_site_url").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull().unique(),
  imageUrl: text("image_url"),
  pubDate: text("pub_date"),
  fetchedAt: text("fetched_at").notNull().default(sql`(current_timestamp)`),
  dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),

  // Populated on-demand when the editor clicks "Draft from this" — the
  // remote imageUrl downloaded and run through the same sharp pipeline as
  // a manual upload (see lib/images.ts).
  draftImagePath: text("draft_image_path"),
  draftImageAlt: text("draft_image_alt"),
  draftImageWidth: integer("draft_image_width"),
  draftImageHeight: integer("draft_image_height"),
  draftImageBlurDataUrl: text("draft_image_blur_data_url"),

  draftedCardId: text("drafted_card_id").references(() => cards.id, { onDelete: "set null" }),
});
