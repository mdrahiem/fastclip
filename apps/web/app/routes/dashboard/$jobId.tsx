// apps/web/app/routes/dashboard/$jobId.tsx

"use client";

import { useEffect, useState } from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useJobPolling } from "@/lib/hooks/useJobPolling";
import { getJob } from "@/server/rpc/jobs";
import { JobStatus } from "@/lib/components/JobStatus";
import { VideoPlayer } from "@/lib/components/VideoPlayer";

function DashboardPage() {
  const { jobId } = useParams({ from: "/dashboard/$jobId" });
  const navigate = useNavigate();
  const { status, error: pollingError } = useJobPolling(jobId);
  const [jobDetails, setJobDetails] = useState<Awaited<ReturnType<typeof getJob>> | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        setIsLoading(true);
        const details = await getJob(jobId);
        setJobDetails(details);
        setDetailsError(null);
      } catch (err) {
        setDetailsError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobDetails();
  }, [jobId]);

  const error = pollingError || detailsError;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (error) {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Job {jobId.slice(0, 8)}…
        </h2>
        <button
          onClick={() => navigate({ to: "/" })}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Create New
        </button>
      </div>

      <JobStatus status={status} jobId={jobId} />

      {status?.status === "complete" && jobDetails?.outputVideoPath && (
        <div className="space-y-4">
          <VideoPlayer videoPath={jobDetails.outputVideoPath} jobId={jobId} />

          <button
            onClick={() => navigate({ to: `/edit/$jobId`, params: { jobId } })}
            className="w-full px-6 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            Edit & Re-render
          </button>
        </div>
      )}

      {status?.status === "failed" && (
        <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">Video generation failed</p>
          <button
            onClick={() => navigate({ to: `/edit/$jobId`, params: { jobId } })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/$jobId")({
  component: DashboardPage,
});
