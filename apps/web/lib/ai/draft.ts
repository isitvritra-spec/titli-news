import { WORD_COUNT_TARGET } from "@repo/utils";
import { generateJson, isGeminiConfigured } from "./gemini";

export { isGeminiConfigured };

export type DraftFact = { claim: string; sourceHint: string };

export type AiDraft = {
  headline: string;
  body: string;
  deepDiveBody: string;
  facts: DraftFact[];
  topicSlugs: string[];
  distressLevel: "low" | "medium" | "high";
  editionRole:
    | "anchor"
    | "for_you"
    | "number"
    | "useful_now"
    | "beyond_metro"
    | "another_lens"
    | "lift";
};

const SYSTEM = [
  "You are a staff editor for Titli, a calm, women-first Indian news product.",
  "You write fresh, original cards — never a copy or light rewrite of the source's sentences.",
  "Voice: plain, warm, precise, non-sensational. Indian English. No hype, no clickbait, no moralising.",
  "You never invent facts. Every claim must be supported by the source text you are given.",
  "If the source does not support a confident card, say so in the body rather than guessing.",
].join(" ");

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    body: { type: "STRING" },
    deepDiveBody: { type: "STRING" },
    facts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          claim: { type: "STRING" },
          sourceHint: { type: "STRING" },
        },
        required: ["claim", "sourceHint"],
      },
    },
    topicSlugs: { type: "ARRAY", items: { type: "STRING" } },
    distressLevel: { type: "STRING", enum: ["low", "medium", "high"] },
    editionRole: {
      type: "STRING",
      enum: ["anchor", "for_you", "number", "useful_now", "beyond_metro", "another_lens", "lift"],
    },
  },
  required: ["headline", "body", "deepDiveBody", "facts", "topicSlugs", "distressLevel", "editionRole"],
};

export async function draftCardFromSource(input: {
  sourceTitle: string;
  sourceText: string;
  allowedTopicSlugs: string[];
}): Promise<AiDraft> {
  const prompt = [
    `Source headline: ${input.sourceTitle}`,
    "",
    "Source article text (for your understanding only — do not copy its wording):",
    input.sourceText,
    "",
    "Write a Titli card from this. Requirements:",
    `- headline: original, in your own words. It must NOT reuse the source headline's phrasing.`,
    `- body: about ${WORD_COUNT_TARGET} words, a single self-contained summary a reader understands on its own.`,
    "- deepDiveBody: a fuller 120+ word explanation with context, still fresh wording.",
    "- facts: each key claim in the card, with a short note on where in the source it came from, so an editor can verify it.",
    `- topicSlugs: choose from exactly these slugs, one or two that fit best: ${input.allowedTopicSlugs.join(", ")}.`,
    "- distressLevel: low, medium, or high — how heavy the subject is for a reader.",
    "- editionRole: the daily-arc slot this best fits.",
    "",
    "Do not copy any run of words from the source. Rewrite everything in Titli's voice.",
  ].join("\n");

  return generateJson<AiDraft>({
    system: SYSTEM,
    prompt,
    schema: RESPONSE_SCHEMA,
    temperature: 0.7,
  });
}
