import raw from "./raw.js";

/**
 * Anek Devanagari for headlines/labels, Mukta for body/UI — both cover
 * Devanagari *and* Latin script in one family, chosen because the content
 * is Indian-language-capable. `label` is a distinct family key (not just a
 * smaller headline size) because RN can't pick a weight variant out of one
 * family the way CSS `font-weight` can — see raw.js's fontFamily comment.
 * Font *loading* is platform-specific (next/font on web, @expo-google-fonts
 * on mobile) — these are just the shared names/scale both platforms tune
 * their type against.
 */
export const fontFamily = raw.fontFamily as {
  headline: string;
  body: string;
  label: string;
};

/** Named for what the text is, not a generic t-shirt scale — see raw.js. */
export const fontSize = raw.fontSize as {
  hero: number;
  title: number;
  body: number;
  label: number;
  caption: number;
};

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  /** The ~60-word card body / longer reading — this is a reading product. */
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  normal: "0em",
  /** Tight tracking on the all-caps source/footer line — a "wire service" feel. */
  wide: "0.06em",
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;
