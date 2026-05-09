/**
 * Hook for calculating text entrance animations
 * Provides frame-based opacity values for staggered text fade-ins
 */

import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, Easing, interpolate } from "remotion";

export interface TextAnimationConfig {
  /** Index of the text element (0 = first, 1 = second, etc.) */
  textIndex: number;
  /** Total number of text elements on this slide */
  totalTexts: number;
  /** Animation start frame (when to begin entrance) */
  startFrame?: number;
  /** Duration of fade-in animation in frames (400ms at 30fps = 12 frames) */
  fadeDuration?: number;
  /** Delay between each text element entrance in frames (180ms at 30fps = 5.4 ≈ 6 frames) */
  staggerDelay?: number;
}

export interface TextAnimationValues {
  /** Opacity value (0-1) for current frame */
  opacity: number;
  /** Whether animation has completed */
  isAnimationComplete: boolean;
  /** Current animation progress (0-1) */
  progress: number;
}

/**
 * Calculate opacity value for text entrance animation
 * Uses Easing.out(Easing.ease) for smooth, professional fade-in
 * Each text element staggers with delay between them
 */
export function useTextAnimation({
  textIndex,
  totalTexts,
  startFrame = 0,
  fadeDuration = 12, // 400ms at 30fps
  staggerDelay = 6, // 180ms stagger between elements at 30fps
}: TextAnimationConfig): TextAnimationValues {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return useMemo(() => {
    // Calculate when this specific text element should start its animation
    const elementStartFrame = startFrame + textIndex * staggerDelay;

    // Calculate frames relative to this element's start
    const relativeFrame = frame - elementStartFrame;

    // Determine if animation is in progress or complete
    const isInProgress = relativeFrame >= 0 && relativeFrame <= fadeDuration;
    const isAnimationComplete = relativeFrame > fadeDuration;

    // Calculate progress (0 to 1)
    let progress = 0;
    if (relativeFrame >= 0) {
      progress = Math.min(1, relativeFrame / fadeDuration);
    }

    // Apply easing function for smooth fade-in
    const easedProgress = Easing.out(Easing.ease)(progress);

    // Calculate opacity using interpolation
    const opacity = interpolate(easedProgress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      opacity,
      isAnimationComplete: isAnimationComplete || progress >= 1,
      progress,
    };
  }, [frame, textIndex, startFrame, fadeDuration, staggerDelay]);
}

export interface MultiTextAnimationConfig {
  /** Total number of text elements to animate */
  totalTexts: number;
  /** Animation start frame (when to begin entrance) */
  startFrame?: number;
  /** Duration of fade-in animation in frames */
  fadeDuration?: number;
  /** Delay between each text element entrance in frames */
  staggerDelay?: number;
}

export interface MultiTextAnimationValues {
  /** Array of opacity values for each text element */
  opacities: number[];
  /** Whether all animations have completed */
  allAnimationsComplete: boolean;
  /** Overall progress (0-1) for the entire text group animation */
  overallProgress: number;
}

/**
 * Hook for animating multiple text elements with staggered entrance
 * Returns opacity array for each text element
 */
export function useMultiTextAnimation({
  totalTexts,
  startFrame = 0,
  fadeDuration = 12,
  staggerDelay = 6,
}: MultiTextAnimationConfig): MultiTextAnimationValues {
  const opacitiesArray = useMemo(() => {
    return Array.from({ length: totalTexts }, (_, i) => i);
  }, [totalTexts]);

  // Use the single text animation for each element
  const animationResults = opacitiesArray.map((textIndex) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTextAnimation({
      textIndex,
      totalTexts,
      startFrame,
      fadeDuration,
      staggerDelay,
    });
  });

  return useMemo(() => {
    const opacities = animationResults.map((result) => result.opacity);
    const allComplete = animationResults.every((result) => result.isAnimationComplete);

    // Overall progress is based on the last element's animation
    const lastAnimationProgress =
      animationResults[Math.max(0, totalTexts - 1)]?.progress ?? 0;

    return {
      opacities,
      allAnimationsComplete: allComplete,
      overallProgress: lastAnimationProgress,
    };
  }, [animationResults, totalTexts]);
}
