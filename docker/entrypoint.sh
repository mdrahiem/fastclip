#!/usr/bin/env bash
set -euo pipefail

pnpm --filter @video-gen/web db:migrate
pnpm --filter @video-gen/web worker &
worker_pid=$!

cleanup() {
  kill "${worker_pid}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

exec pnpm --filter @video-gen/web start -- -H 0.0.0.0 -p 3000
