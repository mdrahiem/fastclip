// apps/web/server/rpc/jobs.ts

import { randomUUID } from "crypto";
import type {
  CreateJobInput,
  UpdateJobInput,
  JobStatusResponse,
} from "../../../../packages/contracts/src";
import { createJobSchema, updateJobSchema } from "../../../../packages/contracts/src";
import { getDb } from "../db";
import { getEnv } from "../env";
import { checkRateLimit } from "../rate-limit";
import { getOrCreateSessionId } from "../utils/session-rpc";

export async function createJob(input: CreateJobInput): Promise<{ jobId: string }> {
  // Validate input
  const validated = createJobSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(
      `Validation failed: ${JSON.stringify(validated.error.flatten())}`
    );
  }

  // Get or create session
  const sessionId = await getOrCreateSessionId();

  // Check rate limit
  if (!checkRateLimit(sessionId)) {
    throw new Error("Rate limit exceeded. Maximum 10 jobs per hour.");
  }

  // Create job
  const env = getEnv();
  const db = getDb();
  const jobId = randomUUID();

  try {
    await db.job.create({
      data: {
        id: jobId,
        sessionId,
        jobTitles: JSON.stringify(validated.data.jobTitles),
        aspectRatio: validated.data.aspectRatio,
        status: "queued",
        step: "queued",
        deleteAfter: BigInt(Date.now() + env.JOB_RETENTION_MS),
      },
    });
  } catch (err) {
    console.error("Failed to create job:", err);
    throw new Error("Failed to create job. Please try again.");
  }

  return { jobId };
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const sessionId = await getOrCreateSessionId();
  const db = getDb();

  const job = await db.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  // Verify ownership (session isolation)
  if (job.sessionId !== sessionId) {
    throw new Error("Unauthorized");
  }

  return {
    status: job.status as any,
    step: job.step,
    errorMessage: job.errorMessage || undefined,
  };
}

export async function getJob(jobId: string) {
  const sessionId = await getOrCreateSessionId();
  const db = getDb();

  const job = await db.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  // Verify ownership
  if (job.sessionId !== sessionId) {
    throw new Error("Unauthorized");
  }

  return {
    id: job.id,
    jobTitles: JSON.parse(job.jobTitles),
    aspectRatio: job.aspectRatio,
    status: job.status,
    step: job.step,
    errorMessage: job.errorMessage || undefined,
    outputVideoPath: job.outputVideoPath || undefined,
    createdAt: job.createdAt,
  };
}

export async function updateJob(
  jobId: string,
  input: UpdateJobInput
): Promise<{ jobId: string }> {
  // Validate input
  const validated = updateJobSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(
      `Validation failed: ${JSON.stringify(validated.error.flatten())}`
    );
  }

  // Get or create session
  const sessionId = await getOrCreateSessionId();

  // Check rate limit
  if (!checkRateLimit(sessionId)) {
    throw new Error("Rate limit exceeded. Maximum 10 jobs per hour.");
  }

  // Verify ownership of original job
  const db = getDb();
  const originalJob = await db.job.findUnique({
    where: { id: jobId },
  });

  if (!originalJob) {
    throw new Error("Job not found");
  }

  if (originalJob.sessionId !== sessionId) {
    throw new Error("Unauthorized");
  }

  // Create new job with updated titles
  const env = getEnv();
  const newJobId = randomUUID();

  try {
    await db.job.create({
      data: {
        id: newJobId,
        sessionId,
        jobTitles: JSON.stringify(validated.data.jobTitles),
        aspectRatio: validated.data.aspectRatio,
        status: "queued",
        step: "queued",
        deleteAfter: BigInt(Date.now() + env.JOB_RETENTION_MS),
      },
    });
  } catch (err) {
    console.error("Failed to create updated job:", err);
    throw new Error("Failed to create updated job. Please try again.");
  }

  return { jobId: newJobId };
}
