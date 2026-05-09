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

    // POST /api/jobs/:jobId/studio — spin up a HyperFrames preview for the job
    const studioMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/studio$/);
    if (studioMatch && req.method === "POST") {
      const { readFileSync, writeFileSync, mkdirSync } = await import("fs");
      const { resolve, dirname } = await import("path");
      const { spawn } = await import("child_process");
      const { fileURLToPath } = await import("url");

      const jobId = studioMatch[1];
      const job = await db.job.findFirst({ where: { id: jobId, sessionId } });
      if (!job) return json(res, 404, { error: "Job not found" }), true;

      const titles: string[] = JSON.parse(job.jobTitles);
      const aspectRatio = job.aspectRatio as "9:16" | "16:9";

      // Build the studio project directory for this job
      const studioDir = resolve(process.cwd(), "data", "jobs", jobId, "studio");
      mkdirSync(studioDir, { recursive: true });

      // Load the composition — resolve relative to this file
      // apps/web/server/ → ../../../packages/hyperframes-render/src/compositions/
      const __filename = fileURLToPath(import.meta.url);
      const __dirname_here = dirname(__filename);
      const compositionSrc = resolve(
        __dirname_here,
        "../../../packages/hyperframes-render/src/compositions/we-are-hiring.html"
      );
      let htmlContent = readFileSync(compositionSrc, "utf-8");

      // Patch data-composition-variables defaults with job's current titles
      htmlContent = htmlContent.replace(
        /data-composition-variables='(\[.*?\])'/s,
        (_match, json_str) => {
          try {
            const vars = JSON.parse(json_str);
            const updates: Record<string, string> = {
              title1: titles[0] ?? "",
              title2: titles[1] ?? "",
              title3: titles[2] ?? "",
              title4: titles[3] ?? "",
              aspectRatio,
            };
            for (const v of vars) {
              if (updates[v.id] !== undefined) v.default = updates[v.id];
            }
            return `data-composition-variables='${JSON.stringify(vars)}'`;
          } catch {
            return _match;
          }
        }
      );

      // Patch HTML dimensions for portrait so the studio viewport is correct
      if (aspectRatio === "9:16") {
        htmlContent = htmlContent
          .replace('data-width="1920"', 'data-width="1080"')
          .replace('data-height="1080"', 'data-height="1920"')
          .replace(
            'background:#000814;width:1920px;height:1080px;position:relative;overflow:hidden;',
            'background:#000814;width:1080px;height:1920px;position:relative;overflow:hidden;'
          )
          .replace(
            'width: 1920px;\n        height: 1080px;\n        overflow: hidden;\n        background: #000814;\n      }\n\n      /* \u2500\u2500 Root \u2500\u2500 */\n      [data-composition-id="root"] {\n        position: relative;\n        width: 1920px;\n        height: 1080px;',
            'width: 1080px;\n        height: 1920px;\n        overflow: hidden;\n        background: #000814;\n      }\n\n      /* \u2500\u2500 Root \u2500\u2500 */\n      [data-composition-id="root"] {\n        position: relative;\n        width: 1080px;\n        height: 1920px;'
          );
      }

      writeFileSync(resolve(studioDir, "index.html"), htmlContent, "utf-8");
      writeFileSync(
        resolve(studioDir, "meta.json"),
        JSON.stringify({ name: "we-are-hiring", id: jobId }),
        "utf-8"
      );

      // Find hyperframes binary
      const hfCandidates = [
        resolve(process.cwd(), "node_modules/.bin/hyperframes"),
        resolve(process.cwd(), "node_modules/.pnpm/node_modules/.bin/hyperframes"),
        "hyperframes",
      ];
      const { existsSync } = await import("fs");
      const hfBin = hfCandidates.find(existsSync) ?? "hyperframes";

      const port = 3002;
      const studioUrl = `http://localhost:${port}`;

      // Spawn a detached preview server (fire-and-forget)
      const child = spawn(hfBin, ["preview", studioDir, `--port`, String(port), "--force-new"], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      // Give the server a moment to bind before the browser hits it
      await new Promise((r) => setTimeout(r, 1500));

      return json(res, 200, { studioUrl }), true;
    }

    // GET /api/jobs/:jobId/download — video stream (supports Range for <video> seeking)
    const downloadMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/download$/);
    if (downloadMatch && req.method === "GET") {
      const { createReadStream, statSync } = await import("fs");
      const jobId = downloadMatch[1];
      const job = await db.job.findFirst({ where: { id: jobId, sessionId } });
      if (!job) return json(res, 404, { error: "Job not found" }), true;
      if (job.status !== "complete" || !job.outputVideoPath) {
        return json(res, 400, { error: "Video not ready" }), true;
      }

      const filePath = job.outputVideoPath;
      const stat = statSync(filePath);
      const fileSize = stat.size;
      const rangeHeader = (req.headers as Record<string, string>).range;

      // Inline by default (for the player); attachment when ?dl=1
      const disposition = url.searchParams.get("dl")
        ? `attachment; filename="hiring-video-${jobId}.mp4"`
        : "inline";

      if (rangeHeader) {
        // Partial content — supports browser <video> seeking
        const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Disposition": disposition,
        });
        createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Type": "video/mp4",
          "Content-Length": fileSize,
          "Accept-Ranges": "bytes",
          "Content-Disposition": disposition,
        });
        createReadStream(filePath).pipe(res);
      }
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
