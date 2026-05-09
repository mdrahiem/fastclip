/**
 * SlideWrapper component that applies fade-in and fade-out transitions
 * Wraps each slide to create smooth crossfades between slides
 */

import { AbsoluteFill } from "remotion";
import { useSlideFadeIn } from "../hooks/useSlideTransition";

type SlideWrapperProps = {
  children: React.ReactNode;
  durationInFrames: number;
};

/**
 * Wrapper that applies fade-in animation to slide entrance
 * Fade-in: 10 frames (~350ms at 30fps)
 */
export function SlideWrapper({ children, durationInFrames }: SlideWrapperProps) {
  const fadeIn = useSlideFadeIn({ fadeInDurationFrames: 10 });

  return (
    <AbsoluteFill style={{ opacity: fadeIn.opacity }}>
      {children}
    </AbsoluteFill>
  );
}
