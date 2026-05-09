// apps/web/app/routes/api/jobs/$jobId/download.ts

import { promises as fs } from "fs";
import { getDb } from "@/server/db";

export async function GET(req: Request, context: any) {
  const jobId = context.params.jobId;

  if (!jobId || typeof jobId !== "string") {
    return new Response("Invalid job ID", { status: 400 });
  }

  try {
    const db = getDb();
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return new Response("Job not found", { status: 404 });
    }

    if (job.status !== "complete" || !job.outputVideoPath) {
      return new Response("Video not ready for download", { status: 400 });
    }

    // Read video file
    const filePath = job.outputVideoPath;
    const fileContent = await fs.readFile(filePath);

    // Return with appropriate headers
    return new Response(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="hiring-video-${jobId}.mp4"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return new Response("Failed to download video", { status: 500 });
  }
}
