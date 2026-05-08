import { getSqlite } from "../db";
import { runCleanupSweep } from "./cleanup";
import { processJob } from "./processJob";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Atomically claims one `queued` job (SQLite single-writer semantics).
 */
export function claimNextQueuedJobId(): string | undefined {
  const now = Date.now();
  const sqlite = getSqlite();
  const stmt = sqlite.prepare(
    `
    UPDATE jobs
    SET status = 'running',
        step = 'starting',
        updated_at = ?
    WHERE rowid = (
      SELECT rowid FROM jobs
      WHERE status = 'queued'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING id
    `,
  );
  const row = stmt.get(now) as { id: string } | undefined;
  return row?.id;
}

/** Poll roughly every {@link POLL_MS}; optional cleanup between iterations. */
const POLL_MS = 700;

export async function startJobWorker(options?: {
  abortSignal?: AbortSignal;
  /** Also run TTL cleanup periodically (cheap no-op when nothing expires). */
  cleanup?: boolean;
}): Promise<void> {
  const { abortSignal } = options ?? {};
  const cleanup = options?.cleanup ?? true;

  while (!abortSignal?.aborted) {
    if (cleanup) {
      try {
        runCleanupSweep();
      } catch {
        /* avoid taking down worker */
      }
    }

    const jobId = claimNextQueuedJobId();
    if (jobId) {
      await processJob(jobId);
    }

    await sleep(POLL_MS);
  }
}
