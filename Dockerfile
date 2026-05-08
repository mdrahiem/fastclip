FROM node:22-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

ARG BUILD_OPENAI_API_KEY=dummy-openai-key-for-image-build
ARG BUILD_SESSION_SECRET=docker-build-dummy-session-secret-32chars-min
RUN OPENAI_API_KEY="${BUILD_OPENAI_API_KEY}" \
    SESSION_SECRET="${BUILD_SESSION_SECRET}" \
    pnpm --filter @video-gen/web build

RUN chmod +x docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
