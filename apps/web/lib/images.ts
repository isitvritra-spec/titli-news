import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedImage = {
  /** Root-relative path under /public — served directly by Next, and resolvable to an absolute URL by prefixing the site origin (see lib/apiSerialize.ts). */
  path: string;
  width: number;
  height: number;
  blurDataURL: string;
};

/**
 * No image CDN here — this is the trade-off of the self-hosted path.
 * Uploads land in public/uploads (needs a persistent disk in production,
 * same caveat as the SQLite file — see lib/db/client.ts). next/image's
 * built-in optimizer handles resizing for the web app at request time;
 * the blur placeholder is generated once here via a tiny low-quality
 * resize, so mobile (which has no next/image) gets the same blur-up
 * effect from the stored data URI.
 *
 * Shared by both a manual admin upload (saveUploadedImage) and an RSS
 * candidate's image (saveImageFromUrl, see lib/rss.ts) — same pipeline
 * either way, so a downloaded article image looks and behaves exactly
 * like a manually-uploaded one.
 */
async function processImageBuffer(inputBuffer: Buffer): Promise<SavedImage> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const image = sharp(inputBuffer).rotate();
  const metadata = await image.metadata();

  const filename = `${crypto.randomUUID()}.webp`;
  const optimized = await image.clone().webp({ quality: 85 }).toBuffer();
  await fs.writeFile(path.join(UPLOAD_DIR, filename), optimized);

  const blurBuffer = await sharp(inputBuffer).rotate().resize(16).webp({ quality: 40 }).toBuffer();
  const blurDataURL = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  return {
    path: `/uploads/${filename}`,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    blurDataURL,
  };
}

export async function saveUploadedImage(file: File): Promise<SavedImage> {
  return processImageBuffer(Buffer.from(await file.arrayBuffer()));
}

/**
 * Downloads a remote image (an RSS candidate's <enclosure> URL) and runs it
 * through the same pipeline as a manual upload. RSS sources are untrusted
 * third parties, so this is deliberately defensive: a short timeout, a
 * content-type sniff before handing bytes to sharp, and a capped download
 * size — a slow/hostile/non-image URL should fail cleanly, not hang the
 * request or process an arbitrarily large payload.
 */
const FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB

export async function saveImageFromUrl(url: string): Promise<SavedImage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_BYTES) return null;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) return null;

    return await processImageBuffer(Buffer.from(arrayBuffer));
  } catch {
    // Network failure, timeout, or an invalid image sharp couldn't decode —
    // the editor just doesn't get a pre-filled image and uploads one manually.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const PLACEHOLDER_PALETTE = ["#5A181A", "#E4A069", "#2A1518", "#7A2E24", "#100A0C"];

/**
 * A branded placeholder for cards that genuinely have no source image —
 * some RSS sources (PIB, Google News, a share of Behanbox items) never
 * provide one. Better than blocking publish on a manual upload the editor
 * may not have handy, and better than shipping a broken/missing image to
 * readers. Deterministic per input string, so drafting the same candidate
 * twice reuses the same look rather than a new random one each time.
 */
export async function generatePlaceholderImage(seedText: string): Promise<SavedImage> {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }

  const width = 1200;
  const height = 800;
  const bg = PLACEHOLDER_PALETTE[hash % PLACEHOLDER_PALETTE.length];
  const fg = PLACEHOLDER_PALETTE[(hash + 2) % PLACEHOLDER_PALETTE.length];
  const cx = hash % width;
  const cy = (hash * 7) % height;
  const r = 180 + (hash % 5) * 30;

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bg}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fg}" opacity="0.45"/>
  </svg>`;

  return processImageBuffer(Buffer.from(svg));
}

export async function deleteUploadedImage(imagePath: string): Promise<void> {
  if (!imagePath.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", imagePath);
  await fs.unlink(filePath).catch(() => {});
}
