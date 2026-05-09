/**
 * Hook for calculating slide crossfade transitions
 * Provides fade-out for current slide and fade-in for next slide
 */

import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, Easing, interpolate } from "remotion";

export interface SlideTransitionConfig {
  /** Duration of this slide in frames */
  slideDurationInFrames: number;
  /** Duration of transition effect in frames (350ms at 30fps ≈ 10 frames) */
  transitionDurationFrames?: number;
  /** Whether this slide should fade out at the end */
  fadeOutAtEnd?: boolean;
}

export interface SlideTransitionValues {
  /** Opacity for fade effect (0-1) during transition */
  opacity: number;
  /** Whether the slide is currently in transition */
  isInTransition: boolean;
}

/**
 * Calculate slide opacity during transition
 * Creates crossfade effect: fade-out at end of slide, fade-in at start
 */
export function useSlideTransition({
  slideDurationInFrames,
  transitionDurationFrames = 10, // 350ms at 30fps ≈ 10 frames
  fadeOutAtEnd = true,
}: SlideTransitionConfig): SlideTransitionValues {
  const frame = useCurrentFrame();

  return useMemo(() => {
    // Calculate fade-out period (last frames of slide)
    const fadeOutStartFrame = slideDurationInFrames - transitionDurationFrames;
    const fadeOutRelativeFrame = frame - fadeOutStartFrame;

    // Check if we're in the fade-out zone
    const isInFadeOut = fadeOutRelativeFrame >= 0 && fadeOutRelativeFrame <= transitionDurationFrames;

    let opacity = 1; // Default: fully opaque

    if (isInFadeOut && fadeOutAtEnd) {
      // Calculate fade-out progress (0 to 1)
      const fadeOutProgress = fadeOutRelativeFrame / transitionDurationFrames;

      // Apply easing for smooth fade-out
      const easedProgress = Easing.out(Easing.ease)(fadeOutProgress);

      // Interpolate opacity from 1 to 0
      opacity = interpolate(easedProgress, [0, 1], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }

    return {
      opacity,
      isInTransition: isInFadeOut,
    };
  }, [frame, slideDurationInFrames, transitionDurationFrames, fadeOutAtEnd]);
}

export interface SlideFadeInConfig {
  /** Duration of fade-in animation in frames (350ms at 30fps ≈ 10 frames) */
  fadeInDurationFrames?: number;
}

export interface SlideFadeInValues {
  /** Opacity for fade-in effect (0-1) */
  opacity: number;
  /** Whether fade-in animation is complete */
  isComplete: boolean;
}

/**
 * Calculate opacity for slide fade-in effect
 * Used when a new slide enters
 */
export function useSlideFadeIn({
  fadeInDurationFrames = 10, // 350ms at 30fps
}: SlideFadeInConfig): SlideFadeInValues {
  const frame = useCurrentFrame();

  return useMemo(() => {
    // Fade in happens in first frames of slide
    if (frame >= fadeInDurationFrames) {
      // Fade-in is complete
      return {
        opacity: 1,
        isComplete: true,
      };
    }

    // Calculate fade-in progress (0 to 1)
    const fadeInProgress = frame / fadeInDurationFrames;

    // Apply easing for smooth fade-in
    const easedProgress = Easing.out(Easing.ease)(fadeInProgress);

    // Interpolate opacity from 0 to 1
    const opacity = interpolate(easedProgress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      opacity,
      isComplete: false,
    };
  }, [frame, fadeInDurationFrames]);
}
