# File Reference - Complete Paths

## Generated Documentation (Start Here)

### Navigation & Index
- **Path**: `/Users/rahimuddin.mohammad/Practise/video-gen/DOCS_INDEX.md`
- **Purpose**: Navigation guide and quick reference
- **Read Time**: 5 minutes
- **Best for**: Getting oriented

### Executive Summary
- **Path**: `/Users/rahimuddin.mohammad/Practise/video-gen/EXPLORATION_SUMMARY.md`
- **Purpose**: High-level project overview
- **Read Time**: 15 minutes
- **Best for**: Understanding the big picture

### Codebase Analysis
- **Path**: `/Users/rahimuddin.mohammad/Practise/video-gen/CODEBASE_ANALYSIS.md`
- **Purpose**: Comprehensive technical breakdown
- **Read Time**: 30 minutes
- **Best for**: Understanding how things work

### Component Hierarchy
- **Path**: `/Users/rahimuddin.mohammad/Practise/video-gen/COMPONENT_HIERARCHY.md`
- **Purpose**: Architecture diagrams and relationships
- **Read Time**: 20 minutes
- **Best for**: Understanding where to add code

### Animation Roadmap
- **Path**: `/Users/rahimuddin.mohammad/Practise/video-gen/TEXT_ANIMATION_ROADMAP.md`
- **Purpose**: Step-by-step implementation guide
- **Read Time**: 30 minutes (bookmark for development)
- **Best for**: Implementation planning and execution

---

## Project Structure - Absolute Paths

### Remotion Rendering Engine

**Main Entry Points:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/index.ts`
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/Root.tsx` (86 lines)
  - Composition registration
  - Default slide plan
  - Video metadata configuration

**Primary Animation Target:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/components/Slide.tsx` (131 lines)
  - TextLayerView: Static text rendering (lines 21-49)
  - ShapeLayerView: Decorative shapes (lines 51-112)
  - Region layout positioning helper

**Main Composition:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/compositions/PostVideo.tsx` (48 lines)
  - Series sequencing
  - Audio support
  - Slide iteration

**Configuration:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/remotion.config.ts` (minimal)
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/package.json`

### Type Definitions & Schemas

**Primary Schema File (Add animation fields here):**
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/contracts/src/slide-plan.ts` (199 lines)
  - TextLayerSchema: Lines 81-90
  - ShapeLayerSchema: Lines 92-110
  - Layer discriminated union
  - SlidePlan definition

**Theme Configuration:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/contracts/src/themes.ts` (41 lines)
  - ThemePack type definition
  - Color configuration
  - Font configuration

**Templates:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/contracts/src/templates.ts` (35 lines)
  - VideoTemplate type
  - Three-beat template (current)

**Index/Exports:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/contracts/src/index.ts`

### Web Application

**Main Application:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/app/layout.tsx`
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/app/page.tsx`

**API Routes:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/app/api/jobs/route.ts`
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/app/api/jobs/[jobId]/route.ts`
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/app/api/jobs/[jobId]/download/route.ts`

**Job Worker:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/scripts/job-worker.ts`

**Database:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/lib/db/schema.ts`
- `/Users/rahimuddin.mohammad/Practise/video-gen/apps/web/lib/db/resolve-database-url.ts`

### Planner Package

**Content Generation:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/planner/src/plan-post.ts`
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/planner/src/prompt.ts`

### Configuration Files

**Workspace Configuration:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/pnpm-workspace.yaml`
- `/Users/rahimuddin.mohammad/Practise/video-gen/package.json`
- `/Users/rahimuddin.mohammad/Practise/video-gen/tsconfig.base.json`

**Environment Configuration:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/.env` (local - contains secrets)
- `/Users/rahimuddin.mohammad/Practise/video-gen/.env.example` (template)

**Docker:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/Dockerfile`
- `/Users/rahimuddin.mohammad/Practise/video-gen/docker/` (directory)

**Git:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/.gitignore`
- `/Users/rahimuddin.mohammad/Practise/video-gen/.git/` (repo)

**Project Files:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/README.md` (original)
- `/Users/rahimuddin.mohammad/Practise/video-gen/LICENSE-ASSETS.md`

---

## Implementation Files (by Phase)

### Phase 1: Add Frame Awareness
**Modify:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/components/Slide.tsx`
- Add imports: useCurrentFrame, useVideoConfig, interpolate
- Update TextLayerView function

**Test with:**
- Remotion Studio: `pnpm dev` in remotion folder

### Phase 2: Extend Data Structure
**Modify:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/contracts/src/slide-plan.ts`
- Add animation fields to TextLayerSchema

### Phase 3: Update Defaults
**Modify:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/Root.tsx`
- Add animation properties to defaultSlidePlan

### Phase 4: Testing
**Create new test files:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/components/Slide.test.tsx`
- `/Users/rahimuddin.mohammad/Practise/video-gen/packages/contracts/src/slide-plan.animation.test.ts`

