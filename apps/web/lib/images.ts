import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
import { storedImagePath, uploadDirectory, uploadedImageUrl } from "./storage";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export type SavedImage = {
  /** Root-relative media URL, made absolute for API clients by lib/apiSerialize.ts. */
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
  if (inputBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 15 MB or smaller");
  }

  await fs.mkdir(uploadDirectory, { recursive: true });

  const image = sharp(inputBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Image dimensions could not be read");
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const optimized = await image.clone().webp({ quality: 85 }).toBuffer();
  await fs.writeFile(storedImagePath(filename)!, optimized);

  const blurBuffer = await sharp(inputBuffer).rotate().resize(16).webp({ quality: 40 }).toBuffer();
  const blurDataURL = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  return {
    path: uploadedImageUrl(filename),
    width: metadata.width,
    height: metadata.height,
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
 *
 * Call this only behind a source whose `imagePolicy` is "allow" — re-hosting
 * a publisher's photo without that check is the copyright exposure the policy
 * exists to prevent. prepareDraft() in db/inboxQueries.ts is the only caller.
 */
const FETCH_TIMEOUT_MS = 10_000;
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

const MAX_ARTICLE_HTML_BYTES = 1_000_000;

/** Finds the image publishers expose for link previews without adding a DOM parser. */
export function extractSocialImageUrl(html: string, articleUrl: string): string | null {
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const attributes = new Map<string, string>();
    const attributePattern = /([:\w-]+)\s*=\s*(["'])(.*?)\2/g;
    for (const match of tag.matchAll(attributePattern)) {
      attributes.set(match[1]!.toLowerCase(), match[3]!);
    }

    const key = (attributes.get("property") ?? attributes.get("name") ?? "").toLowerCase();
    if (key !== "og:image" && key !== "twitter:image" && key !== "twitter:image:src") {
      continue;
    }

    const content = attributes.get("content");
    if (!content) continue;
    try {
      const resolved = new URL(content, articleUrl);
      if (resolved.protocol === "http:" || resolved.protocol === "https:") {
        return resolved.toString();
      }
    } catch {
      // Keep scanning if a publisher emits a malformed social-image tag.
    }
  }

  return null;
}

/** Uses the article's Open Graph/Twitter image when its RSS feed omits media. */
export async function saveImageFromArticle(articleUrl: string): Promise<SavedImage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = new URL(articleUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; TitliNews/1.0)",
      },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return null;
    }

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > MAX_ARTICLE_HTML_BYTES) return null;

    const articleBuffer = await res.arrayBuffer();
    if (articleBuffer.byteLength > MAX_ARTICLE_HTML_BYTES) return null;

    const html = new TextDecoder().decode(articleBuffer);
    const imageUrl = extractSocialImageUrl(html, res.url || url.toString());
    return imageUrl ? await saveImageFromUrl(imageUrl) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const EDITORIAL_PALETTES = [
  { background: "#110D0F", primary: "#C83D4B", secondary: "#C9975A" },
  { background: "#171014", primary: "#633F59", secondary: "#C9975A" },
  { background: "#101514", primary: "#5E8C82", secondary: "#F2EFE9" },
  { background: "#1A1012", primary: "#7F222D", secondary: "#C9975A" },
] as const;

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
  const palette = EDITORIAL_PALETTES[hash % EDITORIAL_PALETTES.length]!;
  const x = 260 + (hash % 660);
  const y = 190 + ((hash >>> 4) % 380);
  const rotation = -18 + (hash % 37);
  const composition = hash % 3;

  const artwork = composition === 0
    ? `<circle cx="${x}" cy="${y}" r="250" fill="none" stroke="${palette.primary}" stroke-width="80" opacity="0.72"/>
       <circle cx="${x + 260}" cy="${y - 130}" r="145" fill="${palette.secondary}" opacity="0.3"/>
       <path d="M80 650 C330 470 660 760 1120 380" fill="none" stroke="${palette.secondary}" stroke-width="12" opacity="0.55"/>`
    : composition === 1
      ? `<g transform="translate(${x} ${y}) rotate(${rotation})">
           <ellipse cx="-170" cy="-95" rx="230" ry="115" fill="${palette.primary}" opacity="0.72"/>
           <ellipse cx="170" cy="-95" rx="230" ry="115" fill="${palette.secondary}" opacity="0.34"/>
           <ellipse cx="-130" cy="120" rx="190" ry="90" fill="${palette.secondary}" opacity="0.24"/>
           <ellipse cx="130" cy="120" rx="190" ry="90" fill="${palette.primary}" opacity="0.5"/>
         </g>`
      : `<path d="M0 590 C250 420 430 720 700 510 C900 355 1030 440 1200 300 L1200 800 L0 800 Z" fill="${palette.primary}" opacity="0.58"/>
         <path d="M0 690 C280 530 520 790 790 600 C980 465 1090 500 1200 440" fill="none" stroke="${palette.secondary}" stroke-width="18" opacity="0.5"/>
         <circle cx="${x}" cy="${y - 120}" r="115" fill="${palette.secondary}" opacity="0.28"/>`;

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="78%" cy="18%" r="70%">
        <stop offset="0" stop-color="${palette.primary}" stop-opacity="0.28"/>
        <stop offset="1" stop-color="${palette.background}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="${palette.background}"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    ${artwork}
    <g transform="translate(1060 92)" fill="none" stroke="${palette.secondary}" stroke-width="7" opacity="0.9">
      <ellipse cx="-28" cy="-13" rx="34" ry="22" transform="rotate(24 -28 -13)"/>
      <ellipse cx="28" cy="-13" rx="34" ry="22" transform="rotate(-24 28 -13)"/>
      <ellipse cx="-23" cy="22" rx="28" ry="18" transform="rotate(-22 -23 22)"/>
      <ellipse cx="23" cy="22" rx="28" ry="18" transform="rotate(22 23 22)"/>
    </g>
  </svg>`;

  return processImageBuffer(Buffer.from(svg));
}

export async function deleteUploadedImage(imagePath: string): Promise<void> {
  let filename: string | null = null;
  if (imagePath.startsWith("/media/")) {
    filename = decodeURIComponent(imagePath.slice("/media/".length));
  } else if (imagePath.startsWith("/uploads/")) {
    filename = imagePath.slice("/uploads/".length);
  }

  const filePath = filename ? storedImagePath(filename) : null;
  if (filePath) await fs.unlink(filePath).catch(() => {});
}
