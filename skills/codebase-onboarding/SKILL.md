---
name: codebase-onboarding
description: Analyze an unfamiliar codebase and produce a structured onboarding guide with architecture map, conventions, and a starter AGENTS.md.
disable-model-invocation: true
---

# Codebase Onboarding

Systematically analyze an unfamiliar codebase and produce a structured onboarding guide.

## Phase 1: Reconnaissance

Gather raw signals about the project without reading every file. Glob these six checks in parallel at the **top two levels** of the tree (ignore `node_modules`, `vendor`, `.git`, `dist`, `build`, `__pycache__`, `.next`). Record found or absent. Do not invent ecosystems that are not on disk. Read a file only when a signal is ambiguous.

1. **Package manifest** - `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`, `mix.exs`, `pubspec.yaml`
2. **Framework fingerprint** - `next.config.*`, `nuxt.config.*`, `angular.json`, `vite.config.*`, django settings, flask app factory, fastapi main, rails config
3. **Entry points** - `main.*`, `index.*`, `app.*`, `server.*`, `cmd/`, `src/main/`
4. **Directory snapshot** - top 2 levels of the tree, same ignore list as above
5. **Config and tooling** - `.eslintrc*`, `.prettierrc*`, `tsconfig.json`, `Makefile`, `Dockerfile`, `docker-compose*`, `.github/workflows/`, `.env.example`, CI configs
6. **Test structure** - `tests/`, `test/`, `__tests__/`, `*_test.go`, `*.spec.ts`, `*.test.js`, `pytest.ini`, `jest.config.*`, `vitest.config.*`

**Done when**: each of the six recon checks has a result (found or absent).

## Phase 2: Architecture Mapping

From the reconnaissance data, identify:

**Tech Stack**
- Language(s) and version constraints
- Framework(s) and major libraries
- Database(s) and ORMs
- Build tools and bundlers
- CI/CD platform

**Architecture Pattern**
- Monolith, monorepo, microservices, or serverless
- Frontend/backend split or full-stack
- API style: REST, GraphQL, gRPC, tRPC

**Key Directories**
Map the top-level directories to their purpose (skip names that already explain themselves).

**Data Flow**
Trace one request from entry to response:
- Where does a request enter? (router, handler, controller)
- How is it validated? (middleware, schemas, guards)
- Where is business logic? (services, models, use cases)
- How does it reach the database? (ORM, raw queries, repositories)

If a framework is detected from config but the actual code uses something different, trust the code.

**Done when**: tech stack, architecture pattern, key directories, and one request's data flow are named from Phase 1 evidence.

## Phase 3: Convention Detection

Identify patterns the codebase already follows:

**Naming Conventions**
- File naming: kebab-case, camelCase, PascalCase, snake_case
- Component/class naming patterns
- Test file naming: `*.test.ts`, `*.spec.ts`, `*_test.go`

**Code Patterns**
- Error handling style: try/catch, Result types, error codes
- Dependency injection or direct imports
- State management approach
- Async patterns: callbacks, promises, async/await, channels

**Git Conventions**
- Branch naming from recent branches
- Commit message style from recent commits
- PR workflow (squash, merge, rebase)
- If the repo has no commits yet or only a shallow history (e.g. `git clone --depth 1`), skip this section and note "Git history unavailable or too shallow to detect conventions"

**Done when**: naming, code patterns, and git conventions are each a finding from the repo, or an explicit "could not determine".

## Phase 4: Generate Onboarding Artifacts

Produce the artifacts the user asked for; to map their request to artifacts, read [references/examples.md](references/examples.md).

- Onboarding Guide: format in [references/onboarding-guide.md](references/onboarding-guide.md)
- Starter AGENTS.md: template in [references/agents-md.md](references/agents-md.md)

**Done when**: every artifact the user asked for is written (Onboarding Guide in the conversation unless they asked only for AGENTS.md; AGENTS.md at the repo root created or enhanced, existing instructions preserved, additions called out).
