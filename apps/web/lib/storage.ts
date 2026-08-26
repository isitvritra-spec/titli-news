import path from "node:path";

const configuredStorageRoot = process.env.STORAGE_ROOT?.trim();

/**
 * Production hosts should mount durable storage at STORAGE_ROOT. Local
 * development keeps the existing project-relative data layout.
 */
export const databasePath =
  process.env.DATABASE_PATH?.trim() ||
  path.join(configuredStorageRoot || process.cwd(), "data", "bitefeed.db");

export const uploadDirectory =
  process.env.UPLOAD_DIR?.trim() ||
  (configuredStorageRoot
    ? path.join(configuredStorageRoot, "uploads")
    : path.join(process.cwd(), "public", "uploads"));

export function uploadedImageUrl(filename: string): string {
  return `/media/${encodeURIComponent(filename)}`;
}

export function storedImagePath(filename: string): string | null {
  if (!filename || filename !== path.basename(filename)) return null;
  return path.join(uploadDirectory, filename);
}
