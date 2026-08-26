import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";
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
  trustTier: text("trust_tier", { enum: ["primary", "trusted", "discovery"] })
    .notNull()
    .default("trusted"),
  sourceType: text("source_type", {
    enum: ["official", "specialist", "mainstream", "data", "aggregator"],
  })
    .notNull()
    .default("mainstream"),
  feedUrl: text("feed_url"),
  ingestMethod: text("ingest_method", { enum: ["rss", "api", "manual"] })
    .notNull()
    .default("manual"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  editorialNotes: text("editorial_notes"),
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

  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("published"),
  primaryTopicId: text("primary_topic_id").references(() => topics.id),
  publishedAt: text("published_at").notNull(),
  reviewedAt: text("reviewed_at"),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
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

export const pulseMetrics = sqliteTable("pulse_metrics", {
  key: text("key").primaryKey(),
  kind: text("kind", { enum: ["safety", "progress"] }).notNull(),
  label: text("label").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  periodLabel: text("period_label").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  methodology: text("methodology").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: id(),
    installationId: text("installation_id").notNull(),
    sessionId: text("session_id").notNull(),
    eventType: text("event_type", {
      enum: [
        "app_open",
        "card_view",
        "card_dwell",
        "card_detail_open",
        "card_save",
        "card_unsave",
        "card_share",
        "source_open",
        "genre_follow",
        "genre_unfollow",
        "pulse_open",
      ],
    }).notNull(),
    cardId: text("card_id").references(() => cards.id, { onDelete: "set null" }),
    primaryTopicId: text("primary_topic_id").references(() => topics.id, { onDelete: "set null" }),
    topicSlug: text("topic_slug"),
    durationMs: integer("duration_ms"),
    position: integer("position"),
    occurredAt: text("occurred_at").notNull(),
    receivedAt: text("received_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [
    index("analytics_events_occurred_at_idx").on(table.occurredAt),
    index("analytics_events_topic_type_idx").on(table.primaryTopicId, table.eventType),
    index("analytics_events_card_idx").on(table.cardId),
  ]
);
