import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { databasePath } from "../storage";

/**
 * A local file, not a hosted service — this is the whole point of the
 * self-hosted path. Note for deployment: this needs a persistent disk
 * (a VPS, a container with a mounted volume, etc.) — it will NOT survive
 * on ephemeral/serverless filesystems (e.g. plain Vercel functions), since
 * those don't persist writes between invocations. See the deployment notes
 * in the README for the self-hosting options this implies.
 */
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
