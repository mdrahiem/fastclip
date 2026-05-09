// apps/web/server/api-handler.ts
// Express-compatible request handler for the REST API — used by both Vite dev middleware and prod server

import type { IncomingMessage, ServerResponse } from "http";
import { getDb } from "./db";
import { checkRateLimit } from "./rate-limit";
import { getOrCreateSession } from "./session";
import { createJobSchema, updateJobSchema } from "@video-gen/contracts";
import { randomUUID } from "crypto";
import { JOB_RETENTION_MS } from "../lib/constants";

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header.split(";").map((s) => {
      const [k, ...v] = s.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  // Only handle /api/* routes
  if (!pathname.startsWith("/api/")) return false;

  const cookies = parseCookies(req);
  const { sessionId, token } = await getOrCreateSession(cookies["session"]);

  // Set session cookie on every response
  res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

  const db = getDb();

  try {
    // POST /api/jobs — create job
    if (pathname === "/api/jobs" && req.method === "POST") {
      const body = await readBody(req);
      const parsed = createJobSchema.safeParse(body);
      if (!parsed.success) {
        return json(res, 400, { error: "Validation failed", details: parsed.error.flatten() }), true;
      }

      if (!checkRateLimit(sessionId)) {
        return json(res, 429, { error: "Rate limit exceeded. Maximum 10 jobs per hour." }), true;
      }

      const jobId = randomUUID();
      const now = BigInt(Date.now());
      const deleteAfter = now + BigInt(JOB_RETENTION_MS);

      await db.job.create({
        data: {
          id: jobId,
          sessionId,
          jobTitles: JSON.stringify(parsed.data.jobTitles),
          aspectRatio: parsed.data.aspectRatio,
          status: "queued",
          step: "queued",
          deleteAfter,
        },
      });

      return json(res, 201, { jobId }), true;
    }

    // GET /api/jobs/:jobId — get job detail
    const detailMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/);
    if (detailMatch && req.method === "GET") {
      const jobId = detailMatch[1];
      const job = await db.job.findFirst({ where: { id: jobId, sessionId } });
      if (!job) return json(res, 404, { error: "Job not found" }), true;

      return json(res, 200, {
        jobId: job.id,
        status: job.status,
        step: job.step,
        errorMessage: job.errorMessage,
        outputVideoPath: job.outputVideoPath,
        jobTitles: JSON.parse(job.jobTitles),
        aspectRatio: job.aspectRatio,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      }), true;
    }

    // PATCH /api/jobs/:jobId — re-queue job with updated fields
    if (detailMatch && req.method === "PATCH") {
      const jobId = detailMatch[1];
      const existing = await db.job.findFirst({ where: { id: jobId, sessionId } });
      if (!existing) return json(res, 404, { error: "Job not found" }), true;

      const body = await readBody(req);
      const parsed = updateJobSchema.safeParse(body);
      if (!parsed.success) {
        return json(res, 400, { error: "Validation failed", details: parsed.error.flatten() }), true;
      }

      if (!checkRateLimit(sessionId)) {
        return json(res, 429, { error: "Rate limit exceeded." }), true;
      }

      // Create a new job (edit = new render)
      const newJobId = randomUUID();
      const now = BigInt(Date.now());
      const deleteAfter = now + BigInt(JOB_RETENTION_MS);

      await db.job.create({
        data: {
          id: newJobId,
          sessionId,
          jobTitles: JSON.stringify(parsed.data.jobTitles ?? JSON.parse(existing.jobTitles)),
          aspectRatio: parsed.data.aspectRatio ?? existing.aspectRatio,
          status: "queued",
          step: "queued",
          deleteAfter,
        },
      });

      return json(res, 201, { jobId: newJobId }), true;
    }

    // GET /api/jobs/:jobId/status — polling endpoint
    const statusMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/status$/);
    if (statusMatch && req.method === "GET") {
      const jobId = statusMatch[1];
      const job = await db.job.findFirst({ where: { id: jobId, sessionId } });
      if (!job) return json(res, 404, { error: "Job not found" }), true;

      return json(res, 200, {
        jobId: job.id,
        status: job.status,
        step: job.step,
        errorMessage: job.errorMessage,
        outputVideoPath: job.outputVideoPath,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      }), true;
    }

    // GET /api/jobs/:jobId/download — video download
    const downloadMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/download$/);
    if (downloadMatch && req.method === "GET") {
      const { createReadStream, statSync } = await import("fs");
      const jobId = downloadMatch[1];
      const job = await db.job.findFirst({ where: { id: jobId, sessionId } });
      if (!job) return json(res, 404, { error: "Job not found" }), true;
      if (job.status !== "complete" || !job.outputVideoPath) {
        return json(res, 400, { error: "Video not ready" }), true;
      }
      const stat = statSync(job.outputVideoPath);
      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": stat.size,
        "Content-Disposition": `attachment; filename="hiring-video-${jobId}.mp4"`,
      });
      createReadStream(job.outputVideoPath).pipe(res);
      return true;
    }

    json(res, 404, { error: "Not found" });
    return true;
  } catch (err) {
    console.error("API error:", err);
    json(res, 500, { error: "Internal server error" });
    return true;
  }
}
