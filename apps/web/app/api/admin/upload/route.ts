import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import { MAX_IMAGE_BYTES, saveUploadedImage } from "../../../../lib/images";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 15 MB or smaller" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be 15 MB or smaller" }, { status: 413 });
  }

  try {
    const saved = await saveUploadedImage(file);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "The image could not be processed" }, { status: 400 });
  }
}
