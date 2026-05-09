// apps/web/server/worker-entry.ts

import "./env";
import { startWorker } from "./worker";

startWorker().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
