// apps/web/app/routes/edit/$jobId.tsx

"use client";

import { useEffect, useState } from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { getJob } from "@/server/rpc/jobs";
import { EditForm } from "@/lib/components/EditForm";

function EditPage() {
  const { jobId } = useParams({ from: "/edit/$jobId" });
  const navigate = useNavigate();
  const [jobDetails, setJobDetails] = useState<Awaited<ReturnType<typeof getJob>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        setIsLoading(true);
        const details = await getJob(jobId);
        setJobDetails(details);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobDetails();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (error || !jobDetails) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error || "Job not found"}</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const handleSuccess = (newJobId: string) => {
    navigate({ to: `/dashboard/$jobId`, params: { jobId: newJobId } });
  };

  const handleCancel = () => {
    navigate({ to: `/dashboard/$jobId`, params: { jobId } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Edit Job {jobId.slice(0, 8)}…
        </h2>
        <p className="text-gray-600">
          Modify the job titles and aspect ratio, then re-render your video.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <EditForm
          jobId={jobId}
          initialTitles={jobDetails.jobTitles}
          initialAspectRatio={jobDetails.aspectRatio as "9:16" | "16:9"}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/edit/$jobId")({
  component: EditPage,
});
