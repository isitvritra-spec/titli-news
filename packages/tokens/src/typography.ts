import raw from "./raw.js";

/**
 * Serif for headlines (Fraunces), neutral grotesk for body/UI (Inter).
 * Font *loading* is platform-specific (next/font on web, @expo-google-fonts
 * on mobile) — these are just the shared names/scale both platforms tune
 * their type against.
 */
export const fontFamily = raw.fontFamily as {
  headline: string;
  body: string;
};

export const fontSize = raw.fontSize as {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  "2xl": number;
  /** The reading-card headline size. */
  "3xl": number;
};

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  /** Generous, for the ~60-word card body — this is a reading product. */
  relaxed: 1.5,
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
