import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode-terminal/vendor/QRCode");
const QRErrorCorrectLevel = require(
  "qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel",
);
const sharp = require("sharp");

const value = process.argv[2];
const outputPath = resolve(
  process.argv[3] ?? ".tmp/titli-expo-go-qr-fresh.png",
);

if (!value) {
  console.error("Usage: node scripts/generate-expo-qr.mjs <expo-url> [output.svg]");
  process.exit(1);
}

const qr = new QRCode(-1, QRErrorCorrectLevel.L);
qr.addData(value);
qr.make();

const margin = 4;
const scale = 12;
const moduleCount = qr.getModuleCount();
const size = (moduleCount + margin * 2) * scale;
const cells = [];

for (let row = 0; row < moduleCount; row += 1) {
  for (let column = 0; column < moduleCount; column += 1) {
    if (qr.modules[row][column]) {
      cells.push(
        `<rect x="${(column + margin) * scale}" y="${(row + margin) * scale}" width="${scale}" height="${scale}"/>`,
      );
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${cells.join("")}</g></svg>`;

await mkdir(dirname(outputPath), { recursive: true });
if (extname(outputPath).toLowerCase() === ".png") {
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
} else {
  await writeFile(outputPath, svg);
}

console.log(`Generated ${outputPath} for ${value}`);
