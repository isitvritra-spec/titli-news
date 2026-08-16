/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // "class" (not the default "media") — required for Expo web: app.json's
  // userInterfaceStyle:"dark" makes RN call Appearance.setColorScheme() at
  // startup, which NativeWind only allows under the "class" strategy. The
  // app is dark-only regardless (no light-mode styles exist to toggle).
  darkMode: "class",
  presets: [require("nativewind/preset"), require("@repo/tokens/tailwind-preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
