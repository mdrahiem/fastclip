// packages/contracts/src/job-schema.ts

import { z } from "zod";

export const jobTitleSchema = z.string().min(1).max(100);

export const jobTitlesSchema = z.tuple([
  jobTitleSchema,
  jobTitleSchema,
  jobTitleSchema,
  jobTitleSchema,
]);

export const aspectRatioSchema = z.enum(["9:16", "16:9"]);

export const createJobSchema = z.object({
  jobTitles: jobTitlesSchema,
  aspectRatio: aspectRatioSchema,
});

export const updateJobSchema = z.object({
  jobTitles: jobTitlesSchema,
  aspectRatio: aspectRatioSchema,
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
