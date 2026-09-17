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

    // Many image CDNs serve a generic type (binary/octet-stream) — only reject
    // things that are clearly not images (error pages). sharp validates the rest.
    const contentType = res.headers.get("content-type") ?? "";
    if (/text\/|html|xml|json/i.test(contentType)) return null;

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

// Distinct hues so different topics read differently, all mid-dark with a
// cream/gold mark and label that stays legible.
const EDITORIAL_PALETTES = [
  { background: "#3A1A22", primary: "#C83D4B", secondary: "#F2EFE9" }, // rose
  { background: "#2A1B33", primary: "#8A5A96", secondary: "#F2EFE9" }, // plum
  { background: "#12312E", primary: "#5E8C82", secondary: "#F2EFE9" }, // teal
  { background: "#1E3A24", primary: "#5C8B5A", secondary: "#F2EFE9" }, // forest
  { background: "#1B2540", primary: "#5B77B0", secondary: "#F2EFE9" }, // indigo
  { background: "#3A2410", primary: "#C9873A", secondary: "#F2EFE9" }, // amber
  { background: "#2C2A34", primary: "#8A86A0", secondary: "#F2EFE9" }, // slate
  { background: "#3A121A", primary: "#7F222D", secondary: "#C9975A" }, // maroon
] as const;

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

/**
 * A branded placeholder for cards with no usable source image (denied by the
 * licence policy, or the source never provides one). When a topic `label` is
 * given the tint is chosen from it — so every card of a topic shares a coherent
 * look — and the label is set across the art, which reads as intentional on a
 * phone rather than blank. Deterministic, and phone-light (1000×640 → webp).
 */
export async function generatePlaceholderImage(seedText: string, label?: string): Promise<SavedImage> {
  const tintSeed = label ?? seedText;
  let hash = 0;
  for (let i = 0; i < tintSeed.length; i++) {
    hash = (hash * 31 + tintSeed.charCodeAt(i)) >>> 0;
  }

  const width = 1000;
  const height = 640;
  const palette = EDITORIAL_PALETTES[hash % EDITORIAL_PALETTES.length]!;
  const caption = (label ?? "Titli").toUpperCase();

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${palette.background}"/>
        <stop offset="1" stop-color="${palette.primary}" stop-opacity="0.55"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="815" cy="150" r="220" fill="${palette.primary}" opacity="0.28"/>
    <circle cx="150" cy="560" r="180" fill="${palette.secondary}" opacity="0.12"/>
    <path d="M0 470 C260 360 470 600 720 470 C880 388 940 430 1000 400 L1000 640 L0 640 Z" fill="${palette.primary}" opacity="0.35"/>
    <g transform="translate(500 300)" fill="none" stroke="${palette.secondary}" stroke-width="9" opacity="0.9">
      <ellipse cx="-40" cy="-20" rx="52" ry="34" transform="rotate(24 -40 -20)"/>
      <ellipse cx="40" cy="-20" rx="52" ry="34" transform="rotate(-24 40 -20)"/>
      <ellipse cx="-32" cy="34" rx="42" ry="27" transform="rotate(-22 -32 34)"/>
      <ellipse cx="32" cy="34" rx="42" ry="27" transform="rotate(22 32 34)"/>
    </g>
    <text x="500" y="470" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700"
      letter-spacing="4" fill="${palette.secondary}" fill-opacity="0.92" text-anchor="middle">${escapeXml(caption)}</text>
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
