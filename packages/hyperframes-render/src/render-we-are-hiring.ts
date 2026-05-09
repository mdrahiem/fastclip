// packages/hyperframes-render/src/render-we-are-hiring.ts

import { execFile } from "child_process";
import { promisify } from "util";
import { mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";

const execFileAsync = promisify(execFile);

export interface RenderWeAreHiringOptions {
  jobTitles: string[];
  aspectRatio: "9:16" | "16:9";
  outputPath: string;
  musicPath?: string;
  /** unused — kept for API compat */
  hyperframesCliPath?: string;
}

// Dimensions per aspect ratio
const DIMENSIONS = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

const FPS = 30;
const DURATION_SEC = 15;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 450

function buildHtml(
  titles: string[],
  width: number,
  height: number,
  frameIndex: number
): string {
  const t = frameIndex / FPS; // current time in seconds

  // Each title appears for ~3.5s, fades in over 0.5s
  const titleDuration = DURATION_SEC / titles.length;

  const titleItems = titles
    .map((title, i) => {
      const start = i * titleDuration;
      const end = start + titleDuration;
      const fadeIn = 0.5;
      const fadeOut = 0.3;

      let opacity = 0;
      let translateY = 40;

      if (t >= start && t < end) {
        const elapsed = t - start;
        const remaining = end - t;

        if (elapsed < fadeIn) {
          opacity = elapsed / fadeIn;
          translateY = 40 * (1 - elapsed / fadeIn);
        } else if (remaining < fadeOut) {
          opacity = remaining / fadeOut;
          translateY = 0;
        } else {
          opacity = 1;
          translateY = 0;
        }
      }

      return `
        <div class="title-item" style="
          opacity: ${opacity.toFixed(4)};
          transform: translateY(${translateY.toFixed(2)}px);
          display: ${Math.abs(opacity) < 0.001 ? "none" : "block"};
        ">
          <div class="title-text">${escapeHtml(title)}</div>
          <div class="title-underline" style="width: ${(opacity * 80).toFixed(1)}%;"></div>
        </div>`;
    })
    .join("");

  // "We Are Hiring" headline — visible whole time
  const headlineOpacity = Math.min(1, t / 0.5);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${width}px;
    height: ${height}px;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Arial', sans-serif;
    overflow: hidden;
  }
  .headline {
    font-size: ${Math.round(height * 0.065)}px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: ${Math.round(height * 0.06)}px;
    opacity: ${headlineOpacity.toFixed(4)};
    text-shadow: 0 0 40px rgba(100,150,255,0.5);
  }
  .headline span {
    color: #7c6fff;
  }
  .title-item {
    text-align: center;
    margin-bottom: ${Math.round(height * 0.02)}px;
  }
  .title-text {
    font-size: ${Math.round(height * 0.05)}px;
    font-weight: 700;
    color: #e8e8ff;
    letter-spacing: 0.04em;
  }
  .title-underline {
    height: 3px;
    background: linear-gradient(90deg, #7c6fff, #06b6d4);
    margin: 8px auto 0;
    border-radius: 2px;
  }
</style>
</head>
<body>
  <div class="headline">We Are <span>Hiring</span></div>
  ${titleItems}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function renderWeAreHiringVideo(
  opts: RenderWeAreHiringOptions
): Promise<void> {
  const { jobTitles, aspectRatio, outputPath, musicPath } = opts;
  const { width, height } = DIMENSIONS[aspectRatio];

  // Ensure output dir exists
  const outDir = dirname(outputPath);
  mkdirSync(outDir, { recursive: true });

  const framesDir = join(outDir, "frames");
  mkdirSync(framesDir, { recursive: true });

  console.log(`Rendering ${TOTAL_FRAMES} frames (${width}x${height})…`);

  // Launch puppeteer
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--window-size=${width},${height}`,
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // Render each frame
    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const html = buildHtml(jobTitles, width, height, f);
      await page.setContent(html, { waitUntil: "load" });
      const framePath = join(framesDir, `frame${String(f).padStart(6, "0")}.png`);
      await page.screenshot({ path: framePath as `${string}.png`, type: "png" });

      if (f % 30 === 0) {
        process.stdout.write(`\r  Frame ${f}/${TOTAL_FRAMES}`);
      }
    }
    console.log(`\r  Frames rendered.              `);
  } finally {
    await browser.close();
  }

  // Encode with ffmpeg
  console.log("Encoding video with ffmpeg…");
  const ffmpegArgs = [
    "-y",
    "-r", String(FPS),
    "-i", join(framesDir, "frame%06d.png"),
  ];

  if (musicPath) {
    ffmpegArgs.push("-i", musicPath, "-shortest", "-map", "0:v:0", "-map", "1:a:0");
  }

  ffmpegArgs.push(
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "fast",
    "-crf", "23",
    outputPath
  );

  await execFileAsync("ffmpeg", ffmpegArgs);

  // Clean up frames
  rmSync(framesDir, { recursive: true, force: true });

  console.log(`✓ Video written to ${outputPath}`);
}
