# video-gen

Monorepo for turning LinkedIn-style posts into short Remotion-rendered videos: a Next.js app (`@video-gen/web`) accepts jobs, stores them in SQLite, and a background worker runs FFmpeg normalization plus Remotion renders.

## Prerequisites

- **Node.js** 22+
- **pnpm** 9 (repo pins `packageManager` in the root `package.json`; enable via Corepack: `corepack enable`)
- **FFmpeg** and **ffprobe** on your PATH for local renders (the worker shells out to FFmpeg; macOS often uses Homebrew: `brew install ffmpeg`)

## Configuration

Copy `.env.example` to `.env` and set at least:

- `OPENAI_API_KEY` — required for planning slides from post text
- `SESSION_SECRET` — at least 32 characters; signs session cookies for job APIs
- `DATABASE_URL` — defaults to `file:./data/app.db` under `apps/web` when using the web app from that package

## Local development

Install dependencies:

```bash
pnpm install
```

Apply database migrations (from repo root):

```bash
pnpm --filter @video-gen/web db:migrate
```

Run the web app (terminal 1):

```bash
pnpm dev
```

Run the job worker (terminal 2; same env as `.env` in `apps/web`):

```bash
pnpm --filter @video-gen/web worker
```

The worker polls SQLite for queued jobs and should stay running while you exercise the UI.

## Docker

Build (optional build-args override dummy values used only during `next build`):

```bash
docker build \
  --build-arg BUILD_OPENAI_API_KEY=dummy-openai-key-for-image-build \
  --build-arg BUILD_SESSION_SECRET=docker-build-dummy-session-secret-32chars-min \
  -t video-gen .
```

Run (supply real secrets and DB path as needed):

```bash
docker run --rm -p 3000:3000 \
  -e OPENAI_API_KEY="your-key" \
  -e SESSION_SECRET="your-secret-at-least-32-chars-long" \
  -e DATABASE_URL="file:./data/app.db" \
  video-gen
```

The container starts the worker in the background, then serves Next.js on `0.0.0.0:3000`. Persist `data/` with a volume if you want SQLite to survive restarts.

## Built-in audio

See [LICENSE-ASSETS.md](./LICENSE-ASSETS.md) for the bundled silent `default.mp3` placeholder.
