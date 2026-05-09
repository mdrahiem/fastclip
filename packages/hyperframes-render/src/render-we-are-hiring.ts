// packages/hyperframes-render/src/render-we-are-hiring.ts

import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import type { AspectRatio, JobTitles } from "@video-gen/contracts";

export interface RenderOptions {
  jobTitles: JobTitles;
  aspectRatio: AspectRatio;
  outputPath: string;
  musicPath: string;
  hyperframesCliPath?: string;
}

function generateHtmlComposition(
  jobTitles: JobTitles,
  aspectRatio: AspectRatio,
  musicPath: string
): string {
  const dimensions =
    aspectRatio === "9:16"
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 };

  // Timing: 15 seconds total, 4 titles with staggered animations
  // Each title: 0.6s animation + 3.2s display (except last)
  const animationDelays = [0, 0.8, 1.6, 2.4];

  const titleDivs = jobTitles
    .map(
      (title, index) =>
        `<div class="title" style="animation: slideIn 0.6s ease-out ${animationDelays[index]}s forwards; font-size: 3rem; color: white; font-weight: bold; text-align: center; margin: 20px; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">${escapeHtml(title)}</div>`
    )
    .join("\n");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>We Are Hiring</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      overflow: hidden;
    }
    
    .container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 40px;
    }
    
    .title {
      opacity: 0;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(-100px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${titleDivs}
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export async function renderWeAreHiringVideo(
  options: RenderOptions
): Promise<void> {
  const {
    jobTitles,
    aspectRatio,
    outputPath,
    musicPath,
    hyperframesCliPath = "hyperframes",
  } = options;

  // Generate HTML composition
  const htmlComposition = generateHtmlComposition(
    jobTitles,
    aspectRatio,
    musicPath
  );

  // Create temp file for HTML
  const tempDir = path.dirname(outputPath);
  const tempHtmlPath = path.join(tempDir, "composition.html");

  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(tempHtmlPath, htmlComposition, "utf-8");

  // Call Hyperframes CLI to render
  // Exact command depends on Hyperframes API; adjust based on actual CLI
  // For now, assuming: hyperframes render --html <file> --output <file> --duration 15 --audio <file> --fps 30

  return new Promise((resolve, reject) => {
    const child = spawn(hyperframesCliPath, [
      "render",
      "--html",
      tempHtmlPath,
      "--output",
      outputPath,
      "--duration",
      "15",
      "--audio",
      musicPath,
      "--fps",
      "30",
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", async (code) => {
      // Clean up temp HTML file
      try {
        await fs.unlink(tempHtmlPath);
      } catch {
        // Ignore cleanup errors
      }

      if (code !== 0) {
        reject(
          new Error(
            `Hyperframes render failed with code ${code}: ${stderr || stdout}`
          )
        );
      } else {
        resolve();
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn Hyperframes CLI: ${err.message}`));
    });
  });
}
