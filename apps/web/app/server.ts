// apps/web/app/server.ts

import { createServer } from "@tanstack/start";
import { closeDb } from "@/server/db";

const server = createServer({
  middleware: [],
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await closeDb();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down...");
  await closeDb();
  process.exit(0);
});

export default server;
