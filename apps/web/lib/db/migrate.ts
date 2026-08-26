import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

migrate(db, { migrationsFolder: path.join(process.cwd(), "lib", "db", "migrations") });
console.log("Database migrations applied.");
