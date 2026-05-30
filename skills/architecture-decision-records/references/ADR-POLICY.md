# ADR Policy

Canonical policy for when and how to record architecture decision records in a project.

## When to record

### Implicit offer (this skill suggests an ADR)

Offer to record only when **all three** are true:

1. **Hard to reverse** — changing course later has meaningful cost
2. **Surprising without context** — a future reader will wonder why it was done this way
3. **Real trade-off** — genuine alternatives existed and one was chosen for specific reasons

If any criterion is missing, do not offer an ADR.

### Manual invocation

When the user says **"ADR this"**, **"record this decision"**, or explicitly invokes `/architecture-decision-records`:

- If the decision seems too small (reversible, obvious, no real alternative), **challenge once** with a short reason.
- If they confirm, proceed with the canonical workflow.

### What not to record

- Trivial choices (formatting, naming without architectural impact)
- Obvious defaults with no rejected alternatives
- Decisions already fully captured elsewhere with no risk of re-litigation

## Where ADRs live

| Scope | Path |
|-------|------|
| System-wide | `docs/adr/` |
| Bounded context (when `CONTEXT-MAP.md` exists) | `src/<context>/docs/adr/` |

Create directories **lazily** on first ADR, with user consent for scaffolding.

## Numbering

- Files: `NNNN-slug.md` (four-digit zero-padded, e.g. `0007-rest-over-graphql.md`)
- Scan the target `docs/adr/` directory for the highest existing number and increment by one
- Number per directory (system ADRs and context ADRs have independent sequences)

## Lifecycle states

`proposed` → `accepted` → `deprecated` | `superseded by ADR-NNNN`

- **proposed** — under discussion, not committed
- **accepted** — in effect
- **deprecated** — no longer relevant
- **superseded** — replaced; always link the successor ADR

## Approval before write

**Never** write an ADR file or update the index without **explicit user approval** of the draft.

If the user declines, discard the draft. Do not create `docs/adr/` or index rows without consent.

## Captured via (provenance)

Every new ADR and every index row must record how it was captured:

| Value | When |
|-------|------|
| `architecture-decision-records` | Default for this skill (implicit offer accepted or manual via this skill) |
| `grill-with-docs` | User accepted an ADR offer during a grill-with-docs session |
| `improve-codebase-architecture` | User accepted an ADR offer after rejecting an ICA deepening candidate |
| `manual` | User supplied content or insisted on recording outside satellite skills |

In the ADR file, use YAML frontmatter when present:

```yaml
---
status: accepted
date: YYYY-MM-DD
captured-via: architecture-decision-records
---
```

If the project uses no frontmatter, add a single line under the title: `Captured via: architecture-decision-records`.

## Immutability and supersession

- Do not silently rewrite accepted ADRs; supersede with a new numbered ADR
- Link both directions when superseding (`Supersedes` / `Superseded by`)
