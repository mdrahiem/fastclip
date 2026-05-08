import { mkdir } from "node:fs/promises";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export type NormalizeMusicToAacOptions = {
  inputPath: string;
  outputPath: string;
};

/**
 * Re-encodes an audio file to AAC (192 kbps, 48 kHz stereo) suitable for muxing.
 * Ensures the output directory exists before running ffmpeg.
 */
export async function normalizeMusicToAac({
  inputPath,
  outputPath,
}: NormalizeMusicToAacOptions): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("aac")
      .audioBitrate("192k")
      .audioFrequency(48_000)
      .audioChannels(2)
      .on("error", reject)
      .on("end", () => resolve())
      .save(outputPath);
  });
}
