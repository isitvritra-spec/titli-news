/**
 * Fetches an article's readable text for the AI drafting step. It is only ever
 * called for a source whose `allowsTextFetch` policy is true, and the text is
 * used in memory and never persisted — we keep the generated card and the
 * originality fragments, not the publisher's prose.
 *
 * Deliberately dependency-free: a tag strip is enough to feed the model, and it
 * avoids adding a DOM parser for a best-effort read.
 */

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2_000_000;
const MAX_CHARS = 12_000;

// A plain browser UA — several of these publishers WAF-block obvious bots
// (same reason lib/rss.ts sets one).
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchArticleText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return null;

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return null;

    const text = htmlToText(new TextDecoder().decode(buffer)).slice(0, MAX_CHARS);
    return text.length > 200 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
