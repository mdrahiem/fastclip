# Video generator from LinkedIn posts — design spec (v1)

**Date:** 2026-05-08  
**Status:** Draft for implementation planning  
**Scope:** First shippable pipeline—minimal catalog, anonymous web wizard, Remotion-backed MP4 export.

---

## 1. Problem and outcome

Build a **web application** that accepts a **pasted LinkedIn-style post** (English) and produces a **single downloadable MP4** that explains or amplifies the post as a **short multi-slide motion video**.

The system uses an **LLM** to interpret the post, choose content appropriate to a **user-selected story template** (fixed slide count, structure, and timing), and emit **structured props** consumed by **Remotion** compositions. **Background music** is mixed in. **No captions** and **no voiceover** in v1.

---

## 2. Goals (v1)

- **Guided wizard UX**: paste text → pick template → pick theme pack → pick aspect ratio → pick music source → generate → download.
- **One aspect ratio per run**: user selects **9:16** or **16:9** only.
- **One template and one theme pack** in the launch catalog (prove end-to-end quality and ops).
- **LLM-mediated planning**: slides + per-slide visual/text content mapped to a **stable JSON contract** for Remotion.
- **Anonymous use**: **no accounts**; minimize stored PII; **short-lived** server artifacts.
- **Rendering reliability over scale**: prefer the **simplest dependable** render path (see architecture).

---

## 3. Non-goals (v1)

- **Captions** / subtitles (burned-in or sidecar).
- **Voiceover** / TTS.
- **Multiple aspect ratios** in one job; **primary/secondary** render semantics.
- **User-supplied LLM keys** or model picker.
- **Non-English** posts and UI.
- **Opening outputs in Remotion Studio** or **exporting editable Remotion projects** for end users.
- **Chat-style agent UX** (optional transparency: progress steps only).
- **Rich per-slide image generation** (image models, stock APIs).
- **Large template/theme libraries** (defer until the pipeline is proven).

---

## 4. Personas and primary user

- **Creator / marketer**: repurposes a LinkedIn thought into a short vertical or horizontal clip for other channels.
- v1 assumes **technical comfort with “generate and download”**; no onboarding beyond the wizard.

---

## 5. User journey (happy path)

1. User opens the web app (anonymous session established, e.g. signed session cookie).
2. **Paste** post text (English); enforce **max length** (exact limit TBD in implementation; start generous, e.g. 8–12k chars, with clear UI error).
3. Select **template** (v1: single option; UI may still show a disabled/teased state if needed for marketing).
4. Select **theme pack** (v1: single option).
5. Select **aspect ratio**: **9:16** or **16:9**.
6. Select **music**:
   - choose from **built-in licensed/royalty-safe** track list, or
   - **upload** audio (MP3/WAV; validate MIME, duration cap, file size cap).
7. Tap **Generate**:
   - server validates inputs,
   - LLM produces **SlidePlan** (see §7),
   - Remotion render produces MP4,
   - user receives **download** (direct response or short-lived URL).
8. Session artifacts are **deleted** per retention policy (§10).

---

## 6. System architecture (recommended)

### 6.1 High-level components

| Component | Responsibility |
|-----------|----------------|
| **Web client** | Wizard UI, upload handling (chunked or presigned if needed later), progress polling, download. |
| **API service** | Auth/session, validation, orchestration, persistence of job metadata. |
| **Planner (LLM)** | Normalized prompt + post text → `SlidePlan` JSON (schema-validated). |
| **Renderer** | Remotion CLI/programmatic render: `SlidePlan` + theme + music + ratio → MP4. |
| **Storage** | Temporary object storage or local disk (v1); **no long-term user library**. |

### 6.2 Rendering topology (v1 recommendation)

**Single-node or small worker deployment** running Remotion renders **as subprocess/programmatic renders** on the same machine as the worker (or a dedicated “render” container). Optional **in-memory or Redis-backed** job queue if concurrent renders become necessary.

**Rationale:** Minimizes moving parts while the team validates quality, prompts, and failure modes. Migrate to **object storage + signed URLs + horizontal workers** when concurrent load or reliability demands it.

**Deferred option:** Serverless render (e.g. Remotion Lambda). Revisit when scale/cost profile is known.

### 6.3 Data flow

```
Post text + user choices
        → API creates Job (queued/running)
        → Planner LLM returns SlidePlan
        → Validate SlidePlan against JSON Schema
        → Renderer builds Remotion input bundle (props + assets + normalized audio)
        → ffmpeg/Remotion outputs MP4
        → Expose download
        → Schedule deletion of intermediates + final file
```

---

## 7. Contracts and schemas

### 7.1 SlidePlan (LLM output)

The LLM must output **only** JSON conforming to a **versioned schema** (e.g. `slidePlanVersion: 1`).

**Conceptual shape** (exact fields defined in implementation):

- **`meta`**: optional title, overall tone flags (bounded enum), warnings if post was thin.
- **`slides`**: array length **must match** the selected template’s required count.
- **Per slide**:
  - `slideId` / index
  - **`layers`**: ordered list of visual elements (text blocks, shapes, simple diagram primitives)
  - **Timing**: either **inherited from template** (preferred v1) or explicit per-layer keyframes—**v1 should inherit template timing** to reduce LLM liability; LLM supplies **content**, not frame-accurate animation curves.

