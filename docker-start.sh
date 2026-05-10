#!/bin/sh
set -e

# Ensure data directory exists (volume mount point)
mkdir -p /app/data/jobs

# Initialize/update database schema on the persistent volume
# Release commands in Fly.io don't have volume access, so we do it here
# Must run from apps/web where prisma is installed, using pnpm exec
if [ ! -f "/app/data/app.db" ]; then
  echo "[startup] Database not found, running prisma db push..."
  (cd /app/apps/web && pnpm exec prisma db push --accept-data-loss --skip-generate)
else
  echo "[startup] Database exists, skipping prisma db push"
fi

# Start production server (web + worker)
echo "[startup] Starting production server..."
exec npx tsx apps/web/server/production.ts
