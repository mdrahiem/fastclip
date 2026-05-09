// apps/web/server/env.ts

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./data/app.db"),
  SESSION_SECRET: z.string().min(32),
  JOB_RETENTION_MS: z.coerce.number().default(3600000),
  MAX_JOB_TITLES_LENGTH: z.coerce.number().default(100),
  RATE_LIMIT_JOBS_PER_HOUR: z.coerce.number().default(10),
  HYPERFRAMES_CLI_PATH: z.string().default("hyperframes"),
  PUBLIC_MUSIC_PATH: z.string().default("./public/music/default.mp3"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

let cachedEnv: ReturnType<typeof envSchema.parse> | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten());
    throw new Error("Invalid environment variables");
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export type Env = ReturnType<typeof getEnv>;
