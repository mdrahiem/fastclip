import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  SESSION_SECRET: z.string().min(32),
  JOB_RETENTION_MS: z.coerce.number().int().positive().default(3_600_000),
  MAX_POST_CHARS: z.coerce.number().int().positive().default(10_000),
  MAX_MUSIC_BYTES: z.coerce.number().int().positive().default(15_728_640),
  MAX_MUSIC_DURATION_SEC: z.coerce.number().int().positive().default(120),
  DATABASE_URL: z.string().min(1).default("file:./data/app.db"),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  return EnvSchema.parse(process.env);
}
