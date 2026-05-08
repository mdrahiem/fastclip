import { existsSync, rmSync } from "node:fs";
import { and, eq, gt, lt } from "drizzle-orm";

import { getDb } from "../db";
import { jobs } from "../db/schema";
import { getJobDir, getRemotionPublicAudioPath } from "./job-paths";

/** Deletes expired completed/failed jobs, their `data/jobs/<id>/` dirs, and `remotion/public` audio. */
export function runCleanupSweep(nowMs: number = Date.now()): void {
  const db = getDb();
  const stale = db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(lt(jobs.deleteAfter, nowMs), gt(jobs.deleteAfter, 0)))
    .all();

  for (const { id } of stale) {
    if (!id) continue;

    try {
      const jobDir = getJobDir(id);
      if (existsSync(jobDir)) rmSync(jobDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }

    try {
      const audio = getRemotionPublicAudioPath(id);
      if (existsSync(audio)) rmSync(audio, { force: true });
    } catch {
      /* ignore */
    }

    db.delete(jobs).where(eq(jobs.id, id)).run();
  }
}