---

## Data Files

**Database:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/data/app.db` (SQLite)

**Job Artifacts:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/data/jobs/` (directory)

**Remotion Public Assets:**
- `/Users/rahimuddin.mohammad/Practise/video-gen/remotion/public/` (directory with audio files)

---

## Directory Structure (Complete)

```
/Users/rahimuddin.mohammad/Practise/video-gen/
│
├── DOCS_INDEX.md ← START HERE (Navigation)
├── EXPLORATION_SUMMARY.md (Executive summary)
├── CODEBASE_ANALYSIS.md (Deep dive)
├── COMPONENT_HIERARCHY.md (Architecture)
├── TEXT_ANIMATION_ROADMAP.md (Implementation guide)
├── FILE_REFERENCE.md (This file)
│
├── remotion/
│   ├── src/
│   │   ├── index.ts
│   │   ├── Root.tsx ← Update for defaults
│   │   ├── components/
│   │   │   └── Slide.tsx ← PRIMARY TARGET for animations
│   │   └── compositions/
│   │       └── PostVideo.tsx
│   ├── public/
│   ├── package.json
│   └── remotion.config.ts
│
├── packages/
│   ├── contracts/
│   │   └── src/
│   │       ├── slide-plan.ts ← Add animation fields
│   │       ├── themes.ts
│   │       └── templates.ts
│   └── planner/
│       └── src/
│
├── apps/
│   └── web/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── api/
│       └── scripts/
│           └── job-worker.ts
│
├── data/
│   ├── app.db
│   └── jobs/
│
├── docker/
├── docs/
├── .env
├── .env.example
├── Dockerfile
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── README.md
└── LICENSE-ASSETS.md
```

---

## Quick Reference for Development

### To run Remotion Studio (testing environment):
```bash
cd /Users/rahimuddin.mohammad/Practise/video-gen/remotion
pnpm dev
```

### To build Remotion:
```bash
cd /Users/rahimuddin.mohammad/Practise/video-gen/remotion
pnpm build
```

### To run web application:
```bash
cd /Users/rahimuddin.mohammad/Practise/video-gen
pnpm dev
```

### To run database migrations:
```bash
cd /Users/rahimuddin.mohammad/Practise/video-gen
pnpm --filter @video-gen/web db:migrate
```

---

## File Categories

### Documentation (Read-Only)
- DOCS_INDEX.md
- EXPLORATION_SUMMARY.md
- CODEBASE_ANALYSIS.md
- COMPONENT_HIERARCHY.md
- TEXT_ANIMATION_ROADMAP.md
- FILE_REFERENCE.md (this file)
- README.md
- LICENSE-ASSETS.md

### Code to Modify (For Animations)
1. `/remotion/src/components/Slide.tsx` (PRIMARY)
2. `/packages/contracts/src/slide-plan.ts` (SECONDARY)
3. `/remotion/src/Root.tsx` (TERTIARY)

### Code to Review (Understanding)
- `/remotion/src/compositions/PostVideo.tsx`
- `/remotion/src/Root.tsx`
- `/packages/contracts/src/themes.ts`
- `/packages/contracts/src/templates.ts`

### Configuration (Reference)
- `/remotion/remotion.config.ts`
- `/packages/contracts/package.json`
- `/remotion/package.json`
- `/tsconfig.base.json`

### Do Not Modify (For This Task)
- `/apps/web/` (out of scope)
- `/packages/planner/` (out of scope)
- `/data/` (generated)
- `.env` (contains secrets)
- `docker/` (out of scope)
- `package.json` (root level)

---

## Recommended Reading Order

1. **DOCS_INDEX.md** (5 min)
   - Get oriented with navigation

2. **EXPLORATION_SUMMARY.md** (15 min)
   - Understand project overview

3. **COMPONENT_HIERARCHY.md** (20 min)
   - See component relationships

4. **CODEBASE_ANALYSIS.md** (30 min)
   - Deep dive into implementation

5. **TEXT_ANIMATION_ROADMAP.md** (30 min - bookmark)
   - Implement step by step

6. **This file** (5 min)
   - Reference during development

**Total reading time: ~105 minutes**

---

## Key Statistics

- **Remotion code**: 365 lines
- **Type definitions**: 275 lines
- **Total analyzed**: 800+ lines
- **Documentation created**: 42+ KB
- **Files to modify**: 3 main files
- **Implementation phases**: 5
- **Estimated effort**: 4 weeks

---

## Support Resources

### Remotion Documentation
- https://www.remotion.dev/docs/animate
- https://www.remotion.dev/docs/use-current-frame
- https://www.remotion.dev/docs/interpolate

### TypeScript
- https://www.typescriptlang.org/docs/

### React
- https://react.dev/

### Zod Validation
- https://zod.dev/

---

**Generated**: May 9, 2026
**For**: video-gen project codebase exploration and animation enhancement
