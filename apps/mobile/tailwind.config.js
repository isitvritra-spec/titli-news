/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset"), require("@repo/tokens/tailwind-preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
