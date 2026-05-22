# Container Security

Linux containers inherit the host’s **default seccomp** profile unless `security_opt` overrides it—avoid loosening seccomp/AppArmor unless required and reviewed.

## Dockerfile Hardening

```dockerfile
# Use specific tags or digests (never :latest for anything you ship)
FROM node:22.12-alpine3.20

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
WORKDIR /app
RUN chown -R appuser:appgroup /app
USER appuser

# Drop capabilities (in compose), read-only root where viable, no secrets in layers
```

## Compose Security

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

## Secret Management

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

**Build-time** tokens (npm, git): use BuildKit **`RUN --mount=type=secret`** and **`docker build --secret id=...,src=...`** so credentials never land in a layer (see Dockerfile example comments in [compose-dev.md](compose-dev.md)).

```dockerfile
# BAD: Hardcoded in image
# ENV API_KEY=sk-proj-xxxxx      # NEVER DO THIS
```

## Supply chain

Scan images in CI, attest SBOM/provenance on releases, sign artifacts, and rebuild bases on a cadence. Details: [supply-chain.md](supply-chain.md).

## Repository hygiene

Ship **`.env.example`** (names only, dummy values) so onboarding stays explicit; **never commit `.env`**. Run **secret scanning** (e.g. **gitleaks**, **trufflehog**) in CI on commits and PRs.

# Anti-patterns

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

# .dockerignore

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
