# We Are Hiring Video Generator v2 - Design Document

**Date:** May 9, 2025  
**Status:** Approved  
**Tech Stack:** Vite + TanStack Start + SQLite + Prisma + Hyperframes  
**Scope:** We Are Hiring template only, simple UX, no customizations (phase 1)

---

## Overview

A web-based video generation platform where users create 15-second "We Are Hiring" videos by entering 4 job titles. Videos are rendered via Hyperframes (HTML/CSS → MP4), stored in SQLite, and processed by a background worker. Users can edit titles in-browser and re-render without leaving the app.

**Target User:** Companies/recruiters creating hiring announcement videos for social media.

**Core Value Prop:** Quick, simple, no-setup video generation. Enter titles → get MP4 → download or edit & re-render.

---

## Functional Requirements

### 1. Home Page (Route: `/`)
- **Form Input:**
  - 4 job title text inputs (required, max 100 chars each)
  - Aspect ratio selector: Portrait (9:16) or Landscape (16:9)
  - "Generate Video" button
  
- **Validation:**
  - All 4 titles must be filled
  - Max length per title: 100 characters
  - Real-time error feedback

- **On Submit:**
  - Send RPC call `createJob({ jobTitles, aspectRatio })`
  - Navigate to `/dashboard/{jobId}`
  - Show loading state during redirect

### 2. Dashboard Page (Route: `/dashboard/$jobId`)
- **Status Display (Real-time Polling):**
  - Poll job status every 500ms via `getJobStatus(jobId)` RPC
  - Show status badge: "Queued" → "Rendering" → "Complete" or "Failed"
  - Show step text: "queued", "rendering", "complete"
  - Show error message if job failed

- **After Job Completes:**
  - Inline MP4 video player (play/pause controls)
  - "Download MP4" button (direct file download)
  - "Edit" button → Navigate to `/edit/{jobId}`

- **Failed State:**
  - Display error message
  - "Try Again" button → Return to home or edit page

### 3. Edit Page (Route: `/edit/$jobId`)
- **Form:**
  - 4 job title inputs pre-filled with original values
  - Aspect ratio selector (pre-filled)
  - "Re-render Video" button
  - "Cancel" button → Back to `/dashboard/{jobId}`

- **On Re-render:**
  - Send RPC call `updateJob(jobId, { jobTitles, aspectRatio })`
  - Creates **new job** (new jobId)
  - Navigate to new dashboard: `/dashboard/{newJobId}`
  - Show status polling on new dashboard

### 4. Session Management
- **Session Cookie:**
  - Signed JWT-like token (using `jose` or `jsonwebtoken`)
  - 30-day expiration
  - HTTPOnly, Secure, SameSite=Lax
  - Stored in `sessionId` cookie

- **User Isolation:**
  - Each RPC endpoint validates session
  - Users can only access/modify their own jobs
  - Filter queries by `WHERE sessionId = userSessionId`

### 5. Rate Limiting
- **Limit:** 10 jobs per session per hour
- **Check:** On `createJob()` and `updateJob()`
- **Violation:** Return 429 error, show message: "Too many videos. Try again in a few minutes."
- **Implementation:** In-memory map with hourly buckets

---

## Technical Architecture

### Project Structure

```
video-gen-v2/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
│
├── apps/web/                              # TanStack Start app
│   ├── app/
│   │   ├── routes/
│   │   │   ├── index.tsx                  # Home: job form
│   │   │   ├── dashboard/
│   │   │   │   └── $jobId.tsx             # Dashboard: status + player + edit
│   │   │   └── edit/
│   │   │       └── $jobId.tsx             # Edit page: modify + re-render
│   │   ├── server.ts                      # TanStack Start server entry
│   │   └── client.ts                      # TanStack Start client entry
│   ├── server/
│   │   ├── rpc/
│   │   │   └── jobs.ts                    # RPC: createJob, getJobStatus, updateJob, getJob
│   │   ├── db.ts                          # Prisma client singleton
│   │   ├── env.ts                         # Environment + validation
│   │   ├── session.ts                     # Session cookie signing/verification
│   │   ├── rate-limit.ts                  # Rate limit check
│   │   └── worker.ts                      # Background job processor entry
│   ├── lib/
│   │   ├── hooks/
│   │   │   └── useJobPolling.ts           # Custom hook: poll job status every 500ms
│   │   └── components/
│   │       ├── JobForm.tsx                # Home form component
│   │       ├── JobStatus.tsx              # Status display + polling
│   │       ├── VideoPlayer.tsx            # MP4 player
│   │       └── EditForm.tsx               # Edit page form
│   ├── public/
│   │   └── music/
│   │       └── default.mp3                # Default track (15 sec, upbeat)
│   ├── vite.config.ts
│   └── package.json
│
├── packages/
│   ├── contracts/                         # Shared types
│   │   ├── src/
│   │   │   ├── job-schema.ts              # Zod schemas for validation
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── hyperframes-render/                # Hyperframes wrapper
│       ├── src/
│       │   ├── render-we-are-hiring.ts    # Main render function
│       │   └── index.ts
│       └── package.json
│
├── prisma/
│   ├── schema.prisma                      # Database schema
│   └── migrations/                        # Auto-generated by Prisma
│
├── data/
│   ├── app.db                             # SQLite (gitignored)
│   └── jobs/
│       └── {jobId}/
│           └── output.mp4                 # Rendered video
│
├── docs/
│   ├── designs/
│   │   └── 2025-05-09-we-are-hiring-video-gen-v2.md
│   └── API.md
│
├── .env.example
├── .env                                   # Local secrets (gitignored)
└── README.md
```

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
  sessionId       String    @index
  
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

