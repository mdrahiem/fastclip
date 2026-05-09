// apps/web/vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import type { Plugin } from "vite";

function apiMiddlewarePlugin(): Plugin {
  return {
    name: "api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        try {
          const { handleApiRequest } = await server.ssrLoadModule(
            "/server/api-handler.ts"
          );
          const handled = await handleApiRequest(req, res);
          if (!handled) next();
        } catch (err) {
          console.error("[api-middleware]", err);
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "@video-gen/contracts": fileURLToPath(new URL("../../packages/contracts/src/index.ts", import.meta.url)),
    },
  },
  // Prevent server-only modules from being bundled for the client
  optimizeDeps: {
    exclude: ["@prisma/client", "prisma"],
  },
});
