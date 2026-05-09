# Video-Gen Codebase Analysis

## Project Overview
**video-gen** is a monorepo for converting LinkedIn-style posts into short videos using Remotion rendering. It consists of a Next.js web app, a background job worker, and Remotion video rendering engine.

### Technology Stack
- **Remotion** 4.0.331 - React-based video rendering
- **Next.js** - Web application framework
- **React** 19.0.0 - UI library
- **TypeScript** 5.7.3 - Type safety
- **FFmpeg** - Audio processing
- **SQLite** - Job storage
- **pnpm** - Package manager with workspace support

---

## Project Structure

### Root Directory Layout
```
/Users/rahimuddin.mohammad/Practise/video-gen/
├── remotion/                 # Remotion video rendering engine
├── apps/
│   └── web/                  # Next.js web application
├── packages/
│   ├── contracts/            # Shared TypeScript types and schemas
│   └── planner/              # LLM-based slide planning
├── data/                     # SQLite database and job artifacts
├── docker/                   # Docker configuration
├── docs/                     # Documentation
├── tsconfig.base.json        # Shared TypeScript config
├── pnpm-workspace.yaml       # Workspace configuration
└── .env                      # Configuration (API keys, secrets)
```

---

## Key Components

### 1. Remotion Rendering Engine (`/remotion`)

#### Directory Structure
```
remotion/
├── src/
│   ├── index.ts              # Entry point, registers Root
│   ├── Root.tsx              # Composition configuration
│   ├── compositions/
│   │   └── PostVideo.tsx      # Main video composition
│   └── components/
│       └── Slide.tsx          # Individual slide renderer
├── remotion.config.ts         # Remotion configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

#### Key Files

**`Root.tsx`** (86 lines)
- Registers the `PostVideo` composition with Remotion
- Sets up default video props (9:16 portrait format for TikTok/Instagram)
- **FPS**: 30
- **Default duration**: 15 seconds (450 frames)
- **Dimensions**: 1080x1920 (portrait)
- Defines `defaultSlidePlan` with sample slides (hook, body, CTA)
- Uses `calculatePostVideoMetadata` to dynamically set dimensions based on aspect ratio

**`PostVideo.tsx`** (48 lines) - Main Video Composition
```typescript
export type PostVideoProps = {
  slidePlan: SlidePlan;           // Video slide structure
  slideDurationsSec: number[];    // Duration per slide in seconds
  theme: ThemePack;              // Colors and fonts
  aspectRatioId: "9:16" | "16:9"; // Video format
  audioSrc: string;              // Audio file path
};
```
- Uses Remotion `Series` component to sequence slides
- Each slide is rendered in a `Series.Sequence` with specific duration in frames
- Audio support via `<Audio>` component
- Background color from theme

**`Slide.tsx`** (131 lines) - Individual Slide Renderer

Two layer types supported:

1. **TextLayerView** - Text rendering
   - Role-based font selection: `hook` (56px, heading) → `body` (36px, body) → `cta` (44px, heading)
   - Region-based positioning: `top` (72px from top) | `center` (vertically centered) | `bottom` (72px from bottom)
   - Font weight: 600 (semi-bold)
   - Line height: 1.15
   - Text alignment: center
   - Whitespace: pre-wrap (preserves formatting)

2. **ShapeLayerView** - Decorative shapes
   - Shapes: `circle`, `rect`, `line`
   - Accent colors or muted colors
   - Opacity: 0.45 (circle), 0.35 (rect), 0.6 (line)
   - Fixed dimensions: circles (120x120), rects (220x120), lines (70% width)

---

### 2. Contracts Package (`/packages/contracts`)

**Shared TypeScript types and Zod validation schemas**

#### Core Schemas

**`slide-plan.ts`** (199 lines)
- Defines the data structure for video content
- Zod schemas for runtime validation and normalization

**Types:**
```typescript
type SlidePlan = {
  slidePlanVersion: 1;
  meta?: { title?: string };
  slides: Slide[];
}

type Slide = {
  index: number;
  layers: Layer[]; // 1-8 layers per slide
}

type Layer = TextLayer | ShapeLayer;

