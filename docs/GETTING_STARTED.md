# Getting Started

## 1. Prerequisites

Ensure you have installed:

- **Node.js** 20+ — [Download](https://nodejs.org/)
- **pnpm** 9 — Install via Corepack: `corepack enable pnpm`
- **HyperFrames** — `npm install -g hyperframes` (requires Chrome/ Chromium)
- **FFmpeg** — Used by HyperFrames internally for video encoding

## 2. Project Setup

```bash
# Clone repo
git clone <repo-url>
cd video-gen

# Install dependencies (this runs in all workspaces)
pnpm install

# Verify pnpm workspaces
pnpm list --depth 0
```

Expected output should show:
```
@video-gen/web
@video-gen/contracts
@video-gen/hyperframes-render
```

## 3. Environment Configuration

```bash
# Copy template
cp .env.example .env

# Edit .env and set:
# - SESSION_SECRET to a random 32+ character string
# - Other values as needed (defaults are fine for local dev)
```

Example `.env`:
```bash
DATABASE_URL=file:./data/app.db
SESSION_SECRET=your-random-secret-key-here-minimum-32-characters-long
JOB_RETENTION_MS=3600000
RATE_LIMIT_JOBS_PER_HOUR=10
HYPERFRAMES_CLI_PATH=hyperframes
PUBLIC_MUSIC_PATH=./public/music/default.mp3
```

## 4. Database Setup

```bash
# Run migrations (creates SQLite file and tables)
pnpm db:migrate

# (Optional) Open database viewer
pnpm db:studio
# This opens Prisma Studio at http://localhost:5555
```

## 5. Add Default Music

The worker requires a music file to mux into the rendered video:

```bash
# Option A: Generate a 15-second silent placeholder
ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 15 -q:a 9 -acodec libmp3lame apps/web/public/music/default.mp3

# Option B: Copy your own royalty-free MP3
# Place it at: apps/web/public/music/default.mp3
```

## 6. Start Development

You need **two terminals** running simultaneously:

**Terminal 1 — Web Server:**
```bash
pnpm dev
# Runs Vite dev server with API middleware
# Watching for changes, HMR enabled
# Open http://localhost:5173
```

**Terminal 2 — Background Worker:**
```bash
pnpm worker
# Polls database for queued jobs every 2 seconds
# Renders videos via HyperFrames CLI
# Must stay running for videos to process
```

## 7. Create Your First Video

1. Open http://localhost:5173 in browser
2. Enter 4 job titles (e.g., "Senior Engineer", "Product Manager", etc.)
3. Select aspect ratio (Portrait 9:16 or Landscape 16:9)
4. Click **Generate Video**
5. Watch status on the dashboard page (auto-refreshes every 500ms)
6. Once complete, the video appears with:
   - Inline player (preview)
   - **Download MP4** button
   - **Edit & Re-render** button (modify titles and generate a new version)

## 8. Project Architecture Overview

```
User → Browser → Vite Dev Server → API Handler → SQLite (Prisma)
                                          ↓
                                    Background Worker
                                          ↓
                                    HyperFrames CLI → MP4
```

**Request Flow:**
1. User submits form → `POST /api/jobs`
2. API handler creates job row with `status = "queued"`
3. Worker picks up queued job → `status = "rendering"`
4. Worker calls HyperFrames CLI to render HTML → MP4
5. Worker updates job → `status = "complete"`, sets `outputVideoPath`
6. Frontend polls `GET /api/jobs/:jobId/status` every 500ms
7. On complete, frontend fetches full job details and shows video player

## 9. Key Files to Know

| File | Purpose |
|------|---------|
| `apps/web/app/routes/index.tsx` | Home page with job form |
| `apps/web/app/routes/dashboard/$jobId.tsx` | Dashboard with status + player |
| `apps/web/app/routes/edit/$jobId.tsx` | Edit & re-render page |
| `apps/web/server/api-handler.ts` | REST API request handler |
| `apps/web/server/worker.ts` | Background job processor |
| `apps/web/server/db.ts` | Prisma client singleton |
| `apps/web/server/session.ts` | Session cookie signing |
| `apps/web/server/rate-limit.ts` | Rate limiting logic |
| `packages/hyperframes-render/src/render-we-are-hiring.ts` | Video rendering logic |
| `prisma/schema.prisma` | Database schema |

## 10. Troubleshooting

### "Database table not found" error
```bash
pnpm db:migrate
# Ensure migrations ran; check data/app.db exists
```

### "HyperFrames command not found"
```bash
npm install -g hyperframes
# Or update HYPERFRAMES_CLI_PATH in .env to full path
# Example: HYPERFRAMES_CLI_PATH=/usr/local/bin/hyperframes
```

### Worker not picking up jobs
```bash
# Make sure worker process is running (Terminal 2)
# Check console output:
# "Starting background worker..."
# "Processing job {jobId}..."
```

### Port 5173 already in use
```bash
# Kill process on port 5173:
lsof -ti:5173 | xargs kill -9
# Or set a different port in vite.config.ts
```

### Video shows "Video not ready for download"
- Check that the worker is running
- Check `data/jobs/{jobId}/` for `output.mp4`
- Check worker console for render errors
- Ensure the music file exists at `apps/web/public/music/default.mp3`

## 11. Common Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start frontend dev server |
| `pnpm worker` | Start background worker |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio UI |
| `pnpm db:generate` | Regenerate Prisma client |

## 12. Next Steps

- **Read API docs**: `docs/API.md`
- **Read design doc**: `docs/designs/2025-05-09-we-are-hiring-video-gen-v2.md`
- **Explore components**: Browse `apps/web/lib/components/`
- **Test worker**: Monitor `data/jobs/` for output videos
- **Add a template**: Copy `packages/hyperframes-render/src/compositions/we-are-hiring.html` and customize
