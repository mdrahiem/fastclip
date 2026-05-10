# We Are Hiring Video Generator v2 - Design Document

**Date:** May 9, 2025  
**Last Updated:** May 10, 2025  
**Status:** Approved  
**Tech Stack:** Vite + TanStack Router + React 18 + SQLite + Prisma + HyperFrames  
**Scope:** We Are Hiring template only, simple UX, no customizations (Phase 1)

---

## Overview

A web-based video generation platform where users create 15-second "We Are Hiring" videos by entering 4 job titles. Videos are rendered via HyperFrames (HTML/CSS/JS → MP4), stored in SQLite, and processed by a background worker. Users can edit titles in-browser and re-render without leaving the app.

**Target User:** Companies, recruiters, and hiring managers creating job announcement videos for social media (LinkedIn, Instagram, etc.).

**Core Value Prop:** Quick, simple, no-setup video generation. Enter 4 titles → select aspect ratio → get a polished MP4 → download or edit & re-render.

---

## Functional Requirements

### 1. Home Page (Route: `/`)

**Form Input:**
- 4 job title text inputs (required, max 100 chars each)
- Aspect ratio selector: Portrait (9:16) or Landscape (16:9)
- **Generate Video** button

**Validation:**
- All 4 titles must be non-empty
- Max length per title: 100 characters
- Real-time error feedback via React Hook Form + Zod

**On Submit:**
- `POST /api/jobs` with `{ jobTitles, aspectRatio }`
- Navigate to `/dashboard/{jobId}`
- Show loading state during redirect

### 2. Dashboard Page (Route: `/dashboard/$jobId`)

**Status Display (Real-time Polling):**
- Poll job status every 500ms via `GET /api/jobs/{jobId}/status`
- Show status badge: "Queued" → "Rendering" → "Complete" or "Failed"
- Show step text for detailed progress
- Show error message if job failed

**After Job Completes:**
- Inline MP4 video player with native controls
- **Download MP4** button (direct file download via `?dl=1`)
- **Edit & Re-render** button → navigates to `/edit/{jobId}`

**Failed State:**
- Display error message from worker
- **Edit & Try Again** button → navigates to `/edit/{jobId}`

### 3. Edit Page (Route: `/edit/$jobId`)

**Form:**
- 4 job title inputs pre-filled with original values
- Aspect ratio selector (pre-filled)
- **Re-render Video** button
- **Cancel** button → back to `/dashboard/{jobId}`

**On Re-render:**
- `PATCH /api/jobs/{jobId}` with updated `{ jobTitles, aspectRatio }`
- Creates a **new job** (new `jobId`) — edits are immutable
- Navigate to new dashboard: `/dashboard/{newJobId}`
- Status polling begins automatically

### 4. Session Management

**Session Cookie:**
- Signed JWT using `jose` (HS256)
- 30-day expiration
- HTTPOnly, SameSite=Lax
- Cookie name: `session`

**User Isolation:**
- Each API request validates session from cookie
- Users can only access their own jobs
- All database queries filtered by `sessionId`

### 5. Rate Limiting

- **Limit:** 10 jobs per session per hour
- **Check:** On `POST /api/jobs` and `PATCH /api/jobs/:jobId`
- **Violation:** HTTP 429, message: "Rate limit exceeded. Maximum 10 jobs per hour."
- **Implementation:** In-memory `Map` with hourly buckets

---

## Technical Architecture

### Project Structure

