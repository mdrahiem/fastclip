// apps/web/app/routes/index.tsx


import { useNavigate } from "@tanstack/react-router";
import { JobForm } from "@/lib/components/JobForm";

export default function IndexPage() {
  const navigate = useNavigate();

  const handleSuccess = (jobId: string) => {
    navigate({ to: `/dashboard/${jobId}` });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Create Your Hiring Video
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enter 4 job titles and we'll generate a professional 15-second video
          for your recruitment campaign.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <JobForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
