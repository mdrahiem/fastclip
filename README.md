# video-gen

Monorepo for turning LinkedIn-style posts into short Remotion-rendered videos: a Next.js app (`@video-gen/web`) accepts jobs, stores them in SQLite, and a background worker runs FFmpeg normalization plus Remotion renders.

## Prerequisites

- **Node.js** 22+
- **pnpm** 9 (repo pins `packageManager` in the root `package.json`; enable via Corepack: `corepack enable`)
- **FFmpeg** and **ffprobe** on your PATH for local renders (the worker shells out to FFmpeg; macOS often uses Homebrew: `brew install ffmpeg`)

## Configuration

Copy [`.env.example`](./.env.example) to **`.env` in the repo root** (next to `pnpm-workspace.yaml`). Next.js and the job worker both load that file, so you don’t need a separate `apps/web/.env` unless you want overrides in `apps/web/.env.local`.

- **LLM** — one of:
  - **`OPENROUTER_API_KEY`** — your [OpenRouter](https://openrouter.ai/) key (uses `OPENROUTER_BASE_URL`, default `https://openrouter.ai/api/v1`). Set **`OPENAI_MODEL`** to an OpenRouter model id (e.g. `openai/gpt-4o-mini`).
  - **`OPENAI_API_KEY`** — only if you use OpenAI directly (leave `OPENROUTER_API_KEY` unset). Then **`OPENAI_MODEL`** is an OpenAI model id (e.g. `gpt-4o-mini`).
- **`SESSION_SECRET`** — at least 32 characters; signs session cookies for job APIs.
- **`DATABASE_URL`** — SQLite file for jobs. Default `file:./data/app.db` is resolved against the **repo root** (next to `pnpm-workspace.yaml`), so the web app and worker always use the same file even if `process.cwd()` differs. Job media and outputs live under **`data/jobs/`** on the repo root too.

## Local development

Install dependencies:

```bash
pnpm install
```

Run the web app (terminal 1). **`pnpm dev` runs `db:migrate` first**, so the `jobs` table exists before you hit the API.

```bash
pnpm dev
```

Run the job worker (terminal 2; uses the same repo-root `.env`):

```bash
pnpm --filter @video-gen/web worker
```

The worker polls SQLite for queued jobs and should stay running while you exercise the UI.

**Migrations only (e.g. production `next start`, or if you skip `pnpm dev`):**

```bash
pnpm --filter @video-gen/web db:migrate
```

The SQLite file defaults to **`data/app.db`** at the repo root. If you previously used **`apps/web/data/`**, copy `app.db` to **`data/app.db`** at the repo root (or delete and migrate fresh).

## Docker

Build (optional build-args override dummy values used only during `next build`):

```bash
docker build \
  --build-arg BUILD_OPENROUTER_API_KEY=dummy-openrouter-key-for-image-build \
  --build-arg BUILD_SESSION_SECRET=docker-build-dummy-session-secret-32chars-min \
  -t video-gen .
```

Run (supply real secrets and DB path as needed):

```bash
docker run --rm -p 3000:3000 \
  -e OPENROUTER_API_KEY="your-openrouter-key" \
  -e SESSION_SECRET="your-secret-at-least-32-chars-long" \
  -e DATABASE_URL="file:./data/app.db" \
  video-gen
```

(Or use `-e OPENAI_API_KEY=...` instead of OpenRouter if you use OpenAI directly.)

The container starts the worker in the background, then serves Next.js on `0.0.0.0:3000`. Persist `data/` with a volume if you want SQLite to survive restarts.

## Built-in audio

See [LICENSE-ASSETS.md](./LICENSE-ASSETS.md) for the bundled silent `default.mp3` placeholder.
