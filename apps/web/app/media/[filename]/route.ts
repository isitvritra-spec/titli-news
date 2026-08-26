import fs from "node:fs/promises";
import { storedImagePath } from "../../../lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/media/[filename]">) {
  const { filename } = await context.params;
  const filePath = storedImagePath(filename);
  if (!filePath) return new Response("Not found", { status: 404 });

  try {
    const image = await fs.readFile(filePath);
    return new Response(image, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(image.byteLength),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
