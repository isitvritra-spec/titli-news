import { type NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8_000;
const MAX_BYTES = 6_000_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Streams a source image through our server for admin previews. Publishers'
 * CDNs block hotlinking, so an <img> pointing straight at the source URL fails
 * in the browser; fetching it server-side (as the ingest pipeline already does)
 * works. Admin-only, and only follows http(s) image URLs.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url || !/^https?:\/\//i.test(url)) {
    return new Response("Bad request", { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: controller.signal });
    if (!res.ok) return new Response("Not found", { status: 404 });

    const contentType = res.headers.get("content-type") ?? "";
    if (/text\/|html|xml|json/i.test(contentType)) return new Response("Not an image", { status: 415 });

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return new Response("Too large", { status: 413 });

    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType.startsWith("image/") ? contentType : "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
