import {
  AbsoluteFill,
  Audio,
  Series,
  staticFile,
} from "remotion";
import type { SlidePlan, ThemePack } from "@video-gen/contracts";
import { Slide } from "../components/Slide";

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
          return (
            <Series.Sequence
              key={slide.index}
              durationInFrames={Math.round(sec * FPS)}
            >
              <Slide slide={slide} theme={theme} />
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
