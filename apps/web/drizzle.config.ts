import { mkdirSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";
import {
  resolveSqliteDatabaseFilePath,
  toDrizzleSqliteFileUrl,
} from "./lib/db/resolve-database-url";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/app.db";

mkdirSync(path.dirname(resolveSqliteDatabaseFilePath(databaseUrl)), {
  recursive: true,
});

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: toDrizzleSqliteFileUrl(databaseUrl),
  },
});