```
video-gen/
├── apps/web/                              # Main web application
│   ├── app/
│   │   ├── routes/
│   │   │   ├── index.tsx                  # Home: job form
│   │   │   ├── dashboard/
│   │   │   │   └── $jobId.tsx            # Dashboard: status + player + edit
│   │   │   └── edit/
│   │   │       └── $jobId.tsx            # Edit page: modify + re-render
│   │   ├── App.tsx                        # Root layout + TanStack Router
│   │   ├── client.ts                      # React DOM entry
│   │   ├── server.ts                      # TanStack Start server entry
│   │   └── index.css                      # Global styles + Tailwind
│   ├── server/
│   │   ├── api-handler.ts                 # REST API request handler
│   │   ├── rpc/
│   │   │   └── jobs.ts                    # Job service functions (unused)
│   │   ├── db.ts                          # Prisma client singleton
│   │   ├── env.ts                         # Environment + Zod validation
│   │   ├── session.ts                     # Session cookie signing/verification
│   │   ├── rate-limit.ts                  # Rate limit check
│   │   ├── worker.ts                      # Background job processor
│   │   └── worker-entry.ts                # Worker bootstrap
│   ├── lib/
│   │   ├── hooks/
│   │   │   └── useJobPolling.ts           # Custom hook: poll every 500ms
│   │   ├── components/
│   │   │   ├── JobForm.tsx                # Home form component
│   │   │   ├── JobStatus.tsx              # Status display
│   │   │   ├── VideoPlayer.tsx            # MP4 player + download
│   │   │   └── EditForm.tsx               # Edit page form
│   │   └── constants.ts                   # App constants
│   ├── public/
│   │   └── music/
│   │       └── default.mp3                # Default audio track (15s)
│   ├── vite.config.ts                     # Vite + API middleware
│   └── package.json
│
├── packages/
│   ├── contracts/                         # Shared types & Zod schemas
│   │   ├── src/
│   │   │   ├── job-schema.ts              # Zod validation schemas
│   │   │   └── index.ts                   # Re-exports
│   │   └── package.json
│   │
│   └── hyperframes-render/                # HyperFrames rendering wrapper
│       ├── src/
│       │   ├── compositions/
│       │   │   └── we-are-hiring.html     # HTML composition template
│       │   ├── render-we-are-hiring.ts    # Main render function
│       │   └── index.ts                   # Re-exports
│       └── package.json
│
├── prisma/
│   ├── schema.prisma                      # Database schema
│   └── migrations/                        # Auto-generated by Prisma
│
├── data/                                  # SQLite DB + job outputs (gitignored)
│   ├── app.db                             # SQLite database
│   └── jobs/{jobId}/
│       └── output.mp4                     # Rendered video
│
├── docs/                                  # Documentation
│   ├── designs/
│   │   └── 2025-05-09-we-are-hiring-video-gen-v2.md
│   ├── API.md
│   └── GETTING_STARTED.md
│
├── .env.example
├── .env                                   # Local secrets (gitignored)
└── README.md
```

### API Architecture

The app uses a **REST API** handled by `api-handler.ts`, integrated into the Vite dev server via a custom middleware plugin.

**Request Flow:**
```
Browser → Vite Dev Server → API Middleware → api-handler.ts → Prisma → SQLite
                                        ↓
                                   Background Worker
                                        ↓
                                   HyperFrames CLI → data/jobs/{jobId}/output.mp4
```

**Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/jobs` | Session | Create new video job |
| GET | `/api/jobs/:jobId` | Session | Get job details |
| PATCH | `/api/jobs/:jobId` | Session | Update job (creates new) |
| GET | `/api/jobs/:jobId/status` | Session | Poll job status |
| GET | `/api/jobs/:jobId/download` | Session | Stream/download MP4 |

See `docs/API.md` for full endpoint documentation.

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Job {
  id              String    @id @default(cuid())
  sessionId       String
  
  // Input
  jobTitles       String    // JSON: ["title1", "title2", "title3", "title4"]
  aspectRatio     String    // "9:16" | "16:9"
  
  // Status
  status          String    @default("queued")  // queued | rendering | complete | failed
  step            String    @default("queued")
  errorMessage    String?
  
  // Output
  outputVideoPath String?   // data/jobs/{jobId}/output.mp4
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deleteAfter     BigInt    @default(0)   // Cleanup timestamp
  
  @@index([sessionId])
  @@index([status])
  @@index([createdAt])
}
```

### Background Worker

**File:** `server/worker.ts`

