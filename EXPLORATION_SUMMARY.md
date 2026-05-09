# Video-Gen Codebase Exploration Summary

## Executive Summary

Successfully analyzed the **video-gen** monorepo structure. The project is a well-architected system for generating short-form videos from LinkedIn posts using Remotion (React-based video framework).

**Key Finding**: The codebase has **NO text animations** currently implemented. All text renders statically on each slide. This represents the primary opportunity for enhancement.

---

## Project Architecture at a Glance

### Three Main Layers

1. **Input Layer** (apps/web)
   - Next.js web application
   - Job API endpoints
   - SQLite database

2. **Processing Layer** (packages)
   - **contracts**: TypeScript type definitions + Zod schemas
   - **planner**: LLM-based content generation (OpenAI/OpenRouter)

3. **Rendering Layer** (remotion)
   - Remotion video compositions
   - Component-based slide rendering
   - Frame-accurate rendering at 30 FPS

---

## Video Structure

### Video Composition
- **Format**: 9:16 portrait (1080x1920) or 16:9 landscape (1920x1080)
- **Duration**: 15 seconds default (450 frames at 30 FPS)
- **Template**: Three-beat structure (Hook, Insight, CTA)
- **Slide timing**: 5 seconds each (150 frames per slide)
- **Audio**: Optional MP3 file support

### Slide Layers
Each slide can contain 1-8 layers:
- **Text layers**: Heading/body/CTA text with role-based sizing
- **Shape layers**: Decorative circles, rectangles, or lines

---

## Current Text Rendering

### How It Works
1. `TextLayer` data enters `Slide.tsx`
2. `TextLayerView` component receives layer data
3. Static styled `<div>` is rendered with:
   - Position: absolute, region-based (top/center/bottom)
   - Font: Inter (from theme)
   - Size: 36-56px based on role
   - Color: Theme foreground color
4. **No frame-based logic** → Text appears immediately and stays visible

### Code Location
**File**: `/remotion/src/components/Slide.tsx` (lines 21-49)

```typescript
// Current implementation - NO ANIMATIONS
<div style={{
  position: "absolute",
  ...regionLayout(layer.region),
  color: theme.colors.foreground,
  fontFamily,
  fontSize,
  fontWeight: 600,
  lineHeight: 1.15,
  textAlign: "center",
  whiteSpace: "pre-wrap",
}}>
  {layer.text}
</div>
```

---

## Critical Files for Enhancement

### Animation Implementation Targets

| Priority | File | Purpose | Current State |
|----------|------|---------|---------------|
| 🔴 P1 | `/remotion/src/components/Slide.tsx` | Text renderer | Static, no animation |
| 🟡 P2 | `/packages/contracts/src/slide-plan.ts` | Layer schema | No animation fields |
| 🟡 P2 | `/remotion/src/Root.tsx` | Default props | Sample slides have no animations |
| 🟢 P3 | `/packages/contracts/src/themes.ts` | Color/font config | Basic, can be extended |
| 🟢 P3 | `/remotion/src/compositions/PostVideo.tsx` | Series setup | Timeline sequencing |

### Supporting Files to Understand

| File | Lines | Content | Relevance |
|------|-------|---------|-----------|
| `/remotion/src/Root.tsx` | 1-86 | Composition registration, defaults | Understanding FPS and frame counts |
| `/remotion/src/compositions/PostVideo.tsx` | 1-48 | Series sequencing | How slides are timed |
| `/packages/contracts/src/slide-plan.ts` | 1-199 | Type definitions, Zod schemas | Data structure contract |
| `/packages/contracts/src/themes.ts` | 1-41 | ThemePack type, color definitions | Styling configuration |

---

## Remotion Capabilities Available

### Currently Used
- `Composition` - Video composition definition
- `Series` & `Series.Sequence` - Timeline sequencing
- `AbsoluteFill` - Full-screen container
- `Audio` - Audio playback
- `staticFile()` - Static asset references

### Available for Animation Enhancement
- ✅ `useCurrentFrame()` - Get current frame number (0-150)
- ✅ `useVideoConfig()` - Get fps, dimensions
- ✅ `interpolate()` - Linear interpolation for smooth animations
- ✅ `spring()` - Spring easing functions
- ✅ CSS transforms - translate, scale, rotate
- ✅ CSS opacity - for fade effects
- ✅ `useTime()` - Time-based calculations

---

## Key Numbers

### Timing Reference
- **FPS**: 30 frames per second
- **Slide duration**: 150 frames = 5 seconds
- **Typical animation duration**: 30 frames = 1 second (fast fade-in)
- **Total video**: 450 frames = 15 seconds (3 slides)

