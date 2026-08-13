export function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

export const WORD_COUNT_TARGET = 60;
export const WORD_COUNT_HARD_MIN = 30;
export const WORD_COUNT_HARD_MAX = 90;
export const WORD_COUNT_SOFT_MIN = 50;
export const WORD_COUNT_SOFT_MAX = 70;

export type WordCountStatus = "under" | "low" | "good" | "high" | "over";

export function wordCountStatus(count: number): WordCountStatus {
  if (count < WORD_COUNT_HARD_MIN) return "under";
  if (count < WORD_COUNT_SOFT_MIN) return "low";
  if (count <= WORD_COUNT_SOFT_MAX) return "good";
  if (count <= WORD_COUNT_HARD_MAX) return "high";
  return "over";
}
