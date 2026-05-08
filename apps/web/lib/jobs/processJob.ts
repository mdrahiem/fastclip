import { existsSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import ffmpeg from "fluent-ffmpeg";
import type { AspectRatioId, SlidePlan, ThemePack, VideoTemplate } from "@video-gen/contracts";
import { getTemplateById, getThemeById } from "@video-gen/contracts";
import { planPost } from "@video-gen/planner";
import { PlannerError } from "@video-gen/planner";

import "../audio/normalize";
import { normalizeMusicToAac } from "../audio/normalize";
import { getDb } from "../db";
import { jobs } from "../db/schema";
import { getEnv } from "../env";
import { renderLinkedInPostVideo, resolveDefaultRemotionEntry } from "../remotion/render";
import {
  getBuiltinMusicFilePath,
  getJobDir,
  getJobInputAudioDir,
  getJobNormalizedAudioPath,
  getJobOutputVideoPath,
  getRemotionJobAudioBasename,
  getRemotionPublicAudioPath,
} from "./job-paths";

async function probeDurationSec(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) reject(err);
      else resolve(data.format.duration ?? 0);
    });
  });
}

function toUserFacingJobError(err: unknown): string {
  if (err instanceof PlannerError) return err.message;
  if (err instanceof Error) {
    const raw = err.message;
    if (raw.includes("Built-in music") || raw.includes("Built-in track")) return raw;
    if (/ENOENT|no such file/i.test(raw)) {
      return "A required file was missing. Try the default track or upload again.";
    }
    if (raw.includes("exceeds max duration")) return raw;
    if (raw.includes("Upload")) return raw;
  }
  if (/ffmpeg|ffprobe/i.test(String(err))) {
    return "Audio processing failed. Try a different file or the built-in track.";
  }
  return "We couldn’t finish your video. Please try again.";
}

function updateJob(
  jobId: string,
  patch: Partial<typeof jobs.$inferInsert>,
): void {
  const db = getDb();
  db.update(jobs)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(jobs.id, jobId))
    .run();
}

export async function processJob(jobId: string): Promise<void> {
  const env = getEnv();
  const db = getDb();
  const row = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
  if (!row) throw new Error("Job not found.");

  try {
    await mkdir(getJobDir(jobId), { recursive: true });
    await mkdir(getJobInputAudioDir(jobId), { recursive: true });
    await mkdir(path.dirname(getRemotionPublicAudioPath(jobId)), {
      recursive: true,
    });

    updateJob(jobId, { step: "resolving_audio" });

    const jobInputAudioDir = getJobInputAudioDir(jobId);

    let inputExt = ".mp3";
    let sourceAbsolutePath = "";

    if (row.musicMode === "builtin") {
      const trackId = row.builtinTrackId ?? "default";
      sourceAbsolutePath = getBuiltinMusicFilePath(trackId);
      if (!existsSync(sourceAbsolutePath)) {
        throw new Error(
          "Built-in music isn’t available. Add public/builtin-music/default.mp3 or upload your own audio.",
        );
      }
      inputExt = path.extname(sourceAbsolutePath).toLowerCase() || ".mp3";
    } else if (row.musicMode === "upload") {
      if (!row.uploadStoragePath)
        throw new Error("Something went wrong with your upload. Please try again.");
      sourceAbsolutePath = row.uploadStoragePath;
      if (!existsSync(sourceAbsolutePath))
        throw new Error("Uploaded file expired or was removed. Upload again.");
      inputExt = path.extname(sourceAbsolutePath).toLowerCase() || ".mp3";
    } else {
      throw new Error("Invalid music configuration.");
    }

    const finalInputPath = path.join(jobInputAudioDir, `input${inputExt}`);
    await copyFile(sourceAbsolutePath, finalInputPath);

    updateJob(jobId, { step: "normalizing_audio" });

    const duration = await probeDurationSec(finalInputPath);
    if (duration > env.MAX_MUSIC_DURATION_SEC) {
      throw new Error(
        `Music exceeds max duration (${env.MAX_MUSIC_DURATION_SEC}s).`,
      );
    }

    const normalizedPath = getJobNormalizedAudioPath(jobId);
    await normalizeMusicToAac({
      inputPath: finalInputPath,
      outputPath: normalizedPath,
    });

    updateJob(jobId, { step: "copying_audio" });

    await copyFile(normalizedPath, getRemotionPublicAudioPath(jobId));

    updateJob(jobId, { step: "planning" });

    const templateId = row.templateId as VideoTemplate["id"];
    const template = getTemplateById(templateId);

    const slidePlan: SlidePlan = await planPost({
      openaiApiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      templateId,
      postText: row.postText,
    });

    updateJob(jobId, { slidePlanJson: JSON.stringify(slidePlan) });

    updateJob(jobId, { step: "rendering" });

    const theme = getThemeById(row.themeId as ThemePack["id"]);
    const outputLocation = getJobOutputVideoPath(jobId);
    await mkdir(path.dirname(outputLocation), { recursive: true });

    await renderLinkedInPostVideo({
      remotionEntry: resolveDefaultRemotionEntry(),
      outputLocation,
      slidePlan,
      slideDurationsSec: template.slideDurationsSec,
      theme,
      aspectRatioId: row.aspectRatio as AspectRatioId,
      audioSrc: getRemotionJobAudioBasename(jobId),
    });

    const now = Date.now();
    updateJob(jobId, {
      step: "complete",
      status: "complete",
      outputVideoPath: outputLocation,
      errorMessage: null,
      deleteAfter: now + env.JOB_RETENTION_MS,
    });
  } catch (err) {
    let msg =
      err instanceof PlannerError ? err.message : toUserFacingJobError(err);

    msg = msg.slice(0, 2048);

    updateJob(jobId, {
      status: "failed",
      step: "failed",
      errorMessage: msg,
      deleteAfter: Date.now() + env.JOB_RETENTION_MS,
    });
  }
}
