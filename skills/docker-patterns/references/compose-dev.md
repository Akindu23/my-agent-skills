# Docker Compose for Local Development

## Standard Web App Stack

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: dev                     # Use dev stage of multi-stage Dockerfile
    init: true                       # Subreaper for Node; helps SIGTERM propagation (see Ops / PID 1)
    ports:
      - "3000:3000"
    volumes:
      - .:/app                        # Bind mount for hot reload
      - /app/node_modules             # Anonymous volume -- preserves container deps
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
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  mailpit:                            # Local email testing
    image: axllent/mailpit
    ports:
      - "8025:8025"                   # Web UI
      - "1025:1025"                   # SMTP

volumes:
  pgdata:
  redisdata:
```

## Development vs Production Dockerfile

Enable BuildKit (`DOCKER_BUILDKIT=1` or default in modern Docker). Use a syntax directive so cache mounts and secret mounts parse reliably.

```dockerfile
# syntax=docker/dockerfile:1

# Pin ONE reproducibility strategy per pipeline: immutable digest (strongest) or patch-level tag (weaker).
# Moving minor tags (e.g. node:22-alpine) trade reproducibility for silent upstream updates—document that trade-off if you use them.
FROM node:22.12-alpine3.20 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Persist npm cache across builds (requires BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm ci
# Build-time tokens (private registry, git): supply files via BuildKit secrets—never COPY .npmrc with tokens into the image.
#   docker build --secret id=npmrc,src=$HOME/.npmrc .
# RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

# Stage: dev (hot reload, debug tools)
FROM node:22.12-alpine3.20 AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage: build
FROM node:22.12-alpine3.20 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

# Stage: production (minimal image)
FROM node:22.12-alpine3.20 AS production
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
# docker-compose.override.yml (auto-loaded, dev-only settings)
services:
  app:
    environment:
      - DEBUG=app:*
      - LOG_LEVEL=debug
    ports:
      - "9229:9229"                   # Node.js debugger

# docker-compose.prod.yml (explicit for production)
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
```

`deploy:` (limits, replicas, placement) is honored by **Docker Swarm** and Compose when deploying to a Swarm stack. Plain **`docker compose up`** on a single node often **does not enforce** `deploy.resources`—validate behavior for your Compose version/target or use a real orchestrator (Swarm/Kubernetes/ECS) when limits matter.

```bash
# Development (auto-loads override)
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