type TextLayer = {
  type: "text";
  role: "hook" | "body" | "cta" | "label"; // Text purpose
  text: string; // Max 500 chars
  region: "top" | "center" | "bottom";
}

type ShapeLayer = {
  type: "shape";
  shape: "circle" | "rect" | "line";
  region: "top" | "center" | "bottom";
  accent?: boolean; // Use accent or muted color
}
```

**Normalization Features:**
- Flexible text role aliases: "headline", "title", "opening" → "hook"; "body", "content", "main" → "body"; "cta", "call-to-action", "outro" → "cta"
- Region aliases: "middle", "centre", "mid" → "center"; "upper" → "top"; "lower" → "bottom"
- Auto-detection of layer type if not specified
- Text field fallbacks: checks `content`, `copy`, `value`, `message`, `body` if main `text` is missing
- Numeric text coercion

**`themes.ts`** (41 lines)
```typescript
type ThemePack = {
  id: "graph-paper-v1";
  label: string;
  colors: {
    background: "#0B1020";      // Dark navy
    foreground: "#F5F7FF";      // Light blue-white
    accent: "#7C5CFF";          // Purple
    muted: "#98A2C3";           // Muted blue-gray
  };
  fonts: {
    heading: "Inter";
    body: "Inter";
  };
}
```

**`templates.ts`** (35 lines)
- Currently only one template: `linkedin-three-beat-v1`
- 3 slides × 5 seconds each = 15-second video
- Can be extended with more templates

---

### 3. Web Application (`/apps/web`)

Next.js app for managing video generation jobs
- API endpoints for job creation/status/download
- SQLite database for job persistence
- Background worker for rendering

---

### 4. Planner Package (`/packages/planner`)

LLM-based slide content generation using OpenAI/OpenRouter

---

## Current Text Rendering Implementation

### Location
`/Users/rahimuddin.mohammad/Practise/video-gen/remotion/src/components/Slide.tsx` lines 21-49

### Key Characteristics
**NO ANIMATIONS CURRENTLY** - All text is static.

```typescript
// Current implementation:
<div style={{
  position: "absolute",
  ...regionLayout(layer.region),
  color: theme.colors.foreground,
  fontFamily,       // Inter
  fontSize,         // 36-56px based on role
  fontWeight: 600,  // Semi-bold
  lineHeight: 1.15,
  textAlign: "center",
  whiteSpace: "pre-wrap",
}}>
  {layer.text}
</div>
```

### Limitations
1. ✗ No entrance animations
2. ✗ No text transitions between slides
3. ✗ No typewriter effects
4. ✗ No emphasis animations (scaling, opacity)
5. ✗ No character-level animation control
6. ✗ Static layout with no dynamic sizing
7. ✗ No text wrapping optimization for readability

---

## Font & Style Configuration

### Current Setup
- **Single font family**: "Inter" (both heading and body)
- **Font weight**: 600 (semi-bold only)
- **Colors**: Theme-based (foreground, accent, muted)
- **No web font loading** - Relies on system fonts or Remotion defaults

### Theme Configuration Location
`/packages/contracts/src/themes.ts`

Currently only "graph-paper-v1" theme available:
- Background: `#0B1020` (dark navy)
- Foreground: `#F5F7FF` (light)
- Accent: `#7C5CFF` (purple)
- Muted: `#98A2C3` (gray-blue)

---

## Remotion Integration Points

### Currently Used Remotion Features
- `Composition` - Register a video composition
- `Series` & `Series.Sequence` - Timeline sequencing of slides
- `AbsoluteFill` - Full-screen container
- `Audio` - Audio playback
- `staticFile()` - Reference static assets

### NOT Currently Used (Available for Enhancement)
- `useCurrentFrame()` - Access current frame number
- `useVideoConfig()` - Get video dimensions and fps
- `interpolate()` - Frame-based interpolation
- `spring()` - Spring animation
- `useTime()` - Get current time in seconds
- `easing` functions - Easing utilities
- `DelayRender()` - Defer rendering (for async operations)
- Transforms - CSS transforms in Remotion context

---

