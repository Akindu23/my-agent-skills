---
name: docker-patterns
description: >-
  Applies Dockerfile, Docker Compose, BuildKit, and container security patterns for
  local development and hardened deployable images. Use when authoring Dockerfiles or
  compose files, wiring secrets (runtime vs build-time), reproducible bases, PID 1 and
  healthchecks, volumes and networking, supply-chain hygiene, or troubleshooting compose
  stacks.
paths:
  - "Dockerfile*"
  - "**/docker-compose*.yml"
  - "**/compose*.yml"
---

# Docker Patterns

Docker and Docker Compose best practices for containerized development and safer images.

## Docker Compose for Local Development

### Standard Web App Stack

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

### Development vs Production Dockerfile

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

### Override Files

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

## Ops / PID 1 and signals

Node as PID 1 can mishandle signal forwarding and zombie children. Prefer one of:

- **`init: true`** in Compose (tini-based init in container runtime), or
- **`ENTRYPOINT ["dumb-init", "--"]`** / **`ENTRYPOINT ["tini", "--"]`** with `CMD ["node", "..."]` when not using Compose `init`.

Combine with **`HEALTHCHECK --start-period=...`** so slow boots do not mark the container unhealthy immediately.

## Networking

### Service Discovery

Services in the same Compose network resolve by service name:

```
# From "app" container:
postgres://postgres:postgres@db:5432/app_dev    # "db" resolves to the db container
redis://redis:6379/0                             # "redis" resolves to the redis container
```

### Custom Networks

```yaml
services:
  frontend:
    networks:
      - frontend-net

  api:
    networks:
      - frontend-net
      - backend-net

  db:
    networks:
      - backend-net              # Only reachable from api, not frontend

networks:
  frontend-net:
  backend-net:
```

### Exposing Only What's Needed

```yaml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"   # Only accessible from host, not network
    # Omit ports entirely in production -- accessible only within Docker network
```

## Volume Strategies

```yaml
volumes:
  # Named volume: persists across container restarts, managed by Docker
  pgdata:

  # Bind mount: maps host directory into container (for development)
  # - ./src:/app/src

  # Anonymous volume: preserves container-generated content from bind mount override
  # - /app/node_modules
```

### Common Patterns

```yaml
services:
  app:
    volumes:
      - .:/app                   # Source code (bind mount for hot reload)
      - /app/node_modules        # Protect container's node_modules from host
      - /app/.next               # Protect build cache

  db:
    volumes:
      - pgdata:/var/lib/postgresql/data          # Persistent data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql  # Init scripts
```

## Container Security

Linux containers inherit the host’s **default seccomp** profile unless `security_opt` overrides it—avoid loosening seccomp/AppArmor unless required and reviewed.

### Dockerfile Hardening

```dockerfile
# Use specific tags or digests (never :latest for anything you ship)
FROM node:22.12-alpine3.20

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
WORKDIR /app
RUN chown -R appuser:appgroup /app
USER appuser

# Drop capabilities (in compose), read-only root where viable, no secrets in layers
```

### Compose Security

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:size=64m
      - /app/.cache:size=128m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE          # Only if binding to ports < 1024
```

### Secret Management

- **Non-sensitive config** (feature flags, public URLs, log levels): environment variables, `environment:` / `env_file:` pointing at **`.env`** (gitignored) are fine.
- **Secrets** (tokens, DB passwords, signing keys): **do not** treat “plain `.env` on disk” as strong secret storage for production. Prefer **orchestrator-backed secrets** (Kubernetes secrets + CSI, ECS secrets, Swarm secrets), **secret managers** (Vault, cloud SM) with injection at runtime, or **runtime-mounted secret files** on **tmpfs** with minimal permissions—**not** baking credentials into images or checked-in compose.

```yaml
# Runtime injection from host env (secret value lives outside compose YAML)
services:
  app:
    environment:
      - API_KEY                    # sourced from shell or CI inject

# Swarm: secrets as files under /run/secrets (example pattern)
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  db:
    secrets:
      - db_password
```

**Build-time** tokens (npm, git): use BuildKit **`RUN --mount=type=secret`** and **`docker build --secret id=...,src=...`** so credentials never land in a layer (see Dockerfile example comments above).

```dockerfile
# BAD: Hardcoded in image
# ENV API_KEY=sk-proj-xxxxx      # NEVER DO THIS
```

### Supply chain

Scan images in CI, attest SBOM/provenance on releases, sign artifacts, and rebuild bases on a cadence. Details: [references/supply-chain.md](references/supply-chain.md).

### Repository hygiene

Ship **`.env.example`** (names only, dummy values) so onboarding stays explicit; **never commit `.env`**. Run **secret scanning** (e.g. **gitleaks**, **trufflehog**) in CI on commits and PRs.

## Anti-patterns

**Critical**

- **Never bind-mount `docker.sock`** (`/var/run/docker.sock`) into application containers—it grants host-level Docker API access from inside the container.
- **Avoid `privileged: true`** unless there is a narrow, reviewed justification; it strips most isolation guarantees.
- **Avoid `network_mode: host`** unless you need host networking semantics and accept the loss of network namespace isolation.

**Common mistakes**

- Running production multi-service stacks on **`docker compose up`** without orchestration where HA, rollouts, or enforced resource limits matter.
- Storing state only in container writable layers—use volumes for data you care about.
- Running as root when the workload does not require it.
- Using **`:latest`** for images you deploy or debug reproducibly.
- One giant container running many unrelated processes—prefer one main process per container.
- Putting raw secrets in **`docker-compose.yml`** committed to git—use CI/orchestrator injection, secret managers, or Swarm/K8s secrets—not “secrets live in plain compose/env files” as the final story for high-value credentials.

## .dockerignore

```
node_modules
.git
.env
.env.*
!.env.example
dist
coverage
*.log
.next
.cache
docker-compose*.yml
Dockerfile*
README.md
tests/
```

## Debugging

### Common Commands

```bash
# View logs
docker compose logs -f app           # Follow app logs
docker compose logs --tail=50 db     # Last 50 lines from db

# Execute commands in running container
docker compose exec app sh           # Shell into app
docker compose exec db psql -U postgres  # Connect to postgres

# Inspect
docker compose ps                     # Running services
docker compose top                    # Processes in each container
docker stats                          # Resource usage

# Rebuild
docker compose up --build             # Rebuild images
docker compose build --no-cache app   # Force full rebuild

# Clean up
docker compose down                   # Stop and remove containers
docker compose down -v                # Also remove volumes (DESTRUCTIVE)
docker system prune                   # Remove unused images/containers
```

### Debugging Network Issues

```bash
# Check DNS resolution inside container
docker compose exec app nslookup db

# Check connectivity
docker compose exec app wget -qO- http://api:3000/health

# Inspect network
docker network ls
docker network inspect <project>_default
```
