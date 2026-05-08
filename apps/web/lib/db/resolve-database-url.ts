import path from "node:path";
import { pathToFileURL } from "node:url";
import { getMonorepoRoot } from "../repo-paths";

/**
 * Resolves SQLite `DATABASE_URL` (`file:...` or a filesystem path) to an absolute path.
 * **Relative** paths are resolved against the **monorepo root** (same as `pnpm-workspace.yaml`)
 * so the Next.js server and `pnpm worker` always share one DB file regardless of `process.cwd()`.
 */
export function resolveSqliteDatabaseFilePath(databaseUrl: string): string {
  const trimmed = databaseUrl.trim();
  const withoutScheme = trimmed.startsWith("file:")
    ? trimmed.replace(/^file:(\/\/)?/i, "")
    : trimmed;
  const normalized = path.normalize(withoutScheme);
  return path.isAbsolute(normalized)
    ? normalized
    : path.resolve(getMonorepoRoot(), normalized);
}

/** Absolute `file:` URL for drizzle-kit and drivers that expect a URL string. */
export function toDrizzleSqliteFileUrl(databaseUrl: string): string {
  return pathToFileURL(resolveSqliteDatabaseFilePath(databaseUrl)).href;
}
