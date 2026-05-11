#!/bin/sh
set -e

echo "[startup] Starting FastClip container..."
echo "[startup] CWD: $(pwd)"
echo "[startup] PORT: ${PORT}"
echo "[startup] DATABASE_URL: ${DATABASE_URL}"

# Ensure data directory exists (volume mount point)
mkdir -p /app/data/jobs

# Start the HTTP server IMMEDIATELY so Fly's proxy can connect during its
# ~8-second startup window. The health check at / only serves static files
# and does not need the database. API requests will work once DB is ready.
#
# DB initialization runs in a background subshell. On first boot it takes
# ~10s (prisma db push), which is longer than Fly's proxy startup timeout,
# so doing it before server.listen() causes the proxy to mark the machine
# as unreachable.
if [ ! -f "/app/data/app.db" ]; then
  echo "[startup] Database not found, will initialize in background..."
  (
    # Give the server a moment to start and pass Fly's startup check
    sleep 3
    echo "[startup-bg] Running prisma db push..."
    cd /app/apps/web && pnpm exec prisma db push --accept-data-loss --skip-generate
    echo "[startup-bg] prisma db push completed"
  ) &
fi

# Verify dist directory exists for static file serving
if [ ! -d "/app/apps/web/dist" ]; then
  echo "[startup] WARNING: /app/apps/web/dist not found, static files will 404"
fi

# Start production server (web + worker)
echo "[startup] Starting production server..."
exec node --import tsx apps/web/server/production.ts
