// packages/hyperframes-render/src/render-we-are-hiring.ts

import { execFile } from "child_process";
import { promisify } from "util";
import { mkdirSync, copyFileSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to the hyperframes CLI — resolve relative to this file's actual location
const PACKAGE_DIR = resolve(__dirname, ".."); // packages/hyperframes-render/src → packages/hyperframes-render

function findHfBin(): string {
  const candidates = [
    join(PACKAGE_DIR, "node_modules/.bin/hyperframes"),
    join(PACKAGE_DIR, "../node_modules/.pnpm/node_modules/.bin/hyperframes"),
    join(PACKAGE_DIR, "../../node_modules/.pnpm/node_modules/.bin/hyperframes"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    `hyperframes CLI not found. Run: pnpm add hyperframes --filter @video-gen/hyperframes-render\nSearched:\n  ${candidates.join("\n  ")}`
  );
}

const HF_BIN = findHfBin();

export interface RenderWeAreHiringOptions {
  jobTitles: string[];            // exactly 4 titles
  aspectRatio: "9:16" | "16:9";
  outputPath: string;
  musicPath?: string;
  /** unused — kept for API compat */
  hyperframesCliPath?: string;
}

export async function renderWeAreHiringVideo(
  opts: RenderWeAreHiringOptions
): Promise<void> {
  const { jobTitles, aspectRatio, outputPath, musicPath } = opts;

  if (jobTitles.length !== 4) {
    throw new Error(`Expected exactly 4 job titles, got ${jobTitles.length}`);
  }

  // ── 1. Create a temp project directory ────────────────────────────
  const outDir = dirname(outputPath);
  const projectDir = join(outDir, "hf-project");
  mkdirSync(projectDir, { recursive: true });

  // ── 2. Copy composition into project (patching dimensions for portrait) ─
  const compositionSrc = resolve(__dirname, "compositions/we-are-hiring.html");
  let htmlContent = readFileSync(compositionSrc, "utf-8");

  if (aspectRatio === "9:16") {
    // HyperFrames reads data-width/data-height from static HTML to set the
    // Chrome viewport BEFORE JS runs. Patch them here so the viewport is
    // correctly set to 1080×1920, otherwise everything below y=1080 is cut.
    htmlContent = htmlContent
      // Update all clip data-width/data-height attributes
      .replaceAll('data-width="1920"', 'data-width="1080"')
      .replaceAll('data-height="1080"', 'data-height="1920"')
      // CSS: html, body dimensions
      .replace(
        'width: 1920px;\n      height: 1080px;\n      overflow: hidden;\n      background: #000814;',
        'width: 1080px;\n      height: 1920px;\n      overflow: hidden;\n      background: #000814;'
      );
  }

  writeFileSync(join(projectDir, "index.html"), htmlContent, "utf-8");

  // ── 3. Write meta.json (required by Hyperframes) ──────────────────
  writeFileSync(
    join(projectDir, "meta.json"),
    JSON.stringify({
      name: "we-are-hiring",
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }),
    "utf-8"
  );

  // ── 4. Copy music if provided ──────────────────────────────────────
  if (musicPath) {
    try {
      const ext = musicPath.split(".").pop() ?? "mp3";
      copyFileSync(musicPath, join(projectDir, `music.${ext}`));
    } catch {
      console.warn(`[render] Could not copy music from ${musicPath} — skipping`);
    }
  }

  // ── 5. Build --variables JSON ──────────────────────────────────────
  const variables = JSON.stringify({
    title1: jobTitles[0],
    title2: jobTitles[1],
    title3: jobTitles[2],
    title4: jobTitles[3],
    aspectRatio,
  });

  // ── 6. Run `hyperframes render` ───────────────────────────────────
  const args = [
    "render",
    "--input", projectDir,
    "--output", outputPath,
    "--variables", variables,
    "--fps", "30",
    "--quality", "standard",
    "--quiet",
  ];

  console.log(`[render] hyperframes render → ${outputPath}`);
  console.log(`[render] variables: ${variables}`);

  try {
    const { stdout, stderr } = await execFileAsync(HF_BIN, args, {
      timeout: 5 * 60 * 1000, // 5 min max
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    if (stdout) console.log("[render]", stdout.trim());
    if (stderr) console.warn("[render stderr]", stderr.trim());
  } catch (err: any) {
    const msg = err?.stderr || err?.stdout || err?.message || String(err);
    throw new Error(`Hyperframes render failed: ${msg}`);
  } finally {
    // ── 7. Clean up temp project ────────────────────────────────────
    rmSync(projectDir, { recursive: true, force: true });
  }

  console.log(`[render] ✓ Done → ${outputPath}`);
}
