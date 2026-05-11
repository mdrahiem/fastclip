#!/bin/sh
set -e

echo "[startup] Starting FastClip container..."
echo "[startup] CWD: $(pwd)"
echo "[startup] PORT: ${PORT}"
echo "[startup] DATABASE_URL: ${DATABASE_URL}"

# Ensure data directory exists (volume mount point)
mkdir -p /app/data/jobs

# Initialize/update database schema on the persistent volume
# Release commands in Fly.io don't have volume access, so we do it here
# DATABASE_URL must be absolute (file:/app/data/app.db) so it resolves correctly
# regardless of which directory we run prisma from
if [ ! -f "/app/data/app.db" ]; then
  echo "[startup] Database not found at /app/data/app.db, running prisma db push..."
  (cd /app/apps/web && pnpm exec prisma db push --accept-data-loss --skip-generate)
  echo "[startup] prisma db push completed"
else
  echo "[startup] Database exists at /app/data/app.db, skipping prisma db push"
fi

# Verify dist directory exists for static file serving
if [ ! -d "/app/apps/web/dist" ]; then
  echo "[startup] WARNING: /app/apps/web/dist not found, static files will 404"
fi

# Start production server (web + worker)
echo "[startup] Starting production server..."
# Use node --import tsx instead of npx tsx for more predictable behavior in pnpm workspaces
exec node --import tsx apps/web/server/production.ts
