// apps/web/lib/components/JobStatus.tsx

import type { JobStatusResponse } from "@video-gen/contracts";

interface JobStatusProps {
  status: JobStatusResponse | null;
  jobId: string;
}

export function JobStatus({ status, jobId }: JobStatusProps) {
  if (!status) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">Waiting for job status...</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    queued: "bg-blue-50 text-blue-700 border-blue-200",
    rendering: "bg-yellow-50 text-yellow-700 border-yellow-200",
    complete: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  const color = statusColors[status.status] || "bg-gray-50";

  return (
    <div className={`p-4 border rounded-lg ${color}`}>
      <div className="mb-2">
        <p className="text-sm font-semibold">Job {jobId.slice(0, 8)}…</p>
      </div>

      <div className="space-y-1 text-sm">
        <p>
          Status: <strong className="capitalize">{status.status}</strong>
        </p>
        {status.step && (
          <p>
            Step:{" "}
            <code className="text-xs bg-black bg-opacity-10 px-1 py-0.5 rounded">
              {status.step}
            </code>
          </p>
        )}
        {status.errorMessage && (
          <p className="text-red-700 whitespace-pre-wrap break-words">
            Error: {status.errorMessage}
          </p>
        )}
      </div>

      {status.status === "queued" && (
        <p className="mt-3 text-xs text-gray-600">
          Your video is queued for rendering. This may take a few minutes on first run.
        </p>
      )}

      {status.status === "rendering" && (
        <p className="mt-3 text-xs text-gray-600">
          Rendering your video... Please keep this page open.
        </p>
      )}
    </div>
  );
}
