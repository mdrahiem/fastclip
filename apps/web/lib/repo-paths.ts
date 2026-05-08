import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (directory containing `pnpm-workspace.yaml`, `apps/`, `remotion/`). */
export function getMonorepoRoot(): string {
  return path.resolve(LIB_DIR, "..", "..", "..");
}

/** `apps/web` absolute path. */
export function getWebAppRoot(): string {
  return path.resolve(LIB_DIR, "..");
}
