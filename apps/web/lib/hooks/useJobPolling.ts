// apps/web/lib/hooks/useJobPolling.ts

import { useEffect, useRef, useState } from "react";
import { getJobStatus } from "@/app/lib/api";
import { POLLING_INTERVAL_MS } from "@/lib/constants";
import type { JobStatusResponse } from "@/app/lib/api";

export function useJobPolling(jobId: string) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPolling) return;

    const poll = async () => {
      try {
        const result = await getJobStatus(jobId);
        setStatus(result);
        setError(null);

        if (result.status === "complete" || result.status === "failed") {
          setIsPolling(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch status");
        setIsPolling(false);
      }
    };

    void poll();
    timerRef.current = setInterval(poll, POLLING_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [jobId, isPolling]);

  return { status, error, isPolling };
}
