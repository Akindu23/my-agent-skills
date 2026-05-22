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

## When to load references

| Topic | Load |
|-------|------|
| Local compose stacks, multi-stage Dockerfiles, overrides | [references/compose-dev.md](references/compose-dev.md) |
| PID 1, healthchecks, logs, exec, rebuild, network debug | [references/debugging-ops.md](references/debugging-ops.md) |
| Service discovery, custom networks, volumes | [references/networking-volumes.md](references/networking-volumes.md) |
| Hardening, secrets, anti-patterns, `.dockerignore` | [references/security.md](references/security.md) |
| Supply chain (SBOM, signing, CI scans) | [references/supply-chain.md](references/supply-chain.md) |

Load the reference that matches the task before drafting or editing Dockerfiles and compose files. Preserve fenced examples verbatim when adapting to the user's stack.