## Areas Identified for Text Animation Enhancement

### 1. **Text Entrance Animations**
   - Location to add: `Slide.tsx` `TextLayerView` component
   - Examples: fade-in, slide-in, scale-in
   - Use: `useCurrentFrame()` + `interpolate()`

### 2. **Typewriter Effect**
   - Character-by-character reveal
   - Requires substring logic based on current frame
   - Common for educational/storytelling videos

### 3. **Transitions Between Slides**
   - Exit animation for current slide
   - Entrance animation for next slide
   - Cross-fade effects

### 4. **Emphasis Effects**
   - Highlight key words
   - Scale or color changes for emphasis
   - Requires text parsing (word-level granularity)

### 5. **Font/Style Configuration**
   - Extend theme to support multiple font families
   - Add font weight variants
   - Support for font sizes beyond role-based defaults

### 6. **Web Font Loading**
   - Currently relies on system fonts
   - Could use Google Fonts or custom fonts via Remotion's `@font-face` support

---

## Data Flow

```
User Input
    ↓
Next.js Web App (jobs API)
    ↓
SQLite Job Storage
    ↓
Job Worker (Background Process)
    ↓
Planner Package (LLM generates SlidePlan)
    ↓
Remotion Rendering
    ├─ Root.tsx (Composes video)
    ├─ PostVideo.tsx (Main composition with Series)
    └─ Slide.tsx (Renders individual slides)
         ├─ TextLayerView (Static text)
         └─ ShapeLayerView (Decorative shapes)
    ↓
FFmpeg Processing (Audio normalization)
    ↓
Output Video File
```

---

## Video Rendering Configuration

### Frame Rate & Duration
- **FPS**: 30 frames per second
- **Default total duration**: 15 seconds (450 frames)
- **Slide duration**: 5 seconds per slide (150 frames each)
- **Total slides**: 3 (hook, body, CTA)

### Aspect Ratios Supported
- `9:16` (Portrait) - 1080×1920 - Default for TikTok/Instagram/Reels
- `16:9` (Landscape) - 1920×1080 - LinkedIn, YouTube

### Video Codec
- Uses Remotion's default FFmpeg configuration
- Output format: MP4 (inferred from job processing)

---

## File Paths Summary

| Component | Path | Purpose |
|-----------|------|---------|
| Main composition | `/remotion/src/compositions/PostVideo.tsx` | Video structure & slide sequencing |
| Slide renderer | `/remotion/src/components/Slide.tsx` | Individual slide rendering (TEXT & SHAPES) |
| Root/Config | `/remotion/src/Root.tsx` | Composition registration |
| Contracts/Types | `/packages/contracts/src/slide-plan.ts` | Data structure definitions |
| Themes | `/packages/contracts/src/themes.ts` | Color & font configuration |
| Remotion Config | `/remotion/remotion.config.ts` | Minimal config file |

---

## Next Steps for Enhancement

### Priority 1: Text Animations
1. Add `useCurrentFrame()` hook to Slide component
2. Implement fade-in entrance animation for text
3. Add configurable animation duration via theme or layer data

### Priority 2: Extend Data Structure
1. Add `animation` field to `TextLayer` type
2. Support animation preset names: "fade-in", "slide-in", "typewriter"
3. Add `animationDuration` and `animationDelay` fields

### Priority 3: Font Configuration
1. Extend `ThemePack` to support multiple font variants
2. Add web font loading support
3. Support custom font weights and styles per text role

### Priority 4: Advanced Animations
1. Typewriter effect implementation
2. Word-level emphasis highlighting
3. Transition effects between slides

---

## Summary

The **video-gen** codebase is a well-structured monorepo with clear separation of concerns:
- **Remotion** handles video rendering
- **Contracts** defines shared types
- **Web app** provides the UI/API
- **Planner** generates content via LLM

**Current state**: Basic static text rendering with role-based sizing and theme-based colors. **No animations** are currently implemented.

**Key opportunities**: The Remotion component structure is ideal for adding frame-based animations. The `Slide.tsx` component is the main target for text animation enhancements. The contracts package provides a good extension point for adding animation configuration to the data model.
