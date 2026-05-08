import path from "node:path";
import { getMonorepoRoot, getWebAppRoot } from "../repo-paths";

export function getJobDataRoot(): string {
  return path.join(getMonorepoRoot(), "data", "jobs");
}

export function getJobDir(jobId: string): string {
  return path.join(getJobDataRoot(), jobId);
}

/** Per spec: folder name includes a space (`input audio`). */
export function getJobInputAudioDir(jobId: string): string {
  return path.join(getJobDir(jobId), "input audio");
}

export function getJobNormalizedAudioPath(jobId: string): string {
  return path.join(getJobDir(jobId), "audio.m4a");
}

export function getJobOutputVideoPath(jobId: string): string {
  return path.join(getJobDir(jobId), "output.mp4");
}

export function getRemotionJobAudioBasename(jobId: string): string {
  return `job-${jobId}.m4a`;
}

export function getRemotionPublicAudioPath(jobId: string): string {
  return path.join(
    getMonorepoRoot(),
    "remotion",
    "public",
    getRemotionJobAudioBasename(jobId),
  );
}

export function getBuiltinMusicFilePath(trackId: string): string {
  return path.join(
    getWebAppRoot(),
    "public",
    "builtin-music",
    `${trackId}.mp3`,
  );
}
