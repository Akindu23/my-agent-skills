# ADR Format

> Synced from `architecture-decision-records/references/ADR-POLICY.md`, `ADR-TEMPLATE.md`, and `ADR-INDEX.md`.  
> Update by copying from canonical when ADR format changes; do not extend grill-only rules here beyond offering criteria below.

ADRs live in `docs/adr/` (system-wide) or `src/<context>/docs/adr/` (context-scoped). Use sequential numbering per directory: `0001-slug.md`, `0002-slug.md`, etc.

Create the directory lazily — only when the first ADR is needed, with user consent for scaffolding.

## Default template

Lightweight structure is allowed; **rationale must be detailed enough** to prevent future re-litigation.

```md
# ADR-NNNN: {Short title of the decision}

**Date**: YYYY-MM-DD
**Captured via**: grill-with-docs

## Rationale

{Prose covering context, what was decided, why this option over others, and non-obvious trade-offs. Not a single vague sentence.}
```

Optional sections (Status, Considered Options, Consequences, Risks, Supersedes) — use when they add genuine value; see canonical `ADR-EXPANDED-SECTIONS.md` for patterns.

## Index

After **explicit approval**, append a row to `docs/adr/README.md` (or the context ADR `README.md`):

| ADR | Title | Status | Date | Captured via |
|-----|-------|--------|------|--------------|

Set **Captured via** to `grill-with-docs` for ADRs offered from this skill.

## Numbering

Scan the target `docs/adr/` directory for the highest existing number and increment by one.

## When to offer an ADR

All three of these must be true (offer only — user must accept before writing):

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only."
- **Deliberate deviations from the obvious path.** Anything where a reasonable reader would assume the opposite.
- **Constraints not visible in the code.** Compliance, partner SLAs, org mandates.
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it.

## Canonical workflow

For draft approval, file write, scaffolding, and index maintenance, use **`/architecture-decision-records`** when not already following that skill's steps inline.
