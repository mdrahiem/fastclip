import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repo root (`video-gen/`), same as `pnpm-workspace.yaml`, for a single shared `.env`. */
export function loadMonorepoEnv(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const monorepoRoot = path.resolve(here, "..", "..", "..");
  config({
    path: path.join(monorepoRoot, ".env"),
    quiet: true,
  });
  config({
    path: path.join(monorepoRoot, ".env.local"),
    override: true,
    quiet: true,
  });
}

loadMonorepoEnv();
