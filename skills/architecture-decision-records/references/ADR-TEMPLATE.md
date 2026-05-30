# ADR Template (default)

**Minimal structure, rich rationale.** The default ADR is a title plus enough prose that a future maintainer or agent understands context, the decision, rejected options, and accepted trade-offs — without empty Nygard-style sections.

## Default template

```markdown
# ADR-NNNN: [Short decision title]

**Date**: YYYY-MM-DD
**Captured via**: architecture-decision-records

## Rationale

[One or more paragraphs. Cover in prose — not as empty headings:]

- **Context** — what problem, constraints, and forces led here
- **Decision** — what was chosen, stated clearly
- **Why** — why this option over others; name rejected alternatives when non-obvious
- **Trade-offs** — what becomes easier or harder; risks worth remembering

Keep the default ADR readable in about two minutes. If a topic needs more room, add optional sections from [ADR-EXPANDED-SECTIONS.md](ADR-EXPANDED-SECTIONS.md).
```

## Rationale quality bar

An ADR is **not** done when it is a single vague sentence. It **is** done when someone could **not** reasonably re-open the same debate without new information.

### Do

- Be specific ("Prisma ORM" not "an ORM")
- Name rejected alternatives when the rejection is non-obvious
- State consequences honestly
- Use present tense ("We use X")

### Don't

- Leave mandatory sections empty (prefer prose in **Rationale** over blank `## Context`)
- Record with no alternatives when alternatives existed
- Write design-doc length in the default template — use expanded sections or a linked design doc instead

## Optional metadata (frontmatter)

Use when the project already uses ADR frontmatter:

```yaml
---
status: accepted
date: YYYY-MM-DD
captured-via: architecture-decision-records
deciders: [names or roles]
---
```

Optional sections (`Status`, `Deciders`, `Considered Options`, etc.) — see [ADR-EXPANDED-SECTIONS.md](ADR-EXPANDED-SECTIONS.md).
