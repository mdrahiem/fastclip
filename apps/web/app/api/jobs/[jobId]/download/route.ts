import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const env = getEnv();
  const cookieStore = await cookies();
  const sessionId = verifySessionCookie(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    env.SESSION_SECRET,
  );
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const row = getDb().select().from(jobs).where(eq(jobs.id, jobId)).get();
  if (!row || row.sessionId !== sessionId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (row.status !== "complete") {
    return NextResponse.json({ error: "Video is not ready." }, { status: 409 });
  }

  const filePath = row.outputVideoPath;
  if (!filePath || !existsSync(filePath)) {
    return NextResponse.json({ error: "Download unavailable." }, { status: 404 });
  }

  const st = statSync(filePath);
  const rs = Readable.toWeb(createReadStream(filePath));

  return new Response(rs as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(st.size),
      "Content-Disposition": 'attachment; filename="video.mp4"',
    },
  });
}
