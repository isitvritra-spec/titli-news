/**
 * The literal source of truth for every design-token value. Plain CommonJS,
 * on purpose: this file is `require()`d directly by apps/mobile's NativeWind
 * config, which runs in a raw Node context outside the app bundler and
 * can't be trusted to transpile a cross-workspace TypeScript import. Every
 * other token file (colors.ts, spacing.ts, typography.ts) re-exports from
 * this file instead of duplicating values, so this stays the only place a
 * hex/px number is literally written for TS/JS consumers.
 *
 * apps/web can't consume this file directly (Tailwind v4's CSS `@theme`
 * block wants literal CSS, not a JS import) — its `@theme` block in
 * globals.css mirrors these same values by hand. Keep the two in sync;
 * there is no build step that enforces it.
 *
 * Token names are deliberately single words (bg, maroon, gold, ink, muted)
 * rather than camelCase (e.g. `textPrimary`) — Tailwind v4's CSS `@theme`
 * keys and NativeWind's JS config produce utility classes with different
 * casing conventions for multi-word keys, so single words are the only way
 * `bg-gold` / `text-ink` mean the same thing, spelled the same way, on both
 * platforms.
 */
module.exports = {
  colors: {
    /** App background and the reading surface — a warm near-black. */
    bg: "#100A0C",
    /**
     * The signature oxblood. A rare brand moment (splash, section intros) —
     * NOT a general-purpose background. Reach for it only in the specific
     * components built for that moment, not as a everyday utility.
     */
    maroon: "#5A181A",
    /** The one and only interactive accent — active states, links, trend arrows, the mark itself. */
    gold: "#E4A069",
    /** Headlines and body text on dark. */
    ink: "#F4EEE6",
    /** Source line, dates, captions. */
    muted: "#A99A92",
  },
  derived: {
    /** Bottom-of-image gradient so headline text stays legible over photos. */
    scrim: "rgba(16, 10, 12, 0.92)",
    /** Hairline dividers / card borders. */
    hairline: "rgba(169, 154, 146, 0.16)",
    /** Pressed/active overlay on dark surfaces. */
    pressed: "rgba(244, 238, 230, 0.06)",
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    card: 24,
    full: 9999,
  },
  fontFamily: {
    headline: "Fraunces",
    body: "Inter",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    "2xl": 28,
    "3xl": 34,
  },
};