### RPC Endpoints (Type-Safe Server Functions)

**File:** `server/rpc/jobs.ts`

```typescript
export async function createJob(input: {
  jobTitles: [string, string, string, string]
  aspectRatio: "9:16" | "16:9"
}): Promise<{ jobId: string }>

export async function getJobStatus(jobId: string): Promise<{
  status: "queued" | "rendering" | "complete" | "failed"
  step: string
  errorMessage?: string
}>

export async function getJob(jobId: string): Promise<{
  id: string
  jobTitles: [string, string, string, string]
  aspectRatio: string
  status: string
  step: string
  errorMessage?: string
  outputVideoPath?: string
  createdAt: Date
}>

export async function updateJob(jobId: string, input: {
  jobTitles: [string, string, string, string]
  aspectRatio: "9:16" | "16:9"
}): Promise<{ jobId: string }>
```

**Security:**
- Each endpoint validates `sessionId` from signed cookie
- Session isolation: Users can only access their own jobs
- Rate limiting: Max 10 jobs per session per hour
- Input validation: Zod schemas in contracts package

### Background Worker

**File:** `server/worker.ts`

**Process Flow:**
```
Loop every 2 seconds:
  1. Query: SELECT * FROM Job WHERE status = 'queued' LIMIT 1
  2. If found:
     - Update: status → 'rendering', step → 'rendering'
     - Call: renderWeAreHiringVideo(jobTitles, aspectRatio, musicPath, outputPath)
     - On success:
       * Update: status → 'complete', outputVideoPath → path
     - On error:
       * Update: status → 'failed', errorMessage → error message
  3. Cleanup: DELETE FROM Job WHERE createdAt < (now - JOB_RETENTION_MS)
  4. Sleep 2 seconds
```

**Key Details:**
- Sequential processing (one job at a time, simpler)
- Hyperframes render via local CLI (spawn child process)
- Stores MP4 at: `data/jobs/{jobId}/output.mp4`
- Deletes jobs older than 1 hour (default `JOB_RETENTION_MS=3600000`)

### Hyperframes Rendering

**File:** `packages/hyperframes-render/src/render-we-are-hiring.ts`

```typescript
export async function renderWeAreHiringVideo(options: {
  jobTitles: [string, string, string, string]
  aspectRatio: "9:16" | "16:9"
  outputPath: string
  musicPath: string
}): Promise<void>
```

**What it does:**
1. Generates HTML composition with CSS animations
2. Calls Hyperframes render engine (local CLI)
3. Saves MP4 to `outputPath`

**Timing Breakdown (15 seconds total, 30fps):**
- 0-3.5s: Title 1 slides in (0.6s animation), stays visible
- 3.8-7.3s: Title 2 slides in (0.6s animation), stays visible
- 7.6-11.1s: Title 3 slides in (0.6s animation), stays visible
- 11.4-15s: Title 4 slides in (0.6s animation), stays visible
- Music plays throughout (15 sec default.mp3)

**Video Dimensions:**
- Portrait (9:16): 1080px × 1920px
- Landscape (16:9): 1920px × 1080px
- FPS: 30

**HTML Composition Template:**
```html
<div style="width: {width}px; height: {height}px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; flex-direction: column; justify-content: center; align-items: center;">
  <div style="animation: slideIn 0.6s ease-out 0s forwards; font-size: 3rem; color: white; font-weight: bold; text-align: center; margin: 20px;">{jobTitle1}</div>
  <div style="animation: slideIn 0.6s ease-out 0.8s forwards; font-size: 3rem; color: white; font-weight: bold; text-align: center; margin: 20px;">{jobTitle2}</div>
  <div style="animation: slideIn 0.6s ease-out 1.6s forwards; font-size: 3rem; color: white; font-weight: bold; text-align: center; margin: 20px;">{jobTitle3}</div>
  <div style="animation: slideIn 0.6s ease-out 2.4s forwards; font-size: 3rem; color: white; font-weight: bold; text-align: center; margin: 20px;">{jobTitle4}</div>
</div>

<style>
  @keyframes slideIn {
    from { transform: translateX(-100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
</style>
```

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

# Hyperframes
HYPERFRAMES_CLI_PATH=/usr/local/bin/hyperframes
# (or npm bin: node_modules/.bin/hyperframes)

