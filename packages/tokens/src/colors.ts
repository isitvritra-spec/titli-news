import raw from "./raw.js";

/**
 * Two families of roles, re-exported (typed) from raw.js, which is the
 * actual literal source of truth. If a color isn't derived from there, it
 * shouldn't exist in the product.
 *
 * Brand roles — `bg`, `maroon`, `gold`, `ink`, `muted`:
 * `maroon` (the oxblood) is a rare brand moment (splash, section intros) —
 * NOT a general-purpose background. Don't wire it into shared utility
 * classes that are easy to reach for; wire it only into the specific
 * components built for that moment.
 *
 * `gold` is the one and only interactive accent — active states, links,
 * trend arrows, the mark itself.
 *
 * Raised-surface roles — `surface`, `surface2`:
 * `surface` is a general raised background (cards, sheets). `surface2` is
 * reserved for the one deeper/elevated screen (the story-detail screen) —
 * don't reach for it as a general "slightly lighter than bg" utility.
 */
export const colors = raw.colors as {
  bg: string;
  maroon: string;
  gold: string;
  ink: string;
  muted: string;
  surface: string;
  surface2: string;
};

/**
 * Values derived from the brand roles via opacity, for functional needs
 * (image scrims, hairline dividers) that aren't new colors in their own right.
 */
export const derived = raw.derived as {
  scrim: string;
  hairline: string;
  pressed: string;
};

export type ColorRole = keyof typeof colors;
