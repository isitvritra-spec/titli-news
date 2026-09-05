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
    bg: "#E2E5DE",
    /**
     * The signature oxblood. A rare brand moment (splash, section intros) —
     * NOT a general-purpose background. Reach for it only in the specific
     * components built for that moment, not as a everyday utility.
     */
    maroon: "#741F19",
    /** Cinnabar red: essential news, warnings, and corrections. */
    red: "#AA381E",
    /** Blackberry plum: personalized and reflective editorial moments. */
    plum: "#826D78",
    /** Smoked jade: data, verification, health, and calm progress. */
    jade: "#6D8177",
    /** Muted editorial fields used to distinguish the seven story roles. */
    lilac: "#D8CAE5",
    sky: "#BFD0E3",
    lime: "#DCE999",
    peach: "#EBC3AC",
    sage: "#BAC9BC",
    /** The one and only interactive accent — active states, links, trend arrows, the mark itself. */
    gold: "#AA381E",
    /** Headlines and body text on dark. */
    ink: "#111210",
    /** Source line, dates, captions. */
    muted: "#666B65",
    /** General-purpose raised surface — cards, sheets. */
    surface: "#F7F7F3",
    /** The one deeper/elevated screen background (the story-detail screen). */
    surface2: "#ECEEE8",
  },
  derived: {
    /** Bottom-of-image gradient so headline text stays legible over photos. */
    scrim: "rgba(17, 18, 16, 0.78)",
    /** Hairline dividers / card borders — ink-tinted at 10%. */
    hairline: "rgba(17, 18, 16, 0.1)",
    /** Pressed/active overlay on dark surfaces. */
    pressed: "rgba(170, 56, 30, 0.08)",
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
    sm: 8,
    md: 12,
    lg: 20,
    card: 24,
    full: 9999,
  },
  /**
   * These must be the *exact* registered font-family names RN's `useFonts`
   * ends up with (it registers each font under its literal object key, e.g.
   * "Mukta_600SemiBold" — never a bare "Mukta"). A bare
   * family name here silently falls back to the system font instead of
   * erroring, which is what happened with the previous Fraunces/Inter
   * values — keep this in sync with apps/mobile/app/_layout.tsx's useFonts()
   * call whenever either changes.
   */
  fontFamily: {
    /** Mukta 700 — headlines, the data statistic, and card titles. */
    headline: "Mukta_700Bold",
    /** Mukta 400 — body copy, the ~60-word card text, and captions. */
    body: "Mukta_400Regular",
    /** Mukta 600 — topic-row labels, buttons, and tab-bar labels. */
    label: "Mukta_600SemiBold",
  },
  /**
   * Named for what the text *is*, not a generic t-shirt scale — matches
   * design-guide.md's own vocabulary so a role maps to exactly one size.
   */
  fontSize: {
    /** The big stat number on a data card, tabular-nums, weight 600. */
    hero: 36,
    /** Card headline / detail headline / section h1, weight 600. */
    title: 25,
    /** Body copy, weight 400. */
    body: 16,
    /** Topic-row labels, buttons, tab-bar labels, weight 500. */
    label: 13,
    /** Source, date, "as of", footer text, weight 400. */
    caption: 12,
  },
};
