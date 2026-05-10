// apps/web/server/production.ts
// Simple production HTTP server for Fly.io deployment
// Serves static files and routes API requests

import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";
import { handleApiRequest } from "./api-handler";
import { startWorker } from "./worker";

const PORT = process.env.PORT || 8080;
const STATIC_DIR = join(process.cwd(), "dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

async function serveStatic(reqPath: string, res: any): Promise<boolean> {
  // Security: prevent directory traversal
  const safePath = reqPath.replace(/\.{2,}/g, "").replace(/^\/+/, "");
  const filePath = join(STATIC_DIR, safePath || "index.html");

  // Default to index.html for SPA routing
  const finalPath = existsSync(filePath) && !filePath.endsWith("/")
    ? filePath
    : join(filePath, "index.html");

  if (!existsSync(finalPath)) {
    // Try index.html for client-side routing
    const indexPath = join(STATIC_DIR, "index.html");
    if (existsSync(indexPath)) {
      try {
        const content = await readFile(indexPath);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  try {
    const content = await readFile(finalPath);
    const ext = extname(finalPath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
    });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    // Try API handler first
    const handled = await handleApiRequest(req, res);
    if (handled) return;

    // Fall back to static file serving
    const served = await serveStatic(req.url || "/", res);
    if (!served) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  } catch (err) {
    console.error("[server] error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
});

server.listen(PORT, () => {
  console.log(`[server] Production server running on port ${PORT}`);
});

// Start background worker in the same process
// Note: For production at scale, consider running worker as a separate process
startWorker().catch((err) => {
  console.error("[worker] fatal error:", err);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[server] shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("\n[server] shutting down...");
  server.close(() => process.exit(0));
});
