# Text Animation Implementation Roadmap

## Current State
- **Static text rendering** with no frame-based animations
- Text appears immediately and remains for entire slide duration
- No transitions or emphasis effects
- Basic role-based styling (hook, body, cta, label)

## Primary Target Component
**File**: `/remotion/src/components/Slide.tsx`
**Lines**: 21-49 (TextLayerView function)
**Current approach**: Returns static styled `<div>` with no animation logic

## Animation Enhancement Strategy

### Phase 1: Foundation (Add Frame Awareness)

**Objective**: Enable frame-based calculations in TextLayerView

**Changes Required**:
```typescript
// Current:
function TextLayerView({ layer, theme }) {
  // No frame awareness
  return <div style={{...}}>{layer.text}</div>
}

// Enhanced:
function TextLayerView({ layer, theme }) {
  const frame = useCurrentFrame(); // NEW: Access current frame
  const { fps } = useVideoConfig();  // NEW: Get FPS for time calculations
  
  // Apply animation transforms based on frame
  const animationStyle = calculateAnimationStyle(frame, layer);
  
  return <div style={{ ...baseStyle, ...animationStyle }}>
    {layer.text}
  </div>
}
```

**Remotion APIs to use**:
- `useCurrentFrame()` - Returns current frame number (0-150 for 5 sec slide)
- `useVideoConfig()` - Returns { fps, width, height, durationInFrames }
- `interpolate(frame, [start, end], [from, to])` - Linear interpolation
- `spring({}) ` - Spring animation easing

### Phase 2: Data Structure (Extend Layer Schema)

**File**: `/packages/contracts/src/slide-plan.ts`
**Target**: TextLayerSchema (lines 81-90)

**Add animation metadata**:
```typescript
export const TextLayerSchema = z.object({
  type: z.literal("text"),
  role: TextRoleEnum,
  text: z.string().min(1).max(500),
  region: z.preprocess(normalizeRegion, REGION_ENUM),
  
  // NEW FIELDS:
  animation: z.enum([
    "none",
    "fade-in",
    "slide-in-left",
    "slide-in-right",
    "slide-in-up",
    "slide-in-down",
    "scale-in",
    "typewriter",
    "bounce-in"
  ]).optional().default("none"),
  
  animationDurationFrames: z.number().min(1).max(150).optional().default(30), // 1 sec
  animationDelayFrames: z.number().min(0).optional().default(0), // Start immediately
  
  animationEasing: z.enum([
    "linear",
    "ease-in",
    "ease-out",
    "ease-in-out"
  ]).optional().default("ease-out"),
});
```

### Phase 3: Animation Implementations

#### 3.1 Fade-In (Simplest - Start Here)
```typescript
function calculateFadeInStyle(currentFrame: number, animationDuration: number, delay: number) {
  const startFrame = delay;
  const endFrame = delay + animationDuration;
  
  if (currentFrame < startFrame) return { opacity: 0 };
  if (currentFrame >= endFrame) return { opacity: 1 };
  
  const progress = (currentFrame - startFrame) / animationDuration;
  return { opacity: interpolate(progress, [0, 1], [0, 1]) };
}
```

#### 3.2 Slide-In (Left/Right/Up/Down)
```typescript
function calculateSlideInStyle(
  currentFrame: number,
  duration: number,
  delay: number,
  direction: "left" | "right" | "up" | "down"
) {
  const startFrame = delay;
  const endFrame = delay + duration;
  
  if (currentFrame < startFrame) {
    // Set initial off-screen position
    const offset = direction === "left" ? -100 : direction === "right" ? 100 : 0;
    const offsetY = direction === "up" ? 100 : direction === "down" ? -100 : 0;
    return { 
      transform: `translate(${offset}px, ${offsetY}px)`,
      opacity: 0
    };
  }
  if (currentFrame >= endFrame) {
    return { transform: "translate(0, 0)", opacity: 1 };
  }
  
  const progress = (currentFrame - startFrame) / duration;
  // Calculate proportional position
  const offset = direction === "left" ? -100 * (1 - progress) : ...
  return { 
    transform: `translate(${offset}px, ${offsetY}px)`,
    opacity: progress
  };
}
```

#### 3.3 Typewriter Effect (Complex - Advanced)
```typescript
function calculateTypewriterStyle(
  currentFrame: number,
  text: string,
  duration: number,
  delay: number
) {
  const startFrame = delay;
  const endFrame = delay + duration;
  
  if (currentFrame < startFrame) return { opacity: 0 };
  
  const progress = Math.min((currentFrame - startFrame) / duration, 1);
  const visibleChars = Math.ceil(progress * text.length);
  const visibleText = text.slice(0, visibleChars);
  
  return {
    // Use overflow: hidden and pseudo-elements or substring rendering
    // This requires more complex implementation
  };
}
```

#### 3.4 Scale-In (Zoom Effect)
```typescript
function calculateScaleInStyle(currentFrame: number, duration: number, delay: number) {
  const startFrame = delay;
  const endFrame = delay + duration;
  
  if (currentFrame < startFrame) return { transform: "scale(0)", opacity: 0 };
  if (currentFrame >= endFrame) return { transform: "scale(1)", opacity: 1 };
  
  const progress = (currentFrame - startFrame) / duration;
  const scale = interpolate(progress, [0, 1], [0, 1]);
  
  return { 
    transform: `scale(${scale})`,
    opacity: progress
  };
}
```

