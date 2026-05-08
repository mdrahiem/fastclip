import { z } from "zod";

const EnvSchema = z
  .object({
    /** OpenRouter (OpenAI-compatible). If set, requests go to `OPENROUTER_BASE_URL`. */
    OPENROUTER_API_KEY: z
      .string()
      .optional()
      .transform((s) => (s?.trim() ? s.trim() : undefined)),
    OPENROUTER_BASE_URL: z
      .string()
      .url()
      .default("https://openrouter.ai/api/v1"),
    /** Optional headers OpenRouter recommends for rankings. */
    OPENROUTER_HTTP_REFERER: z.string().optional(),
    OPENROUTER_APP_NAME: z.string().optional(),
    /** Direct OpenAI (`api.openai.com`). Used when `OPENROUTER_API_KEY` is not set. */
    OPENAI_API_KEY: z
      .string()
      .optional()
      .transform((s) => (s?.trim() ? s.trim() : undefined)),
    /**
     * Model id for the configured provider. Examples:
     * - OpenRouter: `openai/gpt-4o-mini`, `anthropic/claude-3.5-haiku`
     * - OpenAI: `gpt-4o-mini`
     */
    OPENAI_MODEL: z.string().min(1).default("openai/gpt-4o-mini"),
    SESSION_SECRET: z.string().min(32),
    JOB_RETENTION_MS: z.coerce.number().int().positive().default(3_600_000),
    MAX_POST_CHARS: z.coerce.number().int().positive().default(10_000),
    MAX_MUSIC_BYTES: z.coerce.number().int().positive().default(15_728_640),
    MAX_MUSIC_DURATION_SEC: z.coerce.number().int().positive().default(120),
    /**
     * SQLite database for job rows. Use `file:` URL or a filesystem path.
     * Relative paths resolve from **current working directory** (usually `apps/web`
     * when you run `pnpm dev` / `pnpm worker`).
     */
    DATABASE_URL: z.string().min(1).default("file:./data/app.db"),
  })
  .superRefine((data, ctx) => {
    if (!data.OPENROUTER_API_KEY && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Set OPENROUTER_API_KEY or OPENAI_API_KEY (at least one is required).",
        path: ["OPENROUTER_API_KEY"],
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export type LlmConfig = {
  apiKey: string;
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  model: string;
};

/** Resolves which LLM endpoint and key the app uses (OpenRouter vs OpenAI). */
export function getLlmConfig(env: Env): LlmConfig {
  if (env.OPENROUTER_API_KEY) {
    const defaultHeaders: Record<string, string> = {};
    if (env.OPENROUTER_HTTP_REFERER) {
      defaultHeaders["HTTP-Referer"] = env.OPENROUTER_HTTP_REFERER;
    }
    if (env.OPENROUTER_APP_NAME) {
      defaultHeaders["X-Title"] = env.OPENROUTER_APP_NAME;
    }
    return {
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: env.OPENROUTER_BASE_URL,
      model: env.OPENAI_MODEL,
      defaultHeaders:
        Object.keys(defaultHeaders).length > 0 ? defaultHeaders : undefined,
    };
  }
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  };
}

export function getEnv(): Env {
  return EnvSchema.parse(process.env);
}
