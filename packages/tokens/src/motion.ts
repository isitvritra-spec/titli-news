/**
 * Shared spring/duration values so the mobile card-transition feel
 * (Reanimated) and web transitions (CSS) are tuned from the same intent,
 * even though they're implemented on different engines.
 */
export const motion = {
  spring: {
    /** The card-snap spring: quick settle, minimal overshoot. */
    card: { damping: 26, stiffness: 260, mass: 0.9 },
    /** Softer spring for modals / detail sheets. */
    sheet: { damping: 30, stiffness: 220, mass: 1 },
  },
  duration: {
    fast: 150,
    base: 250,
    slow: 400,
    /** The splash oxblood-glow moment. */
    splash: 900,
  },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  },
} as const;
