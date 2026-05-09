# We Are Hiring - Video Generator v2

A modern web application for generating professional 15-second recruitment videos. Users enter 4 job titles, and the system renders an animated video with Hyperframes.

## Tech Stack

- **Frontend**: Vite + TanStack Start + React 18 + React Router 7
- **Backend**: Node.js + TanStack Start (RPC)
- **Database**: SQLite + Prisma ORM
- **Rendering**: Hyperframes (HTML/CSS → MP4)
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod
- **Monorepo**: pnpm workspaces

## Features

- ✅ Simple job form (4 titles + aspect ratio)
- ✅ Background job processing with polling
- ✅ Real-time video rendering via Hyperframes
- ✅ In-browser video preview & download
- ✅ Edit & re-render in-app (no external tools)
- ✅ Session-based user isolation
- ✅ Rate limiting (10 jobs/hour per session)
- ✅ Automatic job cleanup (1 hour retention)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9
- Hyperframes CLI (install globally or locally)

### Setup

```bash
# Clone and enter repo
git clone <repo>
cd video-gen-v2

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Set SESSION_SECRET to a 32+ character random string
# Update other env vars as needed

# Run database migrations
pnpm db:migrate

# Start development server (Terminal 1)
pnpm dev

# Start background worker (Terminal 2)
pnpm worker
```

Visit http://localhost:5173 in your browser.

### Development Commands

- `pnpm dev` — Start frontend dev server
- `pnpm worker` — Start background job processor
- `pnpm build` — Build for production
- `pnpm db:migrate` — Run Prisma migrations
- `pnpm db:studio` — Open Prisma Studio (browse database)
- `pnpm db:generate` — Generate Prisma client

### Production Deployment

```bash
# Build
pnpm build

# Start server
pnpm start

# In another process, start worker
pnpm worker
```

Ensure `.env` is set with production values and `data/` directory persists across restarts.

## Project Structure

- `apps/web/` — TanStack Start app (frontend + backend)
- `packages/contracts/` — Shared types & validation
- `packages/hyperframes-render/` — Hyperframes rendering wrapper
- `prisma/` — Database schema & migrations
- `data/` — SQLite database & job outputs (gitignored)

## Architecture

1. **Frontend**: React routes (home, dashboard, edit)
2. **RPC**: Type-safe server functions for job CRUD
3. **Database**: SQLite with Prisma ORM
4. **Worker**: Background process polling for queued jobs
5. **Rendering**: Hyperframes generates HTML → MP4
6. **Storage**: Videos stored in `data/jobs/{jobId}/`

## Troubleshooting

- **Hyperframes not found**: Install globally: `npm install -g hyperframes`
- **Database locked**: Ensure only one worker process is running
- **Videos not rendering**: Check `data/jobs/{jobId}/` for error logs
- **Session issues**: Clear cookies and refresh browser

## Roadmap (Phase 2+)

- [ ] User authentication
- [ ] Music selection & downloads
- [ ] Color/font customization
- [ ] Multiple templates
- [ ] Analytics & downloads tracking
- [ ] Parallel rendering (multiple workers)
- [ ] Video trimming UI

## License

MIT
