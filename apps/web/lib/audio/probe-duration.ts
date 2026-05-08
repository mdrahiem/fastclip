import { spawn } from "node:child_process";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

/**
 * Reads duration using the bundled ffmpeg binary only (`ffmpeg -i` stderr).
 * Avoids `ffprobe`, which is a separate executable and often missing from PATH.
 */
export async function probeAudioDurationSec(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegInstaller.path,
      ["-hide_banner", "-i", inputPath],
      { stdio: ["ignore", "ignore", "pipe"] },
    );

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
      if (!m) {
        reject(
          new Error(
            `ffmpeg could not read duration for "${inputPath}". First stderr lines: ${stderr
              .split("\n")
              .slice(0, 6)
              .join(" | ")}`,
          ),
        );
        return;
      }

      const hh = Number(m[1]);
      const mm = Number(m[2]);
      const ss = Number(m[3]);
      if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) {
        reject(new Error("ffmpeg returned non-numeric duration."));
        return;
      }

      resolve(hh * 3600 + mm * 60 + ss);
    });
  });
}
