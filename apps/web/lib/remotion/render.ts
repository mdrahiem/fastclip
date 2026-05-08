import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import type { FfmpegOverrideFn } from "@remotion/renderer";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type {
  AspectRatioId,
  SlidePlan,
  ThemePack,
} from "@video-gen/contracts";

const REMOTION_HELPER_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Repo root-relative path to Remotion CLI entry (`remotion/src/index.ts`). */
export const DEFAULT_REMOTION_ENTRY = path.resolve(
  REMOTION_HELPER_DIR,
  "..",
  "..",
  "..",
  "remotion",
  "src",
  "index.ts",
);

export type RenderRequest = {
  remotionEntry: string;
  outputLocation: string;
  slidePlan: SlidePlan;
  slideDurationsSec: number[];
  theme: ThemePack;
  aspectRatioId: AspectRatioId;
  audioSrc: string;
};

/** Same resolution as {@link DEFAULT_REMOTION_ENTRY}; useful when overriding cwd. */
export function resolveDefaultRemotionEntry(): string {
  return DEFAULT_REMOTION_ENTRY;
}

const ffmpegOverride: FfmpegOverrideFn = ({ args }) => [
  ...args,
  "-pix_fmt",
  "yuv420p",
];

/** Reuse Webpack bundle across jobs in this Node process (first render still pays bundle cost once). */
const bundleServeUrlCache = new Map<string, Promise<string>>();

function getCachedServeUrl(entryPoint: string): Promise<string> {
  let pending = bundleServeUrlCache.get(entryPoint);
  if (!pending) {
    pending = bundle({ entryPoint });
    bundleServeUrlCache.set(entryPoint, pending);
  }
  return pending;
}

export async function renderLinkedInPostVideo(
  req: RenderRequest,
): Promise<void> {
  const serveUrl = await getCachedServeUrl(req.remotionEntry);

  const composition = await selectComposition({
    serveUrl,
    id: "PostVideo",
    inputProps: {
      slidePlan: req.slidePlan,
      slideDurationsSec: req.slideDurationsSec,
      theme: req.theme,
      aspectRatioId: req.aspectRatioId,
      audioSrc: req.audioSrc,
    },
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: req.outputLocation,
    inputProps: {
      slidePlan: req.slidePlan,
      slideDurationsSec: req.slideDurationsSec,
      theme: req.theme,
      aspectRatioId: req.aspectRatioId,
      audioSrc: req.audioSrc,
    },
    chromeMode: "headless-shell",
    ffmpegOverride,
  });
}
