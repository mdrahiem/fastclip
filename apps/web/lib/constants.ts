// apps/web/lib/constants.ts

export const JOB_STATUS = {
  QUEUED: "queued",
  RENDERING: "rendering",
  COMPLETE: "complete",
  FAILED: "failed",
} as const;

export const JOB_STEPS = {
  QUEUED: "queued",
  RENDERING: "rendering",
  COMPLETE: "complete",
  FAILED: "failed",
} as const;

export const ASPECT_RATIOS = {
  PORTRAIT: "9:16",
  LANDSCAPE: "16:9",
} as const;

export const POLLING_INTERVAL_MS = 500;

export const SESSION_COOKIE_NAME = "sessionId";

export const VIDEO_DURATION_SEC = 15;

export const ANIMATION_DELAY_PER_TITLE_SEC = 0.8;
