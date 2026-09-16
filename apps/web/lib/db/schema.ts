import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
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

  /**
   * Whether we may re-host this publisher's imagery. Defaults to "deny" for
   * every source until someone has actually read that source's licence —
   * re-hosting a wire photo (PTI/Reuters/AP) is the single largest legal
   * exposure in the product, so the safe value is the default value.
   * "manual" means an editor may attach an image by hand but nothing is
   * downloaded automatically.
   */
  imagePolicy: text("image_policy", { enum: ["allow", "deny", "manual"] })
    .notNull()
    .default("deny"),
  /** Gates fetching the article body for AI drafting (robots.txt / ToS). */
  allowsTextFetch: integer("allows_text_fetch", { mode: "boolean" })
    .notNull()
    .default(false),
  licenceNote: text("licence_note"),
  attributionRequired: integer("attribution_required", { mode: "boolean" })
    .notNull()
    .default(true),
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

export const editions = sqliteTable("editions", {
  id: id(),
  editionDate: text("edition_date").notNull().unique(),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  status: text("status", { enum: ["draft", "scheduled", "published", "archived"] })
    .notNull()
    .default("draft"),
  version: integer("version").notNull().default(1),
  scheduledFor: text("scheduled_for"),
  publishedAt: text("published_at"),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
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

  /**
   * Where this image came from. "unknown" is the backfill value for cards
   * that predate provenance tracking — scripts/audit-image-provenance.ts
   * lists those so they can be re-imaged rather than silently trusted.
   */
  imageOrigin: text("image_origin", {
    enum: ["licensed_stock", "source_permitted", "own_upload", "generated", "unknown"],
  })
    .notNull()
    .default("unknown"),
  imageCredit: text("image_credit"),
  imageLicence: text("image_licence"),
  imageSourceUrl: text("image_source_url"),

  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("published"),
  primaryTopicId: text("primary_topic_id").references(() => topics.id),
  publishedAt: text("published_at").notNull(),
  reviewedAt: text("reviewed_at"),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
  isContested: integer("is_contested", { mode: "boolean" }).notNull().default(false),
  contestedNote: text("contested_note"),
  correctionNote: text("correction_note"),
  correctedAt: text("corrected_at"),
  deepDiveBody: text("deep_dive_body"),

  /** True when the draft was machine-written; gates publishing until an editor confirms review. */
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  aiReviewed: integer("ai_reviewed", { mode: "boolean" }).notNull().default(false),
  /** Longest verbatim word-run shared with the source at draft time, and the offending fragments (JSON). Never the article itself. */
  originalityMaxRun: integer("originality_max_run"),
  originalitySpans: text("originality_spans"),

  /** Authorship, for a future multi-editor setup — a constant "editor" today. */
  createdBy: text("created_by"),
  approvedBy: text("approved_by"),

  // News-only
  sourceId: text("source_id").references(() => sources.id),
  sourceDate: text("source_date"),
  /** The source's own headline, kept only to block publishing a verbatim copy of it. Never rendered. */
  sourceHeadline: text("source_headline"),

  // Data-only
  metricValue: real("metric_value"),
  metricUnit: text("metric_unit"),
  surveySourceId: text("survey_source_id").references(() => sources.id),
  methodologyNote: text("methodology_note"),

  ...timestamps,
});

export const editionCards = sqliteTable(
  "edition_cards",
  {
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    role: text("role", {
      enum: [
        "anchor",
        "for_you",
        "number",
        "useful_now",
        "beyond_metro",
        "another_lens",
        "lift",
      ],
    }).notNull(),
    recommendationReason: text("recommendation_reason").notNull(),
    isMandatory: integer("is_mandatory", { mode: "boolean" }).notNull().default(false),
    editorialImportance: integer("editorial_importance").notNull().default(50),
    practicalUtility: integer("practical_utility").notNull().default(50),
    distressLevel: text("distress_level", { enum: ["low", "medium", "high"] })
      .notNull()
      .default("low"),
  },
  (table) => [
    primaryKey({ columns: [table.editionId, table.cardId] }),
    uniqueIndex("edition_cards_position_idx").on(table.editionId, table.position),
  ]
);

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
/**
 * A group of feed candidates that all cover the same underlying story, so the
 * editor triages one story rather than the same event six times. Built by the
 * deterministic pass in lib/clustering.ts during the morning refresh; the
 * canonical item is the most authoritative outlet in the group.
 */
