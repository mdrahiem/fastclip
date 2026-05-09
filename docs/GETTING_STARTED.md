# Getting Started with We Are Hiring Video Generator

## 1. Prerequisites

Ensure you have installed:

- **Node.js** 20+ — [Download](https://nodejs.org/)
- **pnpm** 9 — Install via Corepack: `corepack enable pnpm`
- **Hyperframes** — `npm install -g hyperframes` (or check docs/HYPERFRAMES_SETUP.md)
- **FFmpeg** — Used by Hyperframes internally

## 2. Project Setup

```bash
# Clone repo
git clone <repo-url>
cd video-gen-v2

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

## 5. Start Development

**Terminal 1 — Web Server:**
```bash
pnpm dev
# Runs TanStack Start dev server
# Watching for changes, HMR enabled
# Open http://localhost:5173
```

**Terminal 2 — Background Worker:**
```bash
pnpm worker
# Polls database for queued jobs
# Renders videos via Hyperframes
# Must stay running for videos to process
```

## 6. Create Your First Video

1. Open http://localhost:5173 in browser
2. Enter 4 job titles (e.g., "Senior Engineer", "Product Manager", etc.)
3. Select aspect ratio (Portrait or Landscape)
4. Click "Generate Video"
5. Watch status on dashboard (refreshes every 500ms)
6. Once complete, video appears with download & edit buttons

## 7. Troubleshooting

### "Database table not found" error
```bash
pnpm db:migrate
# Ensure migrations ran; check data/app.db exists
```

### "Hyperframes command not found"
```bash
npm install -g hyperframes
# Or update HYPERFRAMES_CLI_PATH in .env to full path
```

### Worker not picking up jobs
```bash
# Make sure worker process is running (Terminal 2)
# Check it's polling:
# "Polling database every 2 seconds..."
```

### Port 5173 already in use
```bash
# Kill process on port 5173:
lsof -ti:5173 | xargs kill -9
# Or use different port via Vite config
```

## 8. Key Files to Know

- `apps/web/app/routes/` — Frontend pages
- `apps/web/server/rpc/jobs.ts` — Job API endpoints
- `apps/web/server/worker.ts` — Background worker
- `packages/hyperframes-render/` — Video rendering logic
- `prisma/schema.prisma` — Database schema

## 9. Next Steps

- **Read design doc**: `docs/designs/2025-05-09-we-are-hiring-video-gen-v2.md`
- **Check API docs**: `docs/API.md` (to be created)
- **Explore components**: Browse `apps/web/lib/components/`
- **Test worker**: Monitor `data/jobs/` for output videos

## 10. Common Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start frontend dev server |
| `pnpm worker` | Start background worker |
| `pnpm build` | Build for production |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio UI |
| `pnpm db:generate` | Regenerate Prisma client |
