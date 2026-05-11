# FastClip Dockerfile for Fly.io
# Builds and deploys the FastClip video generation app

FROM node:20-slim

# Install system dependencies for Chrome/Chromium and video processing
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome environment variables for HyperFrames
ENV CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install pnpm globally
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Copy workspace configuration first (for better layer caching)
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/hyperframes-render/package.json packages/hyperframes-render/package.json
COPY prisma ./prisma

# Install dependencies (no lockfile yet, so we can't use --frozen-lockfile)
RUN pnpm install

# Install tsx locally for runtime TypeScript execution
RUN pnpm add -D tsx -w

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build frontend assets
RUN pnpm build

# Create data directory for SQLite and job outputs
RUN mkdir -p /app/data/jobs

# Copy startup script
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# Set production environment
ENV NODE_ENV=production
# Absolute path required: prisma commands and server may run from different directories
ENV DATABASE_URL=file:/app/data/app.db
ENV HYPERFRAMES_CLI_PATH=hyperframes
ENV PUBLIC_MUSIC_PATH=./apps/web/public/music/default.mp3
ENV PORT=8080
# IMPORTANT: Change this to a secure random string before production use
# Generate with: openssl rand -base64 32
ENV SESSION_SECRET=fastclip-change-me-before-production-use-secure-random-string

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start production server (web + worker) via startup script that initializes DB
CMD ["/app/docker-start.sh"]
