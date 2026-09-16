import { z } from "zod";
import { countWords, WORD_COUNT_HARD_MAX, WORD_COUNT_HARD_MIN } from "@repo/utils";
import {
  ORIGINALITY_MIN_RUN,
  normalizedHeadlinesMatch,
  remainingSpans,
} from "./originality";

const readingSchema = z.object({ year: z.number().int(), value: z.number() });
const stateBreakdownSchema = z.object({
  state: z.string().min(1),
  value: z.number(),
  year: z.number().int().optional(),
});

export const cardInputSchema = z
  .object({
    cardType: z.enum(["news", "data"]),
    status: z.enum(["draft", "published", "archived"]),
    headline: z.string().min(1, "Headline is required"),
    slug: z
      .string()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    body: z.string().min(1, "Body is required"),
    imagePath: z.string().min(1, "Image is required"),
    imageAlt: z.string().min(1, "Alt text is required"),
    imageWidth: z.number().int().positive(),
    imageHeight: z.number().int().positive(),
    imageBlurDataUrl: z.string().min(1),
    imageOrigin: z.enum([
      "licensed_stock",
      "source_permitted",
      "own_upload",
      "generated",
      "unknown",
    ]),
    imageCredit: z.string().optional(),
    imageLicence: z.string().optional(),
    imageSourceUrl: z.string().optional(),
    sourceHeadline: z.string().optional(),
    publishedAt: z.string().min(1),
    isContested: z.boolean(),
    contestedNote: z.string().optional(),
    correctionNote: z.string().max(500).optional(),
    correctedAt: z.iso.datetime().optional(),
    deepDiveBody: z.string().optional(),
    topicIds: z.array(z.string()).min(1, "Pick at least one topic"),
    primaryTopicId: z.string().min(1, "Pick a primary genre"),
    sourceId: z.string().optional(),
    sourceDate: z.string().optional(),
    aiGenerated: z.boolean().optional(),
    aiReviewed: z.boolean().optional(),
    originalityMaxRun: z.number().int().optional(),
    originalitySpans: z.array(z.string()).optional(),
    metricValue: z.number().optional(),
    metricUnit: z.string().optional(),
    surveySourceId: z.string().optional(),
    methodologyNote: z.string().optional(),
    readings: z.array(readingSchema).optional(),
    stateBreakdown: z.array(stateBreakdownSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const wordCount = countWords(data.body);
    if (wordCount < WORD_COUNT_HARD_MIN || wordCount > WORD_COUNT_HARD_MAX) {
      ctx.addIssue({
        code: "custom",
        message: `Body should be around 60 words (currently ${wordCount})`,
        path: ["body"],
      });
    }

    if (data.cardType === "news") {
      if (!data.sourceId) {
        ctx.addIssue({ code: "custom", message: "Source is required for news cards", path: ["sourceId"] });
      }
      if (!data.sourceDate) {
        ctx.addIssue({ code: "custom", message: "Source date is required for news cards", path: ["sourceDate"] });
      }
      if (data.status === "published" && countWords(data.deepDiveBody ?? "") < 120) {
        ctx.addIssue({
          code: "custom",
          message: "Published news needs a full story of at least 120 words",
          path: ["deepDiveBody"],
        });
      }
    }

    // A re-hosted publisher photo must carry its credit — that is the whole
    // point of allowing the source in the first place.
    if (data.imageOrigin === "source_permitted" && !data.imageCredit) {
      ctx.addIssue({
        code: "custom",
        message: "A re-hosted source image needs a credit line",
        path: ["imageCredit"],
      });
    }

    // "unknown" is the backfill value for cards that predate provenance
    // tracking; nothing new should publish without a real answer.
    if (data.status === "published" && data.imageOrigin === "unknown") {
      ctx.addIssue({
        code: "custom",
        message: "Set where this image came from before publishing",
        path: ["imageOrigin"],
      });
    }

    // Originality gates — only at publish, and enforced here (server-side) so
    // the UI cannot be the only thing standing between a copy and readers.
    if (data.status === "published") {
      // A machine-written draft must be actively confirmed by an editor.
      if (data.aiGenerated && !data.aiReviewed) {
        ctx.addIssue({
          code: "custom",
          message: "Confirm you have reviewed and rewritten this AI draft before publishing",
          path: ["aiReviewed"],
        });
      }

      // The headline must not be the source's headline verbatim.
      if (data.sourceHeadline && normalizedHeadlinesMatch(data.headline, data.sourceHeadline)) {
        ctx.addIssue({
          code: "custom",
          message: "Rewrite the headline in your own words — it still matches the source",
          path: ["headline"],
        });
      }

      // The body must not still contain a verbatim run of the source's wording.
      const stillCopied = remainingSpans(data.body, data.originalitySpans ?? []);
      if (stillCopied.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: `Rewrite the copied wording — the body still shares a ${ORIGINALITY_MIN_RUN}+ word run with the source: “${stillCopied[0]}”`,
          path: ["body"],
        });
      }
    }

    if (!data.topicIds.includes(data.primaryTopicId)) {
      ctx.addIssue({
        code: "custom",
        message: "The primary genre must also be selected as a topic",
        path: ["primaryTopicId"],
      });
    }

    if (data.cardType === "data") {
      if (!data.surveySourceId) {
        ctx.addIssue({
          code: "custom",
          message: "Survey source is required for data cards",
          path: ["surveySourceId"],
        });
      }
      if (!data.readings || data.readings.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one reading is required for data cards",
          path: ["readings"],
        });
      }
    }

    if (data.isContested && !data.contestedNote) {
      ctx.addIssue({
        code: "custom",
        message: "Add a contested note — state what happened, flag the fight, don't settle it",
        path: ["contestedNote"],
      });
    }

    if (Boolean(data.correctionNote) !== Boolean(data.correctedAt)) {
      ctx.addIssue({
        code: "custom",
        message: "A correction needs both a note and timestamp",
        path: data.correctionNote ? ["correctedAt"] : ["correctionNote"],
      });
    }
  });

export type CardInputParsed = z.infer<typeof cardInputSchema>;

const editionRoleSchema = z.enum([
  "anchor",
  "for_you",
  "number",
  "useful_now",
  "beyond_metro",
  "another_lens",
  "lift",
]);

const editionSlotSchema = z.object({
  cardId: z.string().min(1),
  role: editionRoleSchema,
  recommendationReason: z.string().min(1).max(160),
  isMandatory: z.boolean(),
  editorialImportance: z.number().int().min(0).max(100),
  practicalUtility: z.number().int().min(0).max(100),
  distressLevel: z.enum(["low", "medium", "high"]),
});

export const editionInputSchema = z
  .object({
    slots: z.array(editionSlotSchema).length(7, "Choose exactly seven cards"),
    scheduledFor: z.iso.datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (new Set(data.slots.map((slot) => slot.cardId)).size !== data.slots.length) {
      ctx.addIssue({ code: "custom", message: "Each card can appear only once", path: ["slots"] });
    }
    if (new Set(data.slots.map((slot) => slot.role)).size !== data.slots.length) {
      ctx.addIssue({ code: "custom", message: "Every edition role must appear once", path: ["slots"] });
    }
  });
