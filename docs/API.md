# API Documentation

This document describes the REST API endpoints for the Video Generator application.

All endpoints are prefixed with `/api` and require a valid session cookie for authentication. The session cookie (`session`) is automatically set on the first request and refreshed on every response.

---

## Authentication

All endpoints (except health checks) require a session cookie. The server automatically creates and validates sessions using signed JWTs.

**Session Cookie:**
- Name: `session`
- Type: Signed JWT (HS256)
- Expiration: 30 days
- Flags: HTTPOnly, SameSite=Lax

If the session cookie is missing or invalid, a new session is created automatically. Users can only access jobs created within their own session.

---

## Endpoints

### Create Job

Creates a new video generation job.

```
POST /api/jobs
```

**Request Body:**
```json
{
  "jobTitles": ["Senior Engineer", "Product Manager", "UX Designer", "Data Scientist"],
  "aspectRatio": "9:16"
}
```

**Validation:**
- `jobTitles`: Array of exactly 4 strings, each 1-100 characters
- `aspectRatio`: Must be `"9:16"` or `"16:9"`

**Response (201 Created):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**
- `400 Bad Request` — Validation failed (missing titles, invalid aspect ratio)
- `429 Too Many Requests` — Rate limit exceeded (10 jobs/hour per session)

---

### Get Job

Retrieves full details for a specific job.

```
GET /api/jobs/:jobId
```

**Response (200 OK):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "complete",
  "step": "complete",
  "jobTitles": ["Senior Engineer", "Product Manager", "UX Designer", "Data Scientist"],
  "aspectRatio": "9:16",
  "errorMessage": null,
  "outputVideoPath": "/path/to/data/jobs/550e8400-e29b-41d4-a716-446655440000/output.mp4",
  "createdAt": "2025-05-09T12:00:00.000Z",
  "updatedAt": "2025-05-09T12:00:30.000Z"
}
```

**Errors:**
- `404 Not Found` — Job does not exist or belongs to another session

---

### Get Job Status

Lightweight endpoint for polling job status.

```
GET /api/jobs/:jobId/status
```

**Response (200 OK):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "rendering",
  "step": "rendering",
  "errorMessage": null,
  "outputVideoPath": null,
  "createdAt": "2025-05-09T12:00:00.000Z",
  "updatedAt": "2025-05-09T12:00:15.000Z"
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `queued` | Job is waiting in the queue |
| `rendering` | Worker is currently rendering the video |
| `complete` | Video rendered successfully |
| `failed` | Rendering failed (see `errorMessage`) |

**Errors:**
- `404 Not Found` — Job does not exist or belongs to another session

---

### Update Job

Creates a new job with updated titles/aspect ratio. The original job is not modified.

```
PATCH /api/jobs/:jobId
```

**Request Body:**
```json
{
  "jobTitles": ["Staff Engineer", "Product Lead", "UX Researcher", "ML Engineer"],
  "aspectRatio": "16:9"
}
```

**Validation:**
- Same as `POST /api/jobs`
- All fields are optional, but at least one must be provided

**Response (201 Created):**
```json
{
  "jobId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Behavior:**
- Validates ownership of the original job
- Creates a **new** job record with the updated data
- Returns the new `jobId`
- The new job starts with `status: "queued"`

**Errors:**
- `400 Bad Request` — Validation failed
- `404 Not Found` — Original job does not exist or belongs to another session
- `429 Too Many Requests` — Rate limit exceeded

---

### Download Video

Streams or downloads the rendered MP4 video.

```
GET /api/jobs/:jobId/download
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `dl` | Set to `1` to force download (attachment). Omit for inline streaming. |

**Examples:**
```
# Stream for <video> player
GET /api/jobs/:jobId/download

# Force download as attachment
GET /api/jobs/:jobId/download?dl=1
```

**Response:**
- `200 OK` — Video stream with `Content-Type: video/mp4`
- `206 Partial Content` — Range request for video seeking
- Headers include `Accept-Ranges: bytes` for native video player support

**Errors:**
- `400 Bad Request` — Video not ready (status !== complete)
- `404 Not Found` — Job does not exist or belongs to another session

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

For validation errors:
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "jobTitles": ["Expected array, received string"]
    }
  }
}
```

---

## Rate Limiting

- **Limit:** 10 jobs per session per hour
- **Affected endpoints:** `POST /api/jobs`, `PATCH /api/jobs/:jobId`
- **Response when exceeded:** `429 Too Many Requests`

```json
{
  "error": "Rate limit exceeded. Maximum 10 jobs per hour."
}
```

---

## Frontend API Client

The frontend uses a thin wrapper around `fetch` in `apps/web/app/lib/api.ts`:

```typescript
import {
  createJob,
  getJob,
  getJobStatus,
  updateJob,
} from "@/app/lib/api";

// Create a job
const { jobId } = await createJob({
  jobTitles: ["Engineer", "PM", "Designer", "Data"],
  aspectRatio: "9:16",
});

// Poll status
const status = await getJobStatus(jobId);

// Get full details
const job = await getJob(jobId);

// Update (creates new job)
const { jobId: newJobId } = await updateJob(jobId, {
  jobTitles: ["Staff Engineer", "Lead PM", "Senior Designer", "ML Engineer"],
});
```

All requests automatically include:
- `Content-Type: application/json` header
- `credentials: "include"` for cookie transmission

---

## Data Models

### Job

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique job identifier |
| `sessionId` | string (UUID) | Owner session |
| `jobTitles` | string (JSON) | Array of 4 title strings |
| `aspectRatio` | string | `"9:16"` or `"16:9"` |
| `status` | string | `queued`, `rendering`, `complete`, `failed` |
| `step` | string | Current processing step |
| `errorMessage` | string? | Error details if failed |
| `outputVideoPath` | string? | Absolute path to rendered MP4 |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `deleteAfter` | BigInt | Unix ms when job should be auto-deleted |