**Process Flow:**
```
Loop every 2 seconds:
  1. Query: SELECT * FROM Job WHERE status = 'queued' ORDER BY createdAt ASC LIMIT 1
  2. If found:
     - Update: status → 'rendering', step → 'rendering'
     - Call: renderWeAreHiringVideo({ jobTitles, aspectRatio, outputPath, musicPath })
     - On success:
       * Update: status → 'complete', outputVideoPath → path
     - On error:
       * Update: status → 'failed', errorMessage → error message
  3. Cleanup: DELETE FROM Job WHERE deleteAfter < now AND deleteAfter > 0
  4. Sleep 2 seconds
```

**Key Details:**
- Sequential processing (one job at a time)
- HyperFrames render via local CLI (spawn child process)
- Stores MP4 at: `data/jobs/{jobId}/output.mp4`
- Deletes jobs older than 1 hour (default `JOB_RETENTION_MS=3600000`)
- Graceful shutdown on SIGINT / SIGTERM

### HyperFrames Rendering

**File:** `packages/hyperframes-render/src/render-we-are-hiring.ts`

```typescript
export async function renderWeAreHiringVideo(options: {
  jobTitles: string[];            // exactly 4 titles
  aspectRatio: "9:16" | "16:9";
  outputPath: string;
  musicPath?: string;
}): Promise<void>
```

**What it does:**
1. Creates a temporary project directory
2. Copies the HTML composition template (`we-are-hiring.html`)
3. Patches dimensions for portrait (9:16) if needed
4. Writes `meta.json` (required by HyperFrames)
5. Copies music file if provided
6. Runs `hyperframes render --input {project} --output {path} --variables {json} --fps 30`
7. Cleans up temp project directory

**Video Specifications:**
- **Duration:** 15 seconds
- **FPS:** 30
- **Portrait (9:16):** 1080px × 1920px
- **Landscape (16:9):** 1920px × 1080px
- **Audio:** Muxed from `default.mp3` (must be 15 seconds)

**HTML Composition:**
The composition is a self-contained HTML file with:
- Inline CSS for all styling
- GSAP animations via CDN (`gsap.min.js`)
- Variable injection via `window.__hyperframes.getVariables()`
- Responsive layout adjustments for portrait vs landscape

---

## Environment Variables

**File:** `.env.example` (copy to `.env`)

```bash
# Database
DATABASE_URL=file:./data/app.db

# Sessions & Security
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

---

## User Flows

### Flow 1: Generate Video
```
User lands on / (Home)
  ↓
Enters 4 job titles + chooses aspect ratio
  ↓
Clicks "Generate Video"
  ↓
Frontend: validate form → POST /api/jobs
  ↓
Backend: Check rate limit, create Job record (status=queued)
  ↓
Frontend: Navigate to /dashboard/{jobId}
  ↓
Frontend: Poll GET /api/jobs/{jobId}/status every 500ms
  ↓
Worker: Pick job, render via HyperFrames
  ↓
Backend: Update Job (status=complete, outputVideoPath=...)
  ↓
Frontend: Status changes → Show video player + download + edit buttons
```

### Flow 2: Edit & Re-render
```
User on /dashboard/{jobId} (video complete)
  ↓
Clicks "Edit & Re-render" button
  ↓
Navigate to /edit/{jobId}
  ↓
Frontend: Load current job titles via GET /api/jobs/{jobId}
  ↓
User modifies titles or aspect ratio
  ↓
Clicks "Re-render Video"
  ↓
Frontend: PATCH /api/jobs/{jobId} with updated data
  ↓
Backend: Create NEW Job record (status=queued, new jobId)
  ↓
Frontend: Navigate to /dashboard/{newJobId}
  ↓
