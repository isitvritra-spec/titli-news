import { z } from "zod";
import { countWords, WORD_COUNT_HARD_MAX, WORD_COUNT_HARD_MIN } from "@repo/utils";

const readingSchema = z.object({ year: z.number().int(), value: z.number() });
const stateBreakdownSchema = z.object({
  state: z.string().min(1),
  value: z.number(),
  year: z.number().int().optional(),
});

export const cardInputSchema = z
  .object({
    cardType: z.enum(["news", "data"]),
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
    publishedAt: z.string().min(1),
    isContested: z.boolean(),
    contestedNote: z.string().optional(),
    deepDiveBody: z.string().optional(),
    topicIds: z.array(z.string()).min(1, "Pick at least one topic"),
    sourceId: z.string().optional(),
    sourceDate: z.string().optional(),
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
  });

export type CardInputParsed = z.infer<typeof cardInputSchema>;