# Default Music Path
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
Frontend: validateForm() → createJob(jobTitles, aspectRatio)
  ↓
Backend: Check rate limit, create Job record (status=queued)
  ↓
Frontend: Navigate to /dashboard/{jobId}
  ↓
Frontend: Poll getJobStatus(jobId) every 500ms
  ↓
Worker: Pick job, render via Hyperframes
  ↓
Backend: Update Job (status=complete, outputVideoPath=...)
  ↓
Frontend: Status changes → Show video player + download button + edit button
```

### Flow 2: Edit & Re-render
```
User on /dashboard/{jobId} (video complete)
  ↓
Clicks "Edit" button
  ↓
Navigate to /edit/{jobId}
  ↓
Frontend: Load current job titles via getJob(jobId)
  ↓
User modifies titles
  ↓
Clicks "Re-render Video"
  ↓
Frontend: updateJob(jobId, { jobTitles, aspectRatio })
  ↓
Backend: Create NEW Job record (status=queued, new jobId)
  ↓
Frontend: Navigate to /dashboard/{newJobId}
  ↓
Repeat polling loop (same as Flow 1 from "Poll getJobStatus...")
```

---

## Error Handling

| Scenario | User Experience |
|----------|-----------------|
| Validation error (empty field) | Show red error message on home page, prevent submit |
| Rate limit exceeded | Show "Too many videos. Try again later." on home page |
| Job render fails | Show error message on dashboard, "Try Again" button → edit page |
| Job not found | Show 404, link back to home |
| Session expired | Show message, clear cookie, redirect to home |

---

## Security Considerations

1. **Session Isolation:** Each user only sees their own jobs (filter by sessionId)
2. **Rate Limiting:** 10 jobs per session per hour (prevents abuse)
3. **Input Validation:** Zod schemas, max length 100 chars per title
4. **File Paths:** Store videos under `data/jobs/{jobId}/` with UUID jobIds (no path traversal risk)
5. **Cookies:** Signed tokens (use `jose` or `jsonwebtoken`), HTTPOnly, SameSite=Lax
6. **CORS:** TanStack Start handles same-origin requests; no cross-origin needed

---

## Performance Considerations

| Aspect | Strategy |
|--------|----------|
| Job Status Polling | Poll every 500ms (responsive but not too aggressive) |
| Database Queries | Indexed by `sessionId`, `status`, `createdAt` |
| Video Storage | Store locally under `data/jobs/{jobId}/` |
| Cleanup | Delete jobs older than 1 hour (configurable) |
| Rendering | Sequential (one job at a time, simpler) |
| Frontend Bundle | TanStack Start with Vite → route-based code splitting |

---

## Future Enhancements (Phase 2+)

- [ ] User authentication (email/Google login)
- [ ] Job history dashboard (view all past videos)
- [ ] Aspect ratio variants (generate multiple sizes)
- [ ] Music selection (free API, Spotify, etc.)
- [ ] Title customization (colors, fonts, animations)
- [ ] Templates (not just "We Are Hiring")
- [ ] Download stats/analytics
- [ ] Video sharing (social links with thumbnail)
- [ ] Parallel rendering (multiple workers)
- [ ] Video trimming/editing UI

---

## Development Workflow

```bash
# Setup
pnpm install
pnpm db:migrate          # Generate SQLite + tables
pnpm dev                 # Terminal 1: TanStack Start dev server (http://localhost:5173)

# Terminal 2: Background worker
pnpm worker

# Terminal 3: (optional) Watch Prisma changes
pnpm db:generate --watch
```

**Available Commands:**
- `pnpm dev` — Start dev server
- `pnpm worker` — Start background worker
- `pnpm build` — Build for production
- `pnpm db:migrate` — Run Prisma migrations
- `pnpm db:studio` — Open Prisma Studio (browse DB)
- `pnpm db:generate` — Generate Prisma client

---

## Deployment

**Database Persistence:**
- SQLite file at `data/app.db`
- Mount `data/` volume in Docker/containers

**Worker Persistence:**
- Run `pnpm worker` as separate systemd service, PM2 process, or container

**Environment:**
- Same `.env` for TanStack Start and worker
- No separate config needed

**Build:**
```bash
pnpm build
pnpm start  # Runs TanStack Start production server
# In another process:
pnpm worker  # Or: NODE_ENV=production node dist/server/worker.js
```

---

## Summary

This design provides a **simple, focused MVP** for the "We Are Hiring" video generator:
- ✅ No user auth (session-based only)
- ✅ One template (We Are Hiring)
- ✅ No customizations (fixed duration, colors, music)
- ✅ In-browser editing (no external tools)
- ✅ Single-process background worker (easy to run)
- ✅ Hyperframes rendering (local CLI)
- ✅ TanStack Start + React (modern stack)
- ✅ SQLite + Prisma (simple, fast setup)

**Next Step:** Implement according to the implementation plan (to be generated by writing-plans skill).
