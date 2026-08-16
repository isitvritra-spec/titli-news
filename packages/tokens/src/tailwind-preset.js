const raw = require("./raw.js");

/**
 * Consumed by apps/mobile's NativeWind config only (web uses Tailwind v4's
 * native CSS `@theme` block instead — see raw.js's header comment for why).
 * Plain CJS, `require()`d directly, no bundler in the loop.
 */
const spacingPx = Object.fromEntries(
  Object.entries(raw.spacing).map(([key, value]) => [key, `${value}px`])
);

const fontSizePx = Object.fromEntries(
  Object.entries(raw.fontSize).map(([key, value]) => [key, `${value}px`])
);

module.exports = {
  theme: {
    extend: {
      colors: {
        bg: raw.colors.bg,
        maroon: raw.colors.maroon,
        gold: raw.colors.gold,
        ink: raw.colors.ink,
        muted: raw.colors.muted,
        surface: raw.colors.surface,
        surface2: raw.colors.surface2,
        scrim: raw.derived.scrim,
        hairline: raw.derived.hairline,
        pressed: raw.derived.pressed,
      },
      fontFamily: {
        headline: [raw.fontFamily.headline],
        body: [raw.fontFamily.body],
        label: [raw.fontFamily.label],
      },
      fontSize: fontSizePx,
      spacing: spacingPx,
      borderRadius: {
        sm: `${raw.radius.sm}px`,
        md: `${raw.radius.md}px`,
        lg: `${raw.radius.lg}px`,
        card: `${raw.radius.card}px`,
        full: `${raw.radius.full}px`,
      },
    },
  },
};