Repeat polling loop (same as Flow 1)
```

---

## Error Handling

| Scenario | User Experience |
|----------|-----------------|
| Validation error (empty field) | Red error message on form, prevent submit |
| Rate limit exceeded | Error banner: "Too many videos. Try again later." |
| Job render fails | Dashboard shows error message + "Edit & Try Again" button |
| Job not found | 404 page with link back to home |
| Session expired | Message shown, cookie cleared, redirect to home |
| Music file missing | Worker logs warning, renders video without audio |

---

## Security Considerations

1. **Session Isolation:** Each user only sees their own jobs (`WHERE sessionId = ?`)
2. **Rate Limiting:** 10 jobs per session per hour (prevents abuse)
3. **Input Validation:** Zod schemas on all API inputs
4. **File Paths:** Videos stored under `data/jobs/{jobId}/` with UUIDs (no path traversal)
5. **Cookies:** Signed JWTs via `jose`, HTTPOnly, SameSite=Lax
6. **CORS:** Same-origin only; no cross-origin needed for MVP

---

## Performance Considerations

| Aspect | Strategy |
|--------|----------|
| Job Status Polling | 500ms interval (responsive but not aggressive) |
| Database Queries | Indexed by `sessionId`, `status`, `createdAt` |
| Video Storage | Local filesystem under `data/jobs/{jobId}/` |
| Cleanup | Automatic deletion of jobs older than 1 hour |
| Rendering | Sequential (one job at a time, simpler to debug) |
| Frontend Bundle | Vite with route-based code splitting |
| Video Streaming | Range request support for `<video>` seeking |

---

## Future Enhancements (Phase 2+)

- [ ] Multiple video templates (Product Launch, Event Promo, Customer Quote, etc.)
- [ ] Template selector on home page
- [ ] User authentication (email/Google login)
- [ ] Job history dashboard (view all past videos)
- [ ] Music selection from a library
- [ ] Color/font customization per template
- [ ] Download stats / analytics
- [ ] Video sharing (social links with thumbnail)
- [ ] Parallel rendering (multiple workers)
- [ ] AI-powered customization (Phase 3 — after template validation)

---

## Development Workflow

```bash
# Setup
pnpm install
pnpm db:migrate          # Generate SQLite + tables

# Development (run both in separate terminals)
pnpm dev                 # Terminal 1: Vite dev server (http://localhost:5173)
pnpm worker              # Terminal 2: Background worker

# Optional: Watch Prisma changes
pnpm db:generate --watch
```

**Available Commands:**
- `pnpm dev` — Start dev server
- `pnpm worker` — Start background worker
- `pnpm build` — Build for production
- `pnpm start` — Start production server
- `pnpm db:migrate` — Run Prisma migrations
- `pnpm db:studio` — Open Prisma Studio (browse DB)
- `pnpm db:generate` — Generate Prisma client

---

## Deployment

**Database Persistence:**
- SQLite file at `data/app.db`
- Mount `data/` as a persistent volume in Docker/containers
- For Render: add a 1GB persistent disk mounted at `/data`

**Worker Persistence:**
- Run `pnpm worker` as a separate background service
- On Render: create a separate "Background Worker" service
- On Fly.io: deploy as a separate process in `fly.toml`

**Environment:**
- Same `.env` for web server and worker
- Both read `DATABASE_URL` and `SESSION_SECRET`

**Build:**
```bash
pnpm build
pnpm start   # Terminal 1: Production web server
pnpm worker  # Terminal 2: Production worker
```

**Free Deployment Recommendations:**
- **Render** (free tier): Web service + background worker + persistent disk
- **Fly.io** (free tier): 3 VMs + 3GB volume, services don't sleep
- **Hetzner CX11** (~$4.51/month): Single VPS, no sleep, full control

---

## Summary

This design provides a **simple, focused MVP** for the "We Are Hiring" video generator:
- ✅ No user auth (session-based only)
- ✅ One template (We Are Hiring)
- ✅ No customizations (fixed duration, colors, music)
- ✅ In-browser editing (modify titles, re-render)
- ✅ Single-process background worker (easy to run)
- ✅ HyperFrames rendering (local CLI)
- ✅ Vite + React + TanStack Router (modern stack)
- ✅ SQLite + Prisma (simple, fast setup)
- ✅ REST API (simple, predictable)

**Next Step:** Add more templates and validate product-market fit before investing in AI customization features.
