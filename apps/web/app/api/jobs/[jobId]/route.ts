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

  return NextResponse.json({
    status: row.status,
    step: row.step,
    ...(row.errorMessage ? { errorMessage: row.errorMessage } : {}),
  });
}
