// packages/contracts/src/types.ts

export type JobTitles = [string, string, string, string];
export type AspectRatio = "9:16" | "16:9";
export type JobStatus = "queued" | "rendering" | "complete" | "failed";

export interface CreateJobInput {
  jobTitles: JobTitles;
  aspectRatio: AspectRatio;
}

export interface CreateJobOutput {
  jobId: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  step: string;
  errorMessage?: string;
}

export interface JobDetailsResponse {
  id: string;
  jobTitles: JobTitles;
  aspectRatio: AspectRatio;
  status: JobStatus;
  step: string;
  errorMessage?: string;
  outputVideoPath?: string;
  createdAt: Date;
}

export interface UpdateJobInput {
  jobTitles: JobTitles;
  aspectRatio: AspectRatio;
}

export interface UpdateJobOutput {
  jobId: string;
}
