import "../lib/load-monorepo-env";
import { startJobWorker } from "../lib/jobs/worker";

const controller = new AbortController();
process.on("SIGINT", () => controller.abort());
process.on("SIGTERM", () => controller.abort());

startJobWorker({ abortSignal: controller.signal, cleanup: true }).catch((err) => {
  console.error(err);
  process.exit(1);
});
