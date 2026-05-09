import {
  AbsoluteFill,
  Audio,
  Series,
  staticFile,
} from "remotion";
import type { SlidePlan, ThemePack } from "@video-gen/contracts";
import { Slide } from "../components/Slide";
import { SlideWrapper } from "../components/SlideWrapper";

export type PostVideoProps = {
  slidePlan: SlidePlan;
  slideDurationsSec: number[];
  theme: ThemePack;
  aspectRatioId: "9:16" | "16:9";
  audioSrc: string;
};

const FPS = 30;

export function PostVideo({
  slidePlan,
  slideDurationsSec,
  theme,
  audioSrc,
}: PostVideoProps) {
  const slides = slidePlan.slides;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      <Series>
        {slides.map((slide, i) => {
          const sec = slideDurationsSec[i] ?? 0;
          const durationInFrames = Math.round(sec * FPS);
          return (
            <Series.Sequence
              key={slide.index}
              durationInFrames={durationInFrames}
            >
              <SlideWrapper durationInFrames={durationInFrames}>
                <Slide slide={slide} theme={theme} />
              </SlideWrapper>
            </Series.Sequence>
          );
        })}
      </Series>
      {audioSrc ? (
        <Audio src={staticFile(audioSrc)} />
      ) : null}
    </AbsoluteFill>
  );
}
