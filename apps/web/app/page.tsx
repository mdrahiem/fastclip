"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StatusBody = {
  status: string;
  step?: string;
  errorMessage?: string;
};

function readFileAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function WizardPage() {
  const [postText, setPostText] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [musicMode, setMusicMode] = useState<"builtin" | "upload">("builtin");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusBody | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const poll = useCallback((id: string) => {
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { credentials: "include" });
        if (!res.ok) {
          setError(await res.text());
          clearInterval(timerRef.current);
          return;
        }
        const data = (await res.json()) as StatusBody;
        setStatus(data);
        if (data.status === "complete" || data.status === "failed") {
          clearInterval(timerRef.current);
        }
      } catch {
        setError("Status check failed.");
        clearInterval(timerRef.current);
      }
    };
    void tick();
    timerRef.current = setInterval(tick, 700);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  async function onGenerate() {
    setError(null);
    setSubmitting(true);
    setJobId(null);
    setStatus(null);

    try {
      let base64Music: string | undefined;
      if (musicMode === "upload") {
        if (!file) {
          setError("Choose an audio file for upload.");
          setSubmitting(false);
          return;
        }
        base64Music = await readFileAsBase64(file);
      }

      const payload = {
        postText,
        aspectRatio,
        musicMode,
        builtinTrackId: musicMode === "builtin" ? "default" : undefined,
        base64Music,
        templateId: "linkedin-three-beat-v1" as const,
        themeId: "graph-paper-v1" as const,
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(raw?.error ?? "Could not queue job.");
        setSubmitting(false);
        return;
      }
      const id = raw.jobId as string | undefined;
      if (!id) {
        setError("No job id returned.");
        setSubmitting(false);
        return;
      }
      setJobId(id);
      poll(id);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  const showDownload = jobId && status?.status === "complete";

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "48px 20px",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        color: "#0f172a",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: "1.75rem", letterSpacing: "-0.03em", marginBottom: "0.35rem" }}>
        LinkedIn post → video
      </h1>
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: "28px" }}>
        Paste your draft, choose layout and audio, run the worker beside the web app,
        then download an MP4.
      </p>

      <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
        Post text
      </label>
      <textarea
        value={postText}
        name="postText"
        aria-label="Post text"
        onChange={(e) => setPostText(e.target.value)}
        placeholder="Paste your LinkedIn post…"
        rows={9}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #cbd5e1",
          fontSize: "0.9375rem",
          resize: "vertical",
          marginBottom: "20px",
        }}
      />

      <fieldset
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: "20px",
        }}
      >
        <legend style={{ padding: "0 6px", fontWeight: 600 }}>Aspect ratio</legend>
        <label style={{ marginRight: "20px", cursor: "pointer" }}>
          <input
            type="radio"
            name="ratio"
            value="9:16"
            checked={aspectRatio === "9:16"}
            onChange={() => setAspectRatio("9:16")}
          />{" "}
          9 : 16 (portrait)
        </label>
        <label style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="ratio"
            value="16:9"
            checked={aspectRatio === "16:9"}
            onChange={() => setAspectRatio("16:9")}
          />{" "}
          16 : 9 (landscape)
        </label>
      </fieldset>

      <fieldset
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: "24px",
        }}
      >
        <legend style={{ padding: "0 6px", fontWeight: 600 }}>Music</legend>
        <label style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
          <input
            type="radio"
            name="music"
            checked={musicMode === "builtin"}
            onChange={() => setMusicMode("builtin")}
          />
          Built-in track <span style={{ color: "#94a3b8" }}>(default)</span>
        </label>
        <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="radio"
            name="music"
            checked={musicMode === "upload"}
            onChange={() => setMusicMode("upload")}
          />
          Upload audio file
        </label>
        {musicMode === "upload" ? (
          <input
            type="file"
            accept="audio/*"
            style={{ marginTop: "12px", width: "100%" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        ) : null}
      </fieldset>

      <button
        type="button"
        onClick={() => void onGenerate()}
        disabled={submitting || !postText.trim()}
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: 12,
          border: "none",
          fontWeight: 600,
          fontSize: "1rem",
          cursor:
            submitting || !postText.trim() ? "not-allowed" : "pointer",
          background:
            submitting || !postText.trim() ? "#cbd5f5" : "linear-gradient(135deg,#6366f1,#7c3aed)",
          color: "#fafafa",
          marginBottom: "20px",
        }}
      >
        {submitting ? "Queued…" : "Generate"}
      </button>

      {error ? (
        <p style={{ color: "#b91c1c", fontSize: "0.9rem", marginBottom: "12px" }}>
          {error}
        </p>
      ) : null}

      {jobId ? (
        <section
          style={{
            padding: "16px 18px",
            borderRadius: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Job {jobId.slice(0, 8)}…</p>
          {status ? (
            <div style={{ color: "#334155", fontSize: "0.95rem" }}>
              <div>
                Status:{" "}
                <strong>{status.status}</strong>
              </div>
              {status.step ? (
                <div>
                  Step: <code>{status.step}</code>
                </div>
              ) : null}
              {status.step === "rendering" ? (
                <p style={{ marginTop: "10px", fontSize: "0.875rem", color: "#64748b" }}>
                  Bundling and encoding can take a long time on the first run (often 10–20+ minutes).
                  Keep this terminal&apos;s worker running; later videos reuse the bundle and are faster.
                </p>
              ) : null}
              {status.step === "planning" ? (
                <p style={{ marginTop: "10px", fontSize: "0.875rem", color: "#64748b" }}>
                  Calling the language model to structure your slides…
                </p>
              ) : null}
              {status.status === "queued" ? (
                <p style={{ marginTop: "10px", fontSize: "0.875rem", color: "#64748b" }}>
                  The worker hasn&apos;t picked up this job yet. In a second terminal at the repo root, run{" "}
                  <code style={{ fontSize: "0.8rem" }}>pnpm --filter @video-gen/web worker</code> and
                  leave it running. Reload if it was already running — you may need a restart after updating env paths.
                </p>
              ) : null}
              {status.errorMessage ? (
                <p style={{ color: "#b45309", marginTop: "8px" }}>
                  {status.errorMessage}
                </p>
              ) : null}
            </div>
          ) : (
            <p style={{ margin: 0 }}>Waiting for worker…</p>
          )}
          {showDownload ? (
            <a
              href={`/api/jobs/${jobId}/download`}
              style={{
                display: "inline-block",
                marginTop: "14px",
                padding: "10px 14px",
                borderRadius: 10,
                background: "#0f172a",
                color: "#f8fafc",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Download MP4
            </a>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
