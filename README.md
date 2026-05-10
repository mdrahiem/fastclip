# We Are Hiring - Video Generator

A web application for generating professional 15-second recruitment videos from simple text inputs. Users enter job titles, select an aspect ratio, and the system renders an animated MP4 video using HyperFrames (HTML/CSS → MP4 pipeline).

## Tech Stack

- **Frontend**: Vite + TanStack Router + React 18
- **Backend**: Node.js + Express-compatible REST API handler
- **Database**: SQLite + Prisma ORM
- **Rendering**: HyperFrames CLI (HTML/CSS/JS → MP4)
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod
- **Monorepo**: pnpm workspaces

## Features

- Simple job form (4 titles + aspect ratio)
- Background job processing with polling
- Real-time video rendering via HyperFrames
- In-browser video preview & download
- Edit & re-render in-app (modify titles and regenerate)
- Session-based user isolation
- Rate limiting (10 jobs/hour per session)
- Automatic job cleanup (1 hour retention)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9
- HyperFrames CLI (`npm install -g hyperframes`)
- FFmpeg (used internally by HyperFrames)

### Setup

```bash
# Clone and enter repo
git clone <repo>
cd video-gen

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Set SESSION_SECRET to a 32+ character random string
# Update other env vars as needed

# Run database migrations
pnpm db:migrate

# Add default music file (15s track)
# Option A: Generate silence placeholder
ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 15 -q:a 9 -acodec libmp3lame apps/web/public/music/default.mp3
# Option B: Place your own MP3 at apps/web/public/music/default.mp3

# Start development server (Terminal 1)
pnpm dev

# Start background worker (Terminal 2)
pnpm worker
```

Visit http://localhost:5173 in your browser.

### Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start frontend dev server |
| `pnpm worker` | Start background job processor |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio (database UI) |
| `pnpm db:generate` | Generate Prisma client |

### Production Deployment

```bash
# Build
pnpm build

# Start server (Terminal 1)
pnpm start

# Start worker (Terminal 2)
pnpm worker
```

Ensure `.env` is set with production values and `data/` directory persists across restarts.

## Project Structure

```
video-gen/
├── apps/web/                    # Main web application
│   ├── app/
│   │   ├── routes/              # React Router pages
│   │   │   ├── index.tsx        # Home: job form
│   │   │   ├── dashboard/
│   │   │   │   └── $jobId.tsx  # Dashboard: status + player
│   │   │   └── edit/
│   │   │       └── $jobId.tsx  # Edit page: modify & re-render
│   │   ├── App.tsx              # Root layout + router setup
│   │   ├── client.ts            # React entry point
│   │   ├── server.ts            # TanStack Start server entry
│   │   └── index.css            # Global styles
│   ├── server/
│   │   ├── api-handler.ts       # REST API request handler
│   │   ├── rpc/
│   │   │   └── jobs.ts          # Job service functions (unused)
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── env.ts               # Environment validation
│   │   ├── session.ts           # Session cookie signing
│   │   ├── rate-limit.ts        # Rate limit logic
│   │   ├── worker.ts            # Background worker
│   │   └── worker-entry.ts      # Worker bootstrap
│   ├── lib/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   └── constants.ts         # App constants
│   ├── public/
│   │   └── music/
│   │       └── default.mp3      # Default audio track
│   └── vite.config.ts           # Vite + API middleware config
│
├── packages/
│   ├── contracts/               # Shared types & Zod schemas
│   └── hyperframes-render/      # HyperFrames rendering wrapper
│
├── prisma/
│   └── schema.prisma            # Database schema
│
├── data/                        # SQLite DB + job outputs (gitignored)
│   ├── app.db
│   └── jobs/{jobId}/output.mp4
│
└── docs/                        # Documentation
    ├── designs/
    ├── API.md
    └── GETTING_STARTED.md
```

## Architecture

1. **Frontend**: React routes (home, dashboard, edit) with TanStack Router
2. **API**: REST endpoints handled by `api-handler.ts` via Vite dev middleware
3. **Database**: SQLite with Prisma ORM
4. **Worker**: Background process polling for queued jobs every 2 seconds
5. **Rendering**: HyperFrames generates HTML composition → MP4
6. **Storage**: Videos stored in `data/jobs/{jobId}/output.mp4`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=file:./data/app.db

# Sessions & Security (required, min 32 chars)
SESSION_SECRET=change-me-min-32-chars-please-change-me-now

# Job Configuration
JOB_RETENTION_MS=3600000              # 1 hour
MAX_JOB_TITLES_LENGTH=100             # Per title
RATE_LIMIT_JOBS_PER_HOUR=10

# HyperFrames
HYPERFRAMES_CLI_PATH=hyperframes

# Default Music
PUBLIC_MUSIC_PATH=./public/music/default.mp3
```

## API Overview

See [`docs/API.md`](./docs/API.md) for full endpoint documentation.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create a new video job |
| GET | `/api/jobs/:jobId` | Get job details |
| PATCH | `/api/jobs/:jobId` | Update job (creates new job) |
| GET | `/api/jobs/:jobId/status` | Poll job status |
| GET | `/api/jobs/:jobId/download` | Download/stream MP4 |

## Roadmap

- [ ] Multiple video templates (Product Launch, Event Promo, etc.)
- [ ] Template selector on home page
- [ ] User authentication
- [ ] Music selection
- [ ] Color/font customization
- [ ] Analytics & download tracking
- [ ] Parallel rendering (multiple workers)

## Troubleshooting

- **HyperFrames not found**: Install globally: `npm install -g hyperframes`
- **Database locked**: Ensure only one worker process is running
- **Videos not rendering**: Check `data/jobs/{jobId}/` for error logs
- **Session issues**: Clear cookies and refresh browser

## License

MIT
