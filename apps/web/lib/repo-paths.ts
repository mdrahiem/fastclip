import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (parent of `apps/web`). */
export function getMonorepoRoot(): string {
  return path.resolve(LIB_DIR, "..", "..");
}

/** `apps/web` absolute path. */
export function getWebAppRoot(): string {
  return path.resolve(LIB_DIR, "..");
}
