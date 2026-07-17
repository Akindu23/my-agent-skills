# ADR Index Format

Maintain `docs/adr/README.md` (or `src/<context>/docs/adr/README.md`) as the index of all ADRs in that directory.

## Initial scaffolding

On first ADR in a directory, with user approval, create:

```
docs/adr/
├── README.md      ← index (this format)
├── NNNN-slug.md   ← decision files
└── template.md    ← optional blank copy of default template for humans
```

Seed `README.md` with the table header below and a one-line intro.

## Index table

```markdown
# Architecture Decision Records

| ADR | Title | Status | Date | Captured via |
|-----|-------|--------|------|--------------|
| [0001](0001-use-nextjs.md) | Use Next.js as frontend framework | accepted | 2026-01-15 | architecture-decision-records |
| [0002](0002-postgres-over-mongo.md) | PostgreSQL over MongoDB | accepted | 2026-01-20 | grill-with-docs |
```

## After each approved ADR

1. Write `NNNN-slug.md` in the same directory
2. **Append one row** to `README.md` with matching **Status**, **Date**, and **Captured via**
3. Keep rows sorted by ADR number

## Reading ADRs

1. Open `docs/adr/README.md` (or context-scoped path)
2. Find relevant rows by title or number
3. Read the linked file — prioritize the **Rationale** section (or Context/Decision in older ADRs)

## Captured via values

Documented in [ADR-POLICY.md](ADR-POLICY.md): `architecture-decision-records`, `domain-modeling`, `grill-with-docs`, `improve-codebase-architecture`, `wayfinder`, `manual`.

Satellite skills set their own slug when they initiated the offer and the user approved writing through the canonical workflow.
