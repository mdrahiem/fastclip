import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Resolves SQLite `DATABASE_URL` (`file:...` or a filesystem path) to an absolute path.
 * Relative paths are resolved against `process.cwd()`.
 *
 * With `pnpm --filter @video-gen/web <script>`, cwd is typically `apps/web`, so
 * `file:./data/app.db` becomes `apps/web/data/app.db`. If you run tooling from the
 * monorepo root without changing cwd, use a URL that matches that cwd (for example
 * `file:../../data/app.db` when cwd is `apps/web` and the DB should live in the
 * repo-root `data/` folder).
 */
export function resolveSqliteDatabaseFilePath(databaseUrl: string): string {
  const trimmed = databaseUrl.trim();
  const withoutScheme = trimmed.startsWith("file:")
    ? trimmed.replace(/^file:(\/\/)?/i, "")
    : trimmed;
  const normalized = path.normalize(withoutScheme);
  return path.isAbsolute(normalized)
    ? normalized
    : path.resolve(process.cwd(), normalized);
}

/** Absolute `file:` URL for drizzle-kit and drivers that expect a URL string. */
export function toDrizzleSqliteFileUrl(databaseUrl: string): string {
  return pathToFileURL(resolveSqliteDatabaseFilePath(databaseUrl)).href;
}
