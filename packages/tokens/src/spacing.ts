import raw from "./raw.js";

export const spacing = raw.spacing as Record<
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24,
  number
>;

export const radius = raw.radius as {
  sm: number;
  md: number;
  lg: number;
  /** The reading card's own corner radius on web (mobile cards go edge-to-edge). */
  card: number;
  full: number;
};
