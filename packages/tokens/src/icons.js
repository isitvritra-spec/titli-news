/**
 * Line-art icon path data shared between apps/mobile (react-native-svg) and
 * apps/web (plain DOM <svg>) — plain CommonJS, same reasoning as raw.js: one
 * place a literal path/viewBox is written, so the mark can't drift between
 * platforms. All paths render as thin single-weight line art (fill="none"
 * unless a caller opts into a filled/active state, round caps and joins)
 * per design-guide.md's "thin line icons only" rule — callers always apply
 * round caps/joins uniformly, so it isn't repeated per path here.
 */
module.exports = {
  /** The Titli mark, from the design export. */
  butterfly: {
    viewBox: "0 0 64 52",
    paths: [
      { d: "M32 16C20 6 6 8 8 20C9 28 22 28 32 26", strokeWidth: 1.6 },
      { d: "M32 16C44 6 58 8 56 20C55 28 42 28 32 26", strokeWidth: 1.6 },
      { d: "M32 27C22 26 10 34 14 42C17 47 27 44 32 34", strokeWidth: 1.6 },
      { d: "M32 27C42 26 54 34 50 42C47 47 37 44 32 34", strokeWidth: 1.6 },
      { d: "M32 13C31 20 33 30 32 39", strokeWidth: 1.6 },
      { d: "M31 14C28 9 25 7 22 6", strokeWidth: 1.4 },
      { d: "M33 14C36 9 39 7 42 6", strokeWidth: 1.4 },
    ],
  },
  /** The save/bookmark toggle — closed shape, fill it for the active state. */
  bookmark: {
    viewBox: "0 0 20 20",
    paths: [{ d: "M5.5 3.5A1 1 0 0 1 6.5 2.5h7A1 1 0 0 1 15.5 3.5V17L10 13.3 4.5 17V3.5Z", strokeWidth: 1.5 }],
  },
  /** The share button — an upload-into-tray glyph. */
  share: {
    viewBox: "0 0 20 20",
    paths: [
      { d: "M4 12v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3", strokeWidth: 1.5 },
      { d: "M7 6.5L10 3.5L13 6.5", strokeWidth: 1.5 },
      { d: "M10 4v9", strokeWidth: 1.5 },
    ],
  },
};
