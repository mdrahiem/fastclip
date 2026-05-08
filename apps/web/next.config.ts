import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

loadDotenv({ path: path.join(monorepoRoot, ".env"), quiet: true });
loadDotenv({
  path: path.join(monorepoRoot, ".env.local"),
  override: true,
  quiet: true,
});

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "remotion",
    "esbuild",
  ],
};

export default nextConfig;
