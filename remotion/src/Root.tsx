import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { SlidePlan } from "@video-gen/contracts";
import { getThemeById } from "@video-gen/contracts";
import { PostVideo, type PostVideoProps } from "./compositions/PostVideo";
import {
  TEST_SHORT_POST,
  TEST_MEDIUM_POST,
  TEST_LONG_POST,
  TEST_THEME,
  TEST_SLIDE_DURATIONS_SHORT,
  TEST_SLIDE_DURATIONS_MEDIUM,
  TEST_SLIDE_DURATIONS_LONG,
} from "./test-data";
import {
  WeAreHiringVideo,
  type WeAreHiringVideoProps,
} from "./compositions/WeAreHiringVideo";
import {
  TEST_HIRING_DATA_1,
  TEST_HIRING_DATA_2,
  TEST_HIRING_DATA_3,
  HIRING_VIDEO_DURATION_SECONDS,
} from "./test-hiring-data";

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

const calculateWeAreHiringMetadata: CalculateMetadataFunction<WeAreHiringVideoProps> = ({
  props,
}) => {
  return {
    fps: FPS,
    durationInFrames: props.durationInFrames,
    width: 1080,
    height: 1920,
  };
};

const defaultWeAreHiringProps: WeAreHiringVideoProps = {
  positions: ["", "", "", ""],
  theme: getThemeById("graph-paper-v1"),
  durationInFrames: 15 * FPS,
  audioSrc: "",
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

      {/* We Are Hiring Template - Production */}
      <Composition
        id="WeAreHiringVideo"
        component={WeAreHiringVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={15 * FPS}
        defaultProps={defaultWeAreHiringProps}
        calculateMetadata={calculateWeAreHiringMetadata}
      />

      {/* Test compositions for verification */}
      <Composition
        id="TestShortPost"
        component={PostVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={TEST_SLIDE_DURATIONS_SHORT[0]! * FPS}
        defaultProps={{
          slidePlan: TEST_SHORT_POST,
          slideDurationsSec: TEST_SLIDE_DURATIONS_SHORT,
          theme: TEST_THEME,
          aspectRatioId: "9:16",
          audioSrc: "",
        }}
        calculateMetadata={calculatePostVideoMetadata}
      />

      <Composition
        id="TestMediumPost"
        component={PostVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={
          TEST_SLIDE_DURATIONS_MEDIUM.reduce((acc, s) => acc + s, 0) * FPS
        }
        defaultProps={{
          slidePlan: TEST_MEDIUM_POST,
          slideDurationsSec: TEST_SLIDE_DURATIONS_MEDIUM,
          theme: TEST_THEME,
          aspectRatioId: "9:16",
          audioSrc: "",
        }}
        calculateMetadata={calculatePostVideoMetadata}
      />

      <Composition
        id="TestLongPost"
        component={PostVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={
          TEST_SLIDE_DURATIONS_LONG.reduce((acc, s) => acc + s, 0) * FPS
        }
        defaultProps={{
          slidePlan: TEST_LONG_POST,
          slideDurationsSec: TEST_SLIDE_DURATIONS_LONG,
          theme: TEST_THEME,
          aspectRatioId: "9:16",
          audioSrc: "",
        }}
        calculateMetadata={calculatePostVideoMetadata}
      />

      {/* We Are Hiring Template - Test compositions */}
      <Composition
        id="TestWeAreHiring1"
        component={WeAreHiringVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={HIRING_VIDEO_DURATION_SECONDS * FPS}
        defaultProps={{
          positions: TEST_HIRING_DATA_1.positions,
          theme: TEST_HIRING_DATA_1.theme,
          durationInFrames: HIRING_VIDEO_DURATION_SECONDS * FPS,
          audioSrc: "",
        }}
        calculateMetadata={calculateWeAreHiringMetadata}
      />

      <Composition
        id="TestWeAreHiring2"
        component={WeAreHiringVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={HIRING_VIDEO_DURATION_SECONDS * FPS}
        defaultProps={{
          positions: TEST_HIRING_DATA_2.positions,
          theme: TEST_HIRING_DATA_2.theme,
          durationInFrames: HIRING_VIDEO_DURATION_SECONDS * FPS,
          audioSrc: "",
        }}
        calculateMetadata={calculateWeAreHiringMetadata}
      />

      <Composition
        id="TestWeAreHiring3"
        component={WeAreHiringVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={HIRING_VIDEO_DURATION_SECONDS * FPS}
        defaultProps={{
          positions: TEST_HIRING_DATA_3.positions,
          theme: TEST_HIRING_DATA_3.theme,
          durationInFrames: HIRING_VIDEO_DURATION_SECONDS * FPS,
          audioSrc: "",
        }}
        calculateMetadata={calculateWeAreHiringMetadata}
      />
    </>
  );
}
