# ADR Format (ICA)

Canonical policy, template, index, and expanded sections:

- [ADR-POLICY.md](../../architecture-decision-records/references/ADR-POLICY.md)
- [ADR-TEMPLATE.md](../../architecture-decision-records/references/ADR-TEMPLATE.md)
- [ADR-INDEX.md](../../architecture-decision-records/references/ADR-INDEX.md)
- [ADR-EXPANDED-SECTIONS.md](../../architecture-decision-records/references/ADR-EXPANDED-SECTIONS.md)

On acceptance use **`/architecture-decision-records`**. Set **Captured via** to `improve-codebase-architecture`.

## When to offer an ADR (ICA)

Offer only when **both** are true:

1. **Canonical three criteria** — hard to reverse, surprising without context, real trade-off (see ADR-POLICY.md)
2. **ICA-specific gate:** the user **rejected a deepening candidate** with a **load-bearing reason** that a future architecture review would otherwise re-suggest

Frame as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_

Skip ephemeral reasons ("not worth it right now") and self-evident rejections.
