import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  DEFAULT_THEME_PACK_ID,
  DEFAULT_VIDEO_TEMPLATE_ID,
} from "@video-gen/contracts";

import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { getJobDir } from "@/lib/jobs/job-paths";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateSessionId,
  SESSION_COOKIE_NAME,
  serializeSessionCookie,
  verifySessionCookie,
} from "@/lib/session";

const createJobSchema = z
  .object({
    postText: z.string().min(1),
    aspectRatio: z.enum(["9:16", "16:9"]),
    musicMode: z.enum(["builtin", "upload"]),
    builtinTrackId: z.string().min(1).optional(),
    base64Music: z.string().optional(),
    templateId: z.literal("linkedin-three-beat-v1").optional(),
    themeId: z.literal("graph-paper-v1").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.musicMode === "upload") {
      if (!data.base64Music || data.base64Music.trim().length < 32) {
        ctx.addIssue({
          code: "custom",
          message: "base64Music required for upload mode.",
        });
      }
    }
  });

export async function POST(req: Request) {
  const env = getEnv();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = checkRateLimit(`jobs:${ip}`, { max: 60, windowMs: 60_000 });
  if (!rl.ok) {
    const headers =
      rl.retryAfterSec !== undefined
        ? { "Retry-After": String(rl.retryAfterSec) }
        : undefined;
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers },
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.postText.length > env.MAX_POST_CHARS) {
    return NextResponse.json(
      { error: `postText exceeds ${env.MAX_POST_CHARS} characters.` },
      { status: 400 },
    );
  }

  const templateId =
    data.templateId ?? DEFAULT_VIDEO_TEMPLATE_ID ?? "linkedin-three-beat-v1";
  const themeId = data.themeId ?? DEFAULT_THEME_PACK_ID ?? "graph-paper-v1";

  const cookieStore = await cookies();
  let sessionId = verifySessionCookie(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    env.SESSION_SECRET,
  );
  if (!sessionId) sessionId = generateSessionId();

  const jobId = randomUUID();
  const now = Date.now();
  const jobRoot = getJobDir(jobId);
  await mkdir(jobRoot, { recursive: true });

  let uploadStoragePath: string | null = null;
  if (data.musicMode === "upload" && data.base64Music) {
    let buf: Buffer;
    try {
      buf = Buffer.from(data.base64Music, "base64");
    } catch {
      return NextResponse.json({ error: "Invalid base64 music." }, { status: 400 });
    }

    if (buf.length > env.MAX_MUSIC_BYTES) {
      return NextResponse.json({ error: "Music file too large." }, { status: 400 });
    }

    uploadStoragePath = path.join(jobRoot, "upload-input.bin");
    await writeFile(uploadStoragePath, buf);
  }

  const builtinTrackId =
    data.musicMode === "builtin" ? (data.builtinTrackId ?? "default") : null;

  try {
    getDb()
      .insert(jobs)
      .values({
        id: jobId,
        sessionId,
        status: "queued",
        step: "queued",
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
        deleteAfter: 0,
        postText: data.postText,
        templateId,
        themeId,
        aspectRatio: data.aspectRatio,
        musicMode: data.musicMode,
        builtinTrackId,
        uploadStoragePath,
        slidePlanJson: null,
        outputVideoPath: null,
      })
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table:\s*jobs/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Database is empty. From the repo root run: pnpm --filter @video-gen/web db:migrate",
        },
        { status: 503 },
      );
    }
    throw err;
  }

  const res = NextResponse.json({ jobId });
  res.cookies.set(
    SESSION_COOKIE_NAME,
    serializeSessionCookie(sessionId, env.SESSION_SECRET),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 45,
    },
  );
  return res;
}
