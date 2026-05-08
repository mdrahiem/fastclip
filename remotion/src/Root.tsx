import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { SlidePlan } from "@video-gen/contracts";
import { getThemeById } from "@video-gen/contracts";
import { PostVideo, type PostVideoProps } from "./compositions/PostVideo";

const FPS = 30;

const defaultSlidePlan: SlidePlan = {
  slidePlanVersion: 1,
  meta: { title: "Sample post video" },
  slides: [
    {
      index: 0,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "Stop scrolling — this one habit will save you hours every week.",
          region: "center",
        },
      ],
    },
    {
      index: 1,
      layers: [
        {
          type: "text",
          role: "body",
          text: "Batch shallow tasks, protect a 90-minute deep-work block, and review outcomes at day end.",
          region: "center",
        },
      ],
    },
    {
      index: 2,
      layers: [
        {
          type: "text",
          role: "cta",
          text: "Follow for more concise breakdowns like this.",
          region: "center",
        },
      ],
    },
  ],
};

const defaultPostVideoProps: PostVideoProps = {
  slidePlan: defaultSlidePlan,
  slideDurationsSec: [5, 5, 5],
  theme: getThemeById("graph-paper-v1"),
  aspectRatioId: "9:16",
  audioSrc: "",
};

const calculatePostVideoMetadata: CalculateMetadataFunction<PostVideoProps> = ({
  props,
}) => {
  const durationInFrames =
    props.slideDurationsSec.reduce((acc, s) => acc + s, 0) * FPS;
  const portrait = props.aspectRatioId === "9:16";
  return {
    fps: FPS,
    durationInFrames,
    width: portrait ? 1080 : 1920,
    height: portrait ? 1920 : 1080,
  };
};

export function Root() {
  return (
    <>
      <Composition
        id="PostVideo"
        component={PostVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={15 * FPS}
        defaultProps={defaultPostVideoProps}
        calculateMetadata={calculatePostVideoMetadata}
      />
    </>
  );
}
