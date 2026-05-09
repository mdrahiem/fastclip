// apps/web/app/lib/api.ts
// Client-side API helpers — call the REST endpoints via fetch

export interface JobCreatePayload {
  jobTitles: string[];
  aspectRatio: "9:16" | "16:9";
}

export interface JobStatusResponse {
  jobId: string;
  status: "queued" | "rendering" | "complete" | "failed";
  step: string;
  errorMessage?: string;
  outputVideoPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobDetail extends JobStatusResponse {
  jobTitles: string[];
  aspectRatio: string;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function createJob(payload: JobCreatePayload): Promise<{ jobId: string }> {
  return apiFetch("/api/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return apiFetch(`/api/jobs/${jobId}/status`);
}

export function getJob(jobId: string): Promise<JobDetail> {
  return apiFetch(`/api/jobs/${jobId}`);
}

export interface UpdateJobPayload {
  jobTitles?: string[];
  aspectRatio?: "9:16" | "16:9";
}

export function updateJob(
  jobId: string,
  payload: UpdateJobPayload
): Promise<{ jobId: string }> {
  return apiFetch(`/api/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function openStudio(jobId: string): Promise<{ studioUrl: string }> {
  return apiFetch(`/api/jobs/${jobId}/studio`, { method: "POST" });
}
