// apps/web/lib/hooks/useJobPolling.ts

import { useEffect, useRef, useState } from "react";
import { getJobStatus } from "@/app/lib/api";
import { POLLING_INTERVAL_MS } from "@/lib/constants";
import type { JobStatusResponse } from "@/app/lib/api";

interface UseJobPollingOptions {
  /** Called once when the job transitions to "complete" */
  onComplete?: () => void;
  /** Called once when the job transitions to "failed" */
  onFailed?: () => void;
}

export function useJobPolling(jobId: string, opts: UseJobPollingOptions = {}) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs so callbacks don't need to be in the effect dependency array
  const onCompleteRef = useRef(opts.onComplete);
  const onFailedRef = useRef(opts.onFailed);
  onCompleteRef.current = opts.onComplete;
  onFailedRef.current = opts.onFailed;

  useEffect(() => {
    if (!isPolling) return;

    const poll = async () => {
      try {
        const result = await getJobStatus(jobId);
        setStatus(result);
        setError(null);

        if (result.status === "complete") {
          setIsPolling(false);
          onCompleteRef.current?.();
        } else if (result.status === "failed") {
          setIsPolling(false);
          onFailedRef.current?.();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch status");
        setIsPolling(false);
      }
    };

    void poll();
    timerRef.current = setInterval(poll, POLLING_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId, isPolling]);

  return { status, error, isPolling };
}
