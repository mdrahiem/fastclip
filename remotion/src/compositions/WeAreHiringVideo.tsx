import { AbsoluteFill, Audio, staticFile } from "remotion";
import type { ThemePack } from "@video-gen/contracts";
import { WeAreHiringTemplate } from "../components/WeAreHiringTemplate";
import { SlideWrapper } from "../components/SlideWrapper";

export type WeAreHiringVideoProps = {
  positions: [string, string, string, string]; // Exactly 4 positions
  theme: ThemePack;
  durationInFrames: number;
  audioSrc?: string;
};

export function WeAreHiringVideo({
  positions,
  theme,
  durationInFrames,
  audioSrc,
}: WeAreHiringVideoProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      <SlideWrapper durationInFrames={durationInFrames}>
        <WeAreHiringTemplate positions={positions} theme={theme} />
      </SlideWrapper>
      {audioSrc ? (
        <Audio src={staticFile(audioSrc)} />
      ) : null}
    </AbsoluteFill>
  );
}