**Validation:** Reject invalid plans before render; return a **user-safe error** (“We couldn’t generate a valid video plan—try editing the post or shortening it”) and log server-side detail.

### 7.2 Template definition (code-owned)

Templates are **not** LLM-generated: they define:

- `id`, human name, description
- `slideCount`
- **Per-slide duration** (seconds) and transition style (enum)
- **Allowed layer types** and **max counts** (e.g. at most 3 text blocks, 2 shapes)
- **Safe layout grid** hints (regions) the LLM may target with bounded parameters

### 7.3 Theme pack definition (code-owned)

Theme packs define:

- Color tokens (background, foreground, accent)
- Typography tokens (font family from an **allowlist** of web-licensed fonts)
- Shape stroke/fill defaults
- Motion presets (e.g. enter animation style—keep **small enum** in v1)

### 7.4 Remotion mapping

Each template has a **Remotion composition** (or one composition with template-driven branching, but prefer **separate compositions** if templates diverge later). Props = `{ slidePlan, theme, aspectRatio, audio }`.

---

## 8. LLM planning

### 8.1 Provider

**Single provider/model** configured via server environment (operator-owned key). Users do not supply keys.

### 8.2 Prompting strategy

- System instructions: output **JSON only**, obey schema, respect **slide count**, respect **layer limits**, **English only**, avoid PII hallucination; do not invent facts not supported by the post unless explicitly marked as “suggested hook” (v1: prefer **no unsupported claims**; tighten in prompts).
- Use **structured outputs** or JSON schema constraints if the provider supports them; otherwise **parse + repair** with a single retry on failure.

### 8.3 Failure modes

- Truncation / invalid JSON → retry once with “fix to valid JSON” nudge.
- After max failures → fail job with user-safe message.

---

## 9. Audio

- **Built-in tracks**: ship a **small curated set** with clear licensing documentation in the repo (`LICENSE-ASSETS.md` or similar).
- **Uploads**: validate type and duration; **normalize loudness** (implementation detail: ffmpeg loudnorm or simple volume adjust) before muxing.
- **Mixing**: duck music slightly only if needed when text hits are loud (v1 likely **static music bed**).

---

## 10. Security, privacy, and retention

- **Anonymous sessions**: sign cookies; rate-limit per IP + per session.
- **Content**: treat pasted post text as **sensitive**; **do not** log full raw text at INFO level; redact in logs.
- **Retention**:
  - **Uploaded music** and **render outputs** deleted **within 24 hours** of job completion (v1 default); tune down to **1 hour** once stable.
  - **Intermediate frames** on disk cleaned up immediately after mux completes.
- **Abuse**: max upload size, max concurrent jobs per session, basic content length limits.

---

## 11. Observability and ops

- Metrics: job status counts, render duration, LLM latency, failure reasons (categorized).
- Tracing: correlate `jobId` across API, LLM, render.
- Alerting: optional v1; at minimum **error rate** logs for render failures.

---

## 12. Error handling (UX)

| Failure | User-visible behavior |
|--------|------------------------|
| Invalid input | Inline validation on wizard. |
| LLM plan invalid | Friendly retry suggestion; offer “shorten post.” |
| Render crash | “Rendering failed—try again”; support collects `jobId`. |
| Music upload invalid | Specific file requirement message. |

---

## 13. Testing strategy

- **Schema tests**: golden `SlidePlan` fixtures per template.
- **Render smoke tests**: CI runs a **tiny** composition render at low resolution (if feasible) or mocks Remotion invoke in unit tests; at minimum **local script** for developers.
- **LLM tests**: offline recorded responses for parser/validator; optional eval harness later.

---

## 14. Milestone after v1 (not in this spec)

- Additional templates/theme packs.
- Captions.
- Optional **project export** for Remotion Studio for advanced users.
- Multiple outputs per run with **primary-first** success semantics (per earlier exploration—explicitly deferred).
- Explore **Remotion Skills** if they map cleanly to `SlidePlan` and reduce maintenance.

---

## 15. Open decisions (implementation plan should close these)

- Exact **max post length**, **upload size cap**, and **music duration cap**.
- **Hosting** target (single VM vs container vs PaaS) and whether to introduce **Redis** on day one or only when concurrency appears.
- **Download mechanism**: synchronous render for short jobs vs poll/WebSocket for long renders.
- **Font delivery** strategy in Remotion (bundled vs Google Fonts pipeline) consistent with licensing.

---

## 16. Acceptance criteria (v1)

- Anonymous user can complete the wizard and receive a **valid MP4** for **each** supported aspect ratio using the **single** shipped template/theme.
- Invalid LLM outputs never crash the renderer; jobs fail gracefully.
- Server deletes temporary files per retention policy.
- Built-in and uploaded music both mux successfully under nominal cases.

---

*Self-review (2026-05-08): No placeholders left as “TBD” without ownership—remaining items are explicitly listed in §15 for the implementation plan. Architecture matches brainstormed constraints. Scope is consistent with single template/theme v1.*
