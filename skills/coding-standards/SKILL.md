---
name: coding-standards
description: >-
  Baseline cross-project coding conventions for naming, readability, immutability
  defaults with explicit exceptions, and code-quality review. Use when starting
  modules or projects, reviewing PRs, enforcing style, or when the user wants
  generic quality bar before reaching for stack-specific skills. Use detailed
  frontend or backend skills for framework-specific patterns.
---

# Coding standards and best practices

Baseline coding conventions applicable across projects. This skill is the shared floor, not the detailed framework playbook.

- Use `frontend-design`, `vercel-react-best-practices`, or similar for React, state, forms, and UI architecture.
- Use domain backend or API skills for repository layers, endpoints, validation, and server-only concerns.
- Use `rules/common/coding-style.md` when you need the shortest reusable rule layer instead of a full skill walkthrough.

## When to activate

- Starting a new project or module
- Reviewing code for quality and maintainability
- Refactoring for consistency
- Enforcing naming, formatting, or structural conventions
- Setting up linting, formatting, or type-checking rules
- Onboarding contributors to coding conventions

## Scope boundaries

Use for descriptive naming, readability, KISS / DRY / YAGNI, default immutability posture, error-handling expectations, and smell review.

Do not use as the primary source for framework-specific composition, server architecture, or narrower language skills when one already exists.

## Code quality principles

### Readability first

Code is read more than written. Prefer clear names, self-explanatory structure, and consistent formatting.

### KISS (Keep It Simple, Stupid)

Simplest solution that works. Avoid over-engineering and premature optimization. Easy to understand beats clever.

### DRY (Don't Repeat Yourself)

Extract shared logic; reuse components and utilities. Avoid copy-paste.

### YAGNI (You Aren't Gonna Need It)

Do not build speculative features or abstractions. Add complexity when a real requirement appears.

## Immutability (default)

Prefer **non-mutating** updates (e.g. spreads, persistent data structures, functional state updates) so data flow stays easy to follow and test.

**Exceptions (allowed when deliberate and narrow):**

- **Hot paths** where profiling shows allocation or copying is a real bottleneck — keep the mutation local and document why.
- **Framework idioms** that require in-place updates as the supported API.
- **Small internal buffers** built inside a function or private method when the contract still looks immutable to callers.

When you mutate anyway, add a short comment that points to one of the exceptions above (see [quality-performance-testing](references/quality-performance-testing.md)).

## Deeper topic files

| Area | Reference |
|------|-----------|
| TypeScript / JavaScript naming, typing, async, errors | [references/typescript-javascript.md](references/typescript-javascript.md) |
| React / Next-style components, hooks, rendering | [references/react-next-conventions.md](references/react-next-conventions.md) |
| REST-style API shapes, validation, responses | [references/api-design.md](references/api-design.md) |
| File and folder layout | [references/file-structure-and-naming.md](references/file-structure-and-naming.md) |
| Comments, performance patterns, tests, smells | [references/quality-performance-testing.md](references/quality-performance-testing.md) |
