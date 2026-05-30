# ADR Format

> Synced from `architecture-decision-records/references/ADR-POLICY.md`, `ADR-TEMPLATE.md`, and `ADR-INDEX.md`.  
> Update by copying from canonical when ADR format changes; ICA-specific offering criteria below stay in this file.

ADRs live in `docs/adr/` and use sequential numbering per directory: `0001-slug.md`, `0002-slug.md`, etc.

Create `docs/adr/` lazily — only when the first ADR is needed, with user consent for scaffolding.

## Default template

Lightweight structure is allowed; **rationale must be detailed enough** to prevent future re-litigation.

```md
# ADR-NNNN: {Short title of the decision}

**Date**: YYYY-MM-DD
**Captured via**: improve-codebase-architecture

## Rationale

{Prose covering context, what was decided, why this option over others, and non-obvious trade-offs.}
```

Optional sections — see canonical `ADR-EXPANDED-SECTIONS.md` when needed.

## Index

After **explicit approval**, append a row to `docs/adr/README.md`:

| ADR | Title | Status | Date | Captured via |
|-----|-------|--------|------|--------------|

Set **Captured via** to `improve-codebase-architecture` for ADRs offered from this skill.

## Numbering

Scan `docs/adr/` for the highest existing number and increment by one (per directory when using context-scoped ADR paths).

## When to offer an ADR (ICA)

Offer only when **both** are true:

1. **Canonical three criteria** — hard to reverse, surprising without context, real trade-off (same as `architecture-decision-records/references/ADR-POLICY.md`)
2. **ICA-specific gate:** the user **rejected a deepening candidate** with a **load-bearing reason** that a future architecture review would otherwise re-suggest

Frame as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_

Skip ephemeral reasons ("not worth it right now") and self-evident rejections.

### What qualifies (shared)

- Architectural shape, integration patterns, lock-in technology choices
- Boundary and scope decisions
- Deliberate deviations from the obvious path
- Constraints not visible in the code
- Rejected alternatives when the rejection is non-obvious

## Canonical workflow

On acceptance: draft → explicit approval → write `docs/adr/NNNN-slug.md` → update index. Use **`/architecture-decision-records`** for full workflow details when handing off.
