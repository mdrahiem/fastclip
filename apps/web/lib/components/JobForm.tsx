// apps/web/lib/components/JobForm.tsx

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchema } from "@video-gen/contracts";
import { createJob } from "@/server/rpc/jobs";
import { ASPECT_RATIOS } from "@/lib/constants";
import type { CreateJobInput } from "@video-gen/contracts";

interface JobFormProps {
  onSuccess: (jobId: string) => void;
  isLoading?: boolean;
}

export function JobForm({ onSuccess, isLoading = false }: JobFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      jobTitles: ["", "", "", ""],
      aspectRatio: ASPECT_RATIOS.PORTRAIT,
    },
  });

  const onSubmit = async (data: CreateJobInput) => {
    try {
      setApiError(null);
      const result = await createJob(data);
      onSuccess(result.jobId);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create job");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-900">
          Job Titles
        </label>
        <p className="text-sm text-gray-600">
          Enter 4 job titles that will appear in your video
        </p>

        {[0, 1, 2, 3].map((index) => (
          <Controller
            key={index}
            name={`jobTitles.${index}` as const}
            control={control}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="text"
                  placeholder={`Job title ${index + 1}`}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.jobTitles?.[index]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-primary"
                  }`}
                />
                {errors.jobTitles?.[index] && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.jobTitles[index]?.message}
                  </p>
                )}
              </div>
            )}
          />
        ))}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">
          Aspect Ratio
        </label>
        <Controller
          name="aspectRatio"
          control={control}
          render={({ field }) => (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...field}
                  value={ASPECT_RATIOS.PORTRAIT}
                  checked={field.value === ASPECT_RATIOS.PORTRAIT}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  Portrait (9:16) - Mobile
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...field}
                  value={ASPECT_RATIOS.LANDSCAPE}
                  checked={field.value === ASPECT_RATIOS.LANDSCAPE}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  Landscape (16:9) - Desktop
                </span>
              </label>
            </div>
          )}
        />
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isSubmitting ? "Generating..." : "Generate Video"}
      </button>
    </form>
  );
}
