# ============================================================
# Digital Garden — Dockerfile
# ============================================================
# Multi-stage build for Next.js 16 + Prisma + SQLite.
#
# Build:  docker build -t digital-garden .
# Run:    docker run -p 3000:3000 -v ./data:/app/data digital-garden
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com

# Copy source & build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ── Stage 2: Runtime ──────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 garden && adduser -u 1001 -G garden -D garden

# Copy built assets
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/docker-entrypoint.sh ./

# Data directory for SQLite
RUN mkdir -p /app/data && chown -R garden:garden /app

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

USER garden

EXPOSE 3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
