// apps/web/lib/components/VideoPlayer.tsx

interface VideoPlayerProps {
  videoPath: string;
  jobId: string;
}

export function VideoPlayer({ videoPath, jobId }: VideoPlayerProps) {
  const downloadUrl = `/api/jobs/${jobId}/download`;

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          key={videoPath}
          className="w-full"
          controls
          style={{ aspectRatio: "16 / 9" }}
        >
          <source src={videoPath} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="flex gap-4">
        <a
          href={downloadUrl}
          download
          className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
        >
          Download MP4
        </a>
      </div>
    </div>
  );
}
