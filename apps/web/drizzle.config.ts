import { defineConfig } from "drizzle-kit";
import path from "node:path";

const databaseUrl =
  process.env.DATABASE_PATH?.trim() ||
  (process.env.STORAGE_ROOT?.trim()
    ? path.join(process.env.STORAGE_ROOT, "data", "bitefeed.db")
    : "./data/bitefeed.db");

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});
