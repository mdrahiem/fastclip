import { useCurrentFrame, interpolate, Easing } from "remotion";

export type UseWeAreHiringAnimationProps = {
  bulletIndex: number; // 0-3 for the 4 bullet points
  totalBullets: number; // Always 4
  headerStartFrame: number; // When header finishes fading in
  bulletStartDelay: number; // Frames before first bullet starts
  bulletStaggerDelay: number; // Frames between each bullet
  fadeDuration: number; // Duration of fade-in in frames
};

/**
 * Animation hook for We Are Hiring template
 * Sequence: Header fades in → bullets appear one by one with stagger
 */
export function useWeAreHiringAnimation({
  bulletIndex,
  totalBullets,
  headerStartFrame,
  bulletStartDelay,
  bulletStaggerDelay,
  fadeDuration,
}: UseWeAreHiringAnimationProps) {
  const frame = useCurrentFrame();

  // Header animation (always first 12 frames)
  const headerOpacity = interpolate(
    frame,
    [0, fadeDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Bullet animation - starts after header + delay, then staggered
  const bulletStartFrame = headerStartFrame + bulletStartDelay + bulletIndex * bulletStaggerDelay;
  const bulletEndFrame = bulletStartFrame + fadeDuration;

  const bulletOpacity = interpolate(
    frame,
    [bulletStartFrame, bulletEndFrame],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) }
  );

  // Subtle slide-up effect for bullets
  const bulletY = interpolate(
    frame,
    [bulletStartFrame, bulletEndFrame],
    [20, 0], // Slide up 20px
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) }
  );

  return {
    headerOpacity,
    bulletOpacity,
    bulletY,
  };
}
