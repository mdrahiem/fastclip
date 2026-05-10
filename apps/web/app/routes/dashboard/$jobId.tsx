// apps/web/app/routes/dashboard/$jobId.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useJobPolling } from "@/lib/hooks/useJobPolling";
import { getJob } from "@/app/lib/api";
import type { JobDetail, JobStatusResponse } from "@/app/lib/api";
import { JobStatus } from "@/lib/components/JobStatus";
import { VideoPlayer } from "@/lib/components/VideoPlayer";

export default function DashboardPage() {
  const { jobId } = useParams({ strict: false });
  const navigate = useNavigate();

  const [jobDetails, setJobDetails] = useState<JobDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load full job details once (and again when polling marks complete)
  const loadDetails = async () => {
    try {
      const details = await getJob(jobId);
      setJobDetails(details);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDetails();
  }, [jobId]);

  // Poll status — when it flips to complete, refresh job details so
  // outputVideoPath is available for the player.
  const { status, error: pollingError } = useJobPolling(jobId, {
    onComplete: () => void loadDetails(),
  });

  // Derive the effective status: prefer live polling status, but fall back
  // to what we loaded from the DB (covers the case where the job was already
  // complete before this page opened).
  const effectiveStatus: JobStatusResponse | null = status ?? (
    jobDetails
      ? {
          jobId: jobDetails.jobId,
          status: jobDetails.status as JobStatusResponse["status"],
          step: jobDetails.step,
          errorMessage: jobDetails.errorMessage,
          outputVideoPath: jobDetails.outputVideoPath,
          createdAt: jobDetails.createdAt,
          updatedAt: jobDetails.updatedAt,
        }
      : null
  );

  const isComplete = effectiveStatus?.status === "complete";
  const isFailed = effectiveStatus?.status === "failed";
  const error = pollingError || loadError;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-600">Loading job…</p>
      </div>
    );
  }

  if (error && !jobDetails) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Job <span className="font-mono text-base text-gray-500">{jobId.slice(0, 8)}…</span>
        </h2>
        <button
          onClick={() => navigate({ to: "/" })}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
        >
          ＋ Create New
        </button>
      </div>

      {/* Status card */}
      <JobStatus status={effectiveStatus} jobId={jobId} />

      {/* Video player — shown once complete */}
      {isComplete && (
        <div className="space-y-3">
          <VideoPlayer videoPath={jobDetails?.outputVideoPath ?? ""} jobId={jobId} />

          <button
            onClick={() => navigate({ to: `/edit/${jobId}` })}
            className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
          >
            ✏️ Edit & Re-render
          </button>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
          <p className="text-red-700 font-semibold">Video generation failed</p>
          {effectiveStatus?.errorMessage && (
            <p className="text-sm text-red-600 font-mono break-all">
              {effectiveStatus.errorMessage}
            </p>
          )}
          <button
            onClick={() => navigate({ to: `/edit/${jobId}` })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Edit & Try Again
          </button>
        </div>
      )}
    </div>
  );
}
