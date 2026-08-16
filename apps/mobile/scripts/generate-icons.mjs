#!/usr/bin/env node
/**
 * One-off (re-runnable) generator for the app's static icon/splash/favicon
 * PNGs, rasterized from the real butterfly mark — the same path data
 * ButterflyMark.tsx renders (@repo/tokens/icons, shared with apps/web too)
 * and the same brand colors the app uses (@repo/tokens/raw). Re-run
 * whenever the mark or brand colors change:
 *
 *   node scripts/generate-icons.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import icons from "@repo/tokens/icons";
import raw from "@repo/tokens/raw";

const butterfly = icons.butterfly;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "assets");

const BG = raw.colors.bg;
const GOLD = raw.colors.gold;

/**
 * Builds a square SVG with the mark centered, scaled so its longer edge
 * fills `markFraction` of the canvas. SVG's `scale()` transform scales
 * stroke-width along with geometry, so line thickness stays proportional
 * to icon size at every output size — the same relationship the mark has
 * in the design export (a 64x52 viewBox drawn thin at any display size).
 */
function buildSvg({ canvas, markFraction, strokeColor, bgColor }) {
  const [, , vbW, vbH] = butterfly.viewBox.split(" ").map(Number);
  const scale = (canvas * markFraction) / Math.max(vbW, vbH);
  const tx = (canvas - vbW * scale) / 2;
  const ty = (canvas - vbH * scale) / 2;
  const paths = butterfly.paths
    .map(
      (p) =>
        `<path d="${p.d}" stroke="${strokeColor}" stroke-width="${p.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join("\n    ");
  const bgRect = bgColor ? `<rect width="${canvas}" height="${canvas}" fill="${bgColor}"/>` : "";
  return `<svg width="${canvas}" height="${canvas}" xmlns="http://www.w3.org/2000/svg">
  ${bgRect}
  <g transform="translate(${tx}, ${ty}) scale(${scale})">
    ${paths}
  </g>
</svg>`;
}

async function renderOpaque(svg, outPath, background) {
  await sharp(Buffer.from(svg)).flatten({ background }).png().toFile(outPath);
  console.log("wrote", path.relative(process.cwd(), outPath));
}

async function renderTransparent(svg, outPath) {
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log("wrote", path.relative(process.cwd(), outPath));
}

async function main() {
  await mkdir(assetsDir, { recursive: true });

  // App icon — 1024x1024, opaque (Apple rejects icons with alpha), mark
  // centered on the brand background with generous padding.
  await renderOpaque(
    buildSvg({ canvas: 1024, markFraction: 0.5, strokeColor: GOLD, bgColor: BG }),
    path.join(assetsDir, "icon.png"),
    BG
  );

  // Android adaptive icon — foreground layer: transparent, mark sized to
  // sit inside the ~66%-safe-zone Android crops adaptive icons to.
  await renderTransparent(
    buildSvg({ canvas: 1024, markFraction: 0.42, strokeColor: GOLD, bgColor: null }),
    path.join(assetsDir, "android-icon-foreground.png")
  );

  // Android adaptive icon — background layer: solid fill, no mark.
  await renderOpaque(
    `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="${BG}"/></svg>`,
    path.join(assetsDir, "android-icon-background.png"),
    BG
  );

  // Android 13+ themed icon — transparent single-alpha silhouette (the OS
  // recolors this itself, so the mark is drawn in flat white here).
  await renderTransparent(
    buildSvg({ canvas: 1024, markFraction: 0.42, strokeColor: "#FFFFFF", bgColor: null }),
    path.join(assetsDir, "android-icon-monochrome.png")
  );

  // Splash icon — mark on transparent, rendered at 3x app.json's
  // `imageWidth: 120` for crispness on high-density screens.
  await renderTransparent(
    buildSvg({ canvas: 360, markFraction: 0.85, strokeColor: GOLD, bgColor: null }),
    path.join(assetsDir, "splash-icon.png")
  );

  // Web favicon — small, mark on the brand background.
  await renderOpaque(
    buildSvg({ canvas: 48, markFraction: 0.7, strokeColor: GOLD, bgColor: BG }),
    path.join(assetsDir, "favicon.png"),
    BG
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
