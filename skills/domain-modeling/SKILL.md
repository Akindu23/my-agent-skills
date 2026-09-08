---
name: domain-modeling
description: Domain model. Use when pinning terminology or a ubiquitous language, or when another skill needs to maintain the glossary.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the *active* discipline - challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `CONTEXT.md` for vocabulary is not this skill - that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

## File structure

Default: one `CONTEXT.md` + `docs/adr/` at the repo root. Create lazily - only when you have something to write. First resolved term creates the glossary; first ADR creates `docs/adr/`.

If `CONTEXT-MAP.md` exists, follow it (per-context `CONTEXT.md` and `docs/adr/`). Creating or promoting a map is in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) (Single vs multi-context) - load that section when the first write is in a monorepo package, or a term belongs to a second bounded context. Presence of `CONTEXT-MAP.md` is the layout.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y - which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' - do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible - which is right?"

### Update CONTEXT.md inline

When a term is resolved, update that context's `CONTEXT.md` right there (root unless `CONTEXT-MAP.md` says otherwise). Don't batch these up - capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer ADRs sparingly

Only offer an ADR when the [implicit-offer criteria](../architecture-decision-records/references/ADR-POLICY.md) in ADR-POLICY are met (all three must be true). Do not auto-write.

**When the user accepts**, follow `/architecture-decision-records` with **`Captured via: domain-modeling`**. Shape expectations are in [ADR-FORMAT.md](./ADR-FORMAT.md).
