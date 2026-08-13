import raw from "./raw.js";

/**
 * The five brand roles, and nothing else — re-exported (typed) from raw.js,
 * which is the actual literal source of truth. If a color isn't derived
 * from there, it shouldn't exist in the product.
 *
 * `maroon` (the oxblood) is a rare brand moment (splash, section intros) —
 * NOT a general-purpose background. Don't wire it into shared utility
 * classes that are easy to reach for; wire it only into the specific
 * components built for that moment.
 *
 * `gold` is the one and only interactive accent — active states, links,
 * trend arrows, the mark itself.
 */
export const colors = raw.colors as {
  bg: string;
  maroon: string;
  gold: string;
  ink: string;
  muted: string;
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
