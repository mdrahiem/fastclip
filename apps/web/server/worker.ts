// apps/web/server/worker.ts

import path from "path";
import { getDb } from "./db";
import { getEnv } from "./env";
import { renderWeAreHiringVideo } from "../../../packages/hyperframes-render/src";

const POLL_INTERVAL_MS = 2000;

async function processJob(jobId: string): Promise<void> {
  const db = getDb();
  const env = getEnv();

  const job = await db.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Update status to rendering
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "rendering",
        step: "rendering",
        updatedAt: new Date(),
      },
    });

    // Parse job titles
    const jobTitles = JSON.parse(job.jobTitles);

    // Create output directory
    const jobDir = path.join(process.cwd(), "data", "jobs", jobId);
    const outputPath = path.join(jobDir, "output.mp4");

    // Get music path (absolute)
    const musicPath = path.join(process.cwd(), env.PUBLIC_MUSIC_PATH);

    // Render video
    await renderWeAreHiringVideo({
      jobTitles,
      aspectRatio: job.aspectRatio as "9:16" | "16:9",
      outputPath,
      musicPath,
      hyperframesCliPath: env.HYPERFRAMES_CLI_PATH,
    });

    // Update job as complete
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "complete",
        step: "complete",
        outputVideoPath: outputPath,
        updatedAt: new Date(),
      },
    });

    console.log(`✓ Completed job ${jobId}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`✗ Failed job ${jobId}:`, errorMessage);

    await db.job.update({
      where: { id: jobId },
      data: {
        status: "failed",
        step: "failed",
        errorMessage: errorMessage.slice(0, 2048),
        updatedAt: new Date(),
      },
    });
  }
}

async function cleanupOldJobs(): Promise<void> {
  const db = getDb();
  const env = getEnv();

  const now = BigInt(Date.now());

  const deleted = await db.job.deleteMany({
    where: {
      deleteAfter: {
        lt: now,
        gt: 0n,
      },
    },
  });

  if (deleted.count > 0) {
    console.log(`Cleaned up ${deleted.count} old jobs`);
  }
}

async function pollAndProcess(): Promise<void> {
  const db = getDb();

  try {
    // Find first queued job
    const queuedJob = await db.job.findFirst({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" },
    });

    if (queuedJob) {
      console.log(`Processing job ${queuedJob.id}...`);
      await processJob(queuedJob.id);
    }

    // Cleanup old jobs
    await cleanupOldJobs();
  } catch (err) {
    console.error("Worker error:", err);
  }
}

export async function startWorker(): Promise<void> {
  console.log("Starting background worker...");

  const db = getDb();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down worker...");
    await db.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nShutting down worker...");
    await db.$disconnect();
    process.exit(0);
  });

  // Start polling loop
  while (true) {
    await pollAndProcess();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker().catch((err) => {
    console.error("Fatal worker error:", err);
    process.exit(1);
  });
}