### Layout Reference
- **Video size**: 1080×1920 (portrait)
- **Padding**: 48px horizontal, 72px vertical
- **Text sizes**:
  - Hook: 56px
  - CTA: 44px
  - Body: 36px
- **Font weight**: 600 (semi-bold)
- **Line height**: 1.15

---

## Animation Enhancement Opportunities

### Low-Hanging Fruit (Easiest to Implement)
1. **Fade-in** - Simple opacity interpolation
2. **Scale-in** - Simple transform interpolation
3. **Slide-in** - Combine opacity + translate

### Medium Complexity
1. **Typewriter effect** - Character-by-character reveal
2. **Word emphasis** - Highlight specific words
3. **Multi-layer sequencing** - Stagger animations

### High Complexity
1. **Advanced easing** - Spring/bounce effects
2. **Particle effects** - Text that dissolves/explodes
3. **3D transforms** - Perspective effects

---

## Data Flow for Text Animation

```
Animation Config (New)
├── animation: "fade-in" | "slide-in-left" | ...
├── animationDurationFrames: 30
├── animationDelayFrames: 0
└── animationEasing: "ease-out"
    ↓
TextLayerView Component
├── useCurrentFrame() [0-150 for 5-sec slide]
├── Calculate animation progress
├── Generate CSS transforms/opacity
└── Apply to <div> style
    ↓
Rendered output (interpolated each frame)
```

---

## Implementation Path

### Step 1: Foundation (1-2 days)
- Add `useCurrentFrame()` to TextLayerView
- Create animation style calculator functions
- Test frame logging

### Step 2: Simple Animations (2-3 days)
- Implement fade-in
- Implement scale-in
- Add animation fields to TextLayerSchema

### Step 3: Advanced Animations (2-3 days)
- Implement slide-in (4 directions)
- Add easing support
- Test combinations

### Step 4: Polish (1-2 days)
- Performance optimization
- Testing and validation
- Documentation

---

## Documentation Generated

Three detailed documents created in project root:

1. **CODEBASE_ANALYSIS.md** (Comprehensive breakdown)
   - Project structure, technology stack
   - Key component descriptions
   - Current implementation details
   - Limitations and opportunities

2. **COMPONENT_HIERARCHY.md** (Architecture diagrams)
   - Remotion component tree
   - Data structure hierarchy
   - Rendering pipeline
   - File dependencies
   - Animation enhancement points

3. **TEXT_ANIMATION_ROADMAP.md** (Implementation guide)
   - Phased approach (5 phases)
   - Code examples for each animation type
   - Implementation checklist
   - Performance optimization strategies

---

## Key Insights

### Strengths
✅ Clean component architecture
✅ Type-safe with TypeScript and Zod
✅ Clear separation of concerns
✅ Extensible theme system
✅ Monorepo with shared contracts

### Current Limitations
❌ No animations (static text)
❌ No frame-based rendering logic
❌ Single font family and weight
❌ Limited text customization
❌ No transition effects

### Opportunities
🎯 Add animations to text layers (primary)
🎯 Extend theme for font variants
🎯 Add slide transitions
🎯 Implement emphasis effects
🎯 Support more animation presets

---

## Next Steps (For Implementation)

1. **Review Generated Docs**
   - Study CODEBASE_ANALYSIS.md for full context
   - Review COMPONENT_HIERARCHY.md for component relationships
   - Reference TEXT_ANIMATION_ROADMAP.md for implementation guidance

2. **Prototype Fade-In Animation**
   - Modify `Slide.tsx` to add `useCurrentFrame()`
   - Implement calculateFadeInStyle() helper
   - Test with Remotion Studio

3. **Extend Data Schema**
   - Add animation fields to TextLayerSchema
   - Update Zod validation
   - Create sample slides with animations

4. **Test & Iterate**
   - Generate test videos
   - Review timing and smoothness
   - Gather feedback

---

## Project Statistics

- **Total files analyzed**: 15+
- **Key components**: 5 (Root, PostVideo, Slide, contracts, themes)
- **Lines of code** (rendering): ~180 lines
- **Animation setup required**: ~200-300 lines
- **Current animations**: 0
- **Potential animations**: 6+ presets

---

## Final Notes

The video-gen codebase is **production-ready for basic video generation** but **lacks visual polish through animations**. The addition of text animations would significantly improve video appeal and viewer engagement.

The component architecture is ideal for animation additions - the `Slide.tsx` component is self-contained and modular, making it a low-risk enhancement target.

**Recommended starting point**: Implement fade-in animation as proof-of-concept, then expand to other animation types based on user feedback.

---

**Analysis completed**: May 9, 2026
**Files documented**: CODEBASE_ANALYSIS.md, COMPONENT_HIERARCHY.md, TEXT_ANIMATION_ROADMAP.md