export const storyClusters = sqliteTable("story_clusters", {
  id: id(),
  canonicalTitle: text("canonical_title").notNull(),
  /** The representative candidate (highest trust tier). Plain text, not a FK, to avoid a cycle with feed_candidates.cluster_id. */
  canonicalCandidateId: text("canonical_candidate_id"),
  topicGuess: text("topic_guess"),
  relevanceScore: real("relevance_score"),
  outletCount: integer("outlet_count").notNull().default(1),
  status: text("status", { enum: ["new", "shortlisted", "dismissed"] })
    .notNull()
    .default("new"),
  firstSeenAt: text("first_seen_at").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
  ...timestamps,
});

export const feedCandidates = sqliteTable(
  "feed_candidates",
  {
  id: id(),
  sourceName: text("source_name").notNull(),
  sourceSiteUrl: text("source_site_url").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull().unique(),
  imageUrl: text("image_url"),
  pubDate: text("pub_date"),
  fetchedAt: text("fetched_at").notNull().default(sql`(current_timestamp)`),

  /**
   * Triage state. Supersedes the legacy `dismissed` / `draftedCardId` pair for
   * filtering (those two columns are kept in sync so nothing that still reads
   * them breaks). "auto_rejected" is set by the relevance prefilter.
   */
  status: text("status", {
    enum: ["new", "shortlisted", "drafted", "dismissed", "auto_rejected"],
  })
    .notNull()
    .default("new"),
  clusterId: text("cluster_id").references(() => storyClusters.id, { onDelete: "set null" }),
  relevanceScore: real("relevance_score"),

  dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),

  // Populated on-demand when the editor clicks "Draft from this" — the
  // remote imageUrl downloaded and run through the same sharp pipeline as
  // a manual upload (see lib/images.ts).
  draftImagePath: text("draft_image_path"),
  draftImageAlt: text("draft_image_alt"),
  draftImageWidth: integer("draft_image_width"),
  draftImageHeight: integer("draft_image_height"),
  draftImageBlurDataUrl: text("draft_image_blur_data_url"),
  /** Which branch of prepareDraft() produced the draft image, carried through to the card. */
  draftImageOrigin: text("draft_image_origin", {
    enum: ["source_permitted", "generated"],
  }),
  draftImageCredit: text("draft_image_credit"),

  draftedCardId: text("drafted_card_id").references(() => cards.id, { onDelete: "set null" }),
  },
  (table) => [
    index("feed_candidates_status_idx").on(table.status),
    index("feed_candidates_cluster_idx").on(table.clusterId),
  ]
);

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

/**
 * An append-only log of consequential editor actions (draft, publish, dismiss).
 * Single-admin today, so `actor` is a constant; the column exists so attributing
 * actions to real accounts later is additive rather than a migration of intent.
 */
export const adminActions = sqliteTable(
  "admin_actions",
  {
    id: id(),
    actor: text("actor").notNull().default("editor"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    detail: text("detail"),
    ...timestamps,
  },
  (table) => [index("admin_actions_created_idx").on(table.createdAt)],
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: id(),
    installationId: text("installation_id").notNull(),
    sessionId: text("session_id").notNull(),
    eventType: text("event_type", {
      enum: [
        "app_open",
        "edition_start",
        "edition_complete",
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
        "why_this_open",
        "less_like_this",
      ],
    }).notNull(),
    editionId: text("edition_id").references(() => editions.id, { onDelete: "set null" }),
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
    index("analytics_events_edition_idx").on(table.editionId, table.eventType),
  ]
);
