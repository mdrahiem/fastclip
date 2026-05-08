import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getEnv } from "../env";
import * as schema from "./schema";
import { resolveSqliteDatabaseFilePath } from "./resolve-database-url";

let sqlite: Database.Database | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getSqlite(): Database.Database {
  if (!sqlite) {
    const { DATABASE_URL } = getEnv();
    const dbPath = resolveSqliteDatabaseFilePath(DATABASE_URL);
    mkdirSync(path.dirname(dbPath), { recursive: true });
    sqlite = new Database(dbPath);
  }
  return sqlite;
}

export function getDb() {
  if (!db) {
    db = drizzle(getSqlite(), { schema });
  }
  return db;
}
