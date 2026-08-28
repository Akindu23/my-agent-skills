# Docker Compose for Local Development

Prefer canonical filenames `compose.yaml` / `compose.override.yaml` (legacy
`docker-compose.yml` still works). BuildKit is the default builder since Docker
Engine 23.0 - you usually do not need `DOCKER_BUILDKIT=1`.

## Standard Web App Stack

```yaml
# compose.yaml
services:
  app:
    build:
      context: .
      target: dev                     # Use dev stage of multi-stage Dockerfile
    init: true                       # Subreaper for Node; helps SIGTERM propagation (see Ops / PID 1)
    ports:
      - "127.0.0.1:3000:3000"
    develop:
      watch:
        - action: sync
          path: .
          target: /app
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/app_dev
      - REDIS_URL=redis://redis:6379/0
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:18-alpine
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    volumes:
      # Postgres 18+ images use /var/lib/postgresql (not .../data) as the volume target
      - pgdata:/var/lib/postgresql
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:8-alpine
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redisdata:/data

  mailpit:                            # Local email testing
    image: axllent/mailpit
    ports:
      - "127.0.0.1:8025:8025"         # Web UI
      - "127.0.0.1:1025:1025"         # SMTP

volumes:
  pgdata:
  redisdata:
```

For hot reload: `docker compose up --watch` (or `docker compose watch`). Bind
mounts + anonymous `node_modules` volumes remain valid when Watch is not a fit.

## Development vs Production Dockerfile

Use a syntax directive so cache mounts and secret mounts parse reliably. BuildKit
is on by default; provenance attestations are also default for `docker build`
(`mode=min`) - add `--sbom=true` when you need an SBOM attestation.

```dockerfile
# syntax=docker/dockerfile:1

# Pin ONE reproducibility strategy per pipeline: immutable digest (strongest) or patch-level tag (weaker).
# Moving minor tags (e.g. node:22-alpine) trade reproducibility for silent upstream updates - document that trade-off if you use them.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Persist npm cache across builds (BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm ci
# Build-time tokens (private registry, git): supply files via BuildKit secrets - never COPY .npmrc with tokens into the image.
#   docker build --secret id=npmrc,src=$HOME/.npmrc .
# RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

# Stage: dev (hot reload, debug tools)
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage: build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

# Stage: production (minimal image)
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
# Ensure runtime-owned tree before dropping privileges (skip only if the app never writes under WORKDIR)
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
RUN chown -R appuser:appgroup /app
USER appuser
ENV NODE_ENV=production
EXPOSE 3000
# --start-period avoids failing fast while the server boots. BusyBox wget ships with Alpine; if your base lacks it, use a HEALTHCHECK CMD present in the image (e.g. curl, or a tiny Node probe).
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

## Override Files

```yaml
# compose.override.yaml (auto-loaded, dev-only settings)
services:
  app:
    environment:
      - DEBUG=app:*
      - LOG_LEVEL=debug
    ports:
      - "127.0.0.1:9229:9229"         # Node.js debugger

# compose.prod.yaml (explicit for production)
services:
  app:
    build:
      target: production
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          memory: 256M
```

**`deploy.resources`:** Compose **v2.13+** enforces `limits` and `reservations` on
standalone `docker compose up`. Replicas, placement, rolling updates, and
endpoint-mode remain **Swarm-oriented** - use Swarm/Kubernetes/ECS when those matter.

```bash
# Development (auto-loads override; add --watch for Compose Watch)
docker compose up --watch

# Production
docker compose -f compose.yaml -f compose.prod.yaml up -d
```
