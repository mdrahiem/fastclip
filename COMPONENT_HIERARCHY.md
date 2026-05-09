# Video-Gen Component Hierarchy & Architecture

## Remotion Component Tree

```
Root.tsx
├── Composition: "PostVideo"
    ├── props: PostVideoProps {
    │   ├── slidePlan: SlidePlan (with slides array)
    │   ├── slideDurationsSec: number[]
    │   ├── theme: ThemePack
    │   ├── aspectRatioId: "9:16" | "16:9"
    │   └── audioSrc: string
    └── children:
        └── PostVideo (Composition Component)
            └── AbsoluteFill (Full background fill)
                ├── Series (Timeline sequencer)
                │   ├── Series.Sequence (Slide 0: 150 frames = 5 sec)
                │   │   └── Slide {slide, theme}
                │   │       └── AbsoluteFill (Slide background)
                │   │           ├── TextLayerView[] (Text elements)
                │   │           │   ├── <div> static text (NO ANIMATION)
                │   │           │   └── Inline styles
                │   │           └── ShapeLayerView[] (Shapes)
                │   │               └── <div> decorative shapes
                │   ├── Series.Sequence (Slide 1: 150 frames)
                │   │   └── Slide {...}
                │   └── Series.Sequence (Slide 2: 150 frames)
                │       └── Slide {...}
                └── Audio (Conditional audio playback)
```

## Data Structure Hierarchy

```
SlidePlan (Entry point)
├── slidePlanVersion: 1 (Version identifier)
├── meta: {
│   └── title?: string (Video title)
└── slides: Slide[]
    └── Slide[]
        ├── index: number (Slide position)
        └── layers: Layer[] (1-8 per slide)
            ├── TextLayer {
            │   ├── type: "text"
            │   ├── role: "hook" | "body" | "cta" | "label"
            │   ├── text: string (Max 500 chars)
            │   └── region: "top" | "center" | "bottom"
            └── ShapeLayer {
                ├── type: "shape"
                ├── shape: "circle" | "rect" | "line"
                ├── region: "top" | "center" | "bottom"
                └── accent?: boolean
```

## Rendering Pipeline

### 1. Text Rendering (Current)
```
TextLayer data
    ↓
TextLayerView component
    ↓
CSS styling:
├── Position: region (top/center/bottom)
├── Font: theme.fonts.[heading|body]
├── Size: 56px (hook) | 44px (cta) | 36px (body)
├── Color: theme.colors.foreground
└── Static rendering (NO FRAME LOGIC)
    ↓
<div style={{...}}>{layer.text}</div>
```

### 2. Shape Rendering (Current)
```
ShapeLayer data
    ↓
ShapeLayerView component
    ↓
CSS styling:
├── Shape type (circle 120x120 | rect 220x120 | line 70% width)
├── Color: theme.colors.[accent|muted]
└── Opacity: 0.45 (circle) | 0.35 (rect) | 0.6 (line)
    ↓
<div style={{...}}><div shape /></div>
```

## Style Application Chain

```
Layer data (from SlidePlan)
    ↓
Slide.tsx component
    ├─ theme: ThemePack
    │   ├── colors.foreground (text color)
    │   ├── colors.accent (shape accent)
    │   ├── colors.muted (shape default)
    │   ├── fonts.heading (for hook/cta)
    │   └── fonts.body (for body/label)
    ├─ regionLayout(layer.region)
    │   ├── top: {top: 72, left: 48, right: 48}
    │   ├── bottom: {bottom: 72, left: 48, right: 48}
    │   └── center: {top: "50%", transform: "translateY(-50%)"}
    ↓
Applied inline styles
    ├── position: absolute
    ├── ...regionLayout
    ├── color/backgroundColor
    ├── font properties
    ├── layout properties
    └── transform (for center)
```

## File Dependencies

```
remotion/src/
├── index.ts
│   └── imports Root
├── Root.tsx
│   ├── imports PostVideo composition
│   ├── imports SlidePlan, ThemePack types from @video-gen/contracts
│   ├── imports getThemeById from @video-gen/contracts
│   └── registers Composition
├── compositions/PostVideo.tsx
│   ├── imports Layer, Slide, ThemePack types
│   ├── imports Slide component
│   └── handles Series sequencing
└── components/Slide.tsx
    ├── imports Layer, Slide, ThemePack types
    ├── has TextLayerView component
    └── has ShapeLayerView component

packages/contracts/src/
├── index.ts
│   ├── exports from slide-plan.ts
│   ├── exports from themes.ts
│   ├── exports from templates.ts
│   └── exports from validate-slide-plan.ts
├── slide-plan.ts (Types & Zod schemas)
├── themes.ts (ThemePack type definition)
├── templates.ts (VideoTemplate definitions)
└── validate-slide-plan.ts (Validation function)
```

## Animation Enhancement Points

```
Current: Static rendering
    ↓
Enhancement Layer 1: Add frame-based logic
    ├── useCurrentFrame() hook
    ├── useVideoConfig() for dimensions
    └── interpolate() for animations
    ↓
Enhancement Layer 2: Extend TextLayer schema
    ├── animation?: "fade-in" | "slide-in" | "typewriter" | ...
    ├── animationDuration?: number (frames)
    └── animationDelay?: number (frames)
    ↓
Enhancement Layer 3: Implement in TextLayerView
    └── Apply frame-based transforms/opacity
```

## Styling Scope

### What Can Be Animated
- ✓ Opacity (fade-in/fade-out)
- ✓ Transform (translate, scale, rotate)
- ✓ Color transitions
- ✓ Visibility/clipping (character reveal)

### Current CSS Properties in TextLayerView
```css
position: absolute
top/bottom/left/right: length or percentage
transform: translateY(-50%) [for center region only]
color: theme.colors.foreground
fontFamily: from theme
fontSize: 36-56px [role-based]
fontWeight: 600
lineHeight: 1.15
textAlign: center
whiteSpace: pre-wrap
```

### Unused CSS for Animation
```css
opacity: [1 → 0] (fade effect)
transform: [translate, scale, rotate] (entry/emphasis)
filter: [blur, brightness, contrast] (advanced effects)
clip-path: [polygon] (text reveal)
text-shadow: [for glow effects]
```

## Performance Considerations

### Current Rendering
- Frame duration per slide: 150 frames (5 seconds at 30fps)
- Per-frame render: Re-renders Slide component for each frame
- No memoization currently applied

### For Animation Implementation
- Consider: `useMemo()` for expensive calculations
- Consider: `React.memo()` for components that don't change
- Frame-based calculations should be lightweight
- Avoid recursive/expensive string operations in typewriter effect

---

## Summary of Key Locations

| What | Where | Why Important |
|------|-------|---------------|
| **Text rendering** | `Slide.tsx` lines 21-49 | PRIMARY ANIMATION TARGET |
| **Layer data model** | `slide-plan.ts` lines 81-90 | Extension point for animation config |
| **Theme/styling** | `themes.ts` | Style constants |
| **Video composition** | `PostVideo.tsx` | Timeline setup (5-sec slides) |
| **Type definitions** | `slide-plan.ts` | Data structure contract |
| **Remotion setup** | `Root.tsx` | Composition metadata (FPS, duration) |