### Phase 4: Integration (Update TextLayerView)

**File**: `/remotion/src/components/Slide.tsx`

```typescript
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

function TextLayerView({ layer, theme }: { 
  layer: Extract<Layer, { type: "text" }>; 
  theme: ThemePack;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const fontFamily = layer.role === "body" ? theme.fonts.body : theme.fonts.heading;
  const fontSize = layer.role === "hook" ? 56 : layer.role === "cta" ? 44 : 36;
  
  // Calculate animation style based on layer.animation
  const animationStyle = getAnimationStyle(
    frame,
    layer.animation || "none",
    layer.animationDurationFrames || 30,
    layer.animationDelayFrames || 0,
    layer.animationEasing || "ease-out"
  );
  
  return (
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
      ...animationStyle, // NEW: Add animation transforms
    }}>
      {layer.text}
    </div>
  );
}

// Helper function to dispatch animation type
function getAnimationStyle(
  frame: number,
  animation: string,
  duration: number,
  delay: number,
  easing: string
) {
  switch (animation) {
    case "fade-in":
      return calculateFadeInStyle(frame, duration, delay);
    case "slide-in-left":
      return calculateSlideInStyle(frame, duration, delay, "left");
    case "slide-in-right":
      return calculateSlideInStyle(frame, duration, delay, "right");
    case "scale-in":
      return calculateScaleInStyle(frame, duration, delay);
    case "typewriter":
      return calculateTypewriterStyle(frame, duration, delay);
    default:
      return {};
  }
}
```

### Phase 5: Update Root.tsx Default Props

**File**: `/remotion/src/Root.tsx`

Add animations to sample slides:

```typescript
const defaultSlidePlan: SlidePlan = {
  slides: [
    {
      index: 0,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "Stop scrolling — this one habit will save you hours every week.",
          region: "center",
          animation: "fade-in", // NEW
          animationDurationFrames: 30, // 1 second at 30fps
          animationDelayFrames: 0,
        },
      ],
    },
    // ... other slides
  ],
};
```

## Implementation Checklist

### Week 1: Foundation
- [ ] Add `useCurrentFrame()` and `useVideoConfig()` to TextLayerView
- [ ] Implement helper function structure
- [ ] Test frame value logging

### Week 2: Simple Animations
- [ ] Implement fade-in animation
- [ ] Implement scale-in animation
- [ ] Add animation fields to TextLayerSchema
- [ ] Update default props with sample animations

### Week 3: Advanced Animations
- [ ] Implement slide-in animations (all 4 directions)
- [ ] Add easing function support
- [ ] Test with multiple slides and delays

### Week 4: Polish & Testing
- [ ] Implement typewriter effect (if time permits)
- [ ] Test animation combinations
- [ ] Performance optimization (memoization)
- [ ] Update documentation

## Testing Strategy

### Unit Tests
- Test interpolation calculations
- Test animation style generation functions
- Validate edge cases (delay > slide duration, etc.)

### Integration Tests
- Render video with various animations
- Verify frame-accurate timing
- Check animation sequencing across slides

### Visual Tests
- Export sample videos with different animations
- Review frame-by-frame in video player
- Compare with design requirements

## Performance Optimization

### Current Concerns
- Frame calculations happen 150 times per slide per layer
- Each layer recalculates animation on every frame

### Optimization Strategies
```typescript
// Use useMemo for expensive calculations
const animationStyle = useMemo(() => {
  return getAnimationStyle(frame, ...);
}, [frame, layer.animation, layer.animationDurationFrames, ...]);

// Use React.memo for components that don't change
const TextLayerView = React.memo(({ layer, theme }) => { ... });
```

## Example: Complete Fade-In Animation

### Data Input (from Planner/API)
```json
{
  "type": "text",
  "role": "hook",
  "text": "Stop scrolling",
  "region": "center",
  "animation": "fade-in",
  "animationDurationFrames": 30,
  "animationDelayFrames": 0
}
```

### Timeline Visualization
```
Frame:  0    10    20    30   ...  150
        |     |     |     |        |
Opacity: 0   0.33  0.67  1.0  ..  1.0
        (Fading in for 30 frames, then solid)
```

### Rendered Output
- Frames 0-29: Text fades in from invisible to fully visible
- Frames 30-150: Text remains fully visible

---

## Next Steps After Implementation

1. **Add Slide Transitions**: Fade/slide out previous slide as next enters
2. **Add Word-Level Emphasis**: Highlight specific words with color/scale changes
3. **Add Sound Effects**: Sync animation with audio timing
4. **Add User Configuration UI**: Let users choose animations via web app
5. **Add Animation Presets**: Pre-configured animation sequences for different content types

## Resources

### Remotion Documentation
- Frame-based animations: https://www.remotion.dev/docs/animate
- useCurrentFrame hook: https://www.remotion.dev/docs/use-current-frame
- Interpolation: https://www.remotion.dev/docs/interpolate
- Spring animations: https://www.remotion.dev/docs/spring

### Related Files to Review
- `/remotion/src/components/Slide.tsx` - Main render target
- `/packages/contracts/src/slide-plan.ts` - Data schema
- `/remotion/src/Root.tsx` - Default props configuration
- `/remotion/remotion.config.ts` - Global Remotion config

