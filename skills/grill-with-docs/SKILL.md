---
name: grill-with-docs
description: >-
  Grilling session that challenges a proposed plan against the existing domain model,
  sharpens terminology, and updates documentation (CONTEXT.md, ADRs) inline as decisions
  crystallise. Use when the user wants to stress-test a plan against the project's language
  and documented decisions.
---

## What to do

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

### User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable in the current environment, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** (not forced multiple-choice) when the answer is inherently free-form—for example pasted logs, a paragraph describing a custom tracker workflow, or an open-ended design explanation.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Supporting context

### Domain awareness

During codebase exploration, also look for existing documentation:

#### File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files lazily — only when there is something material to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

### During the session

#### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately.

#### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term tied to the glossary.

#### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios that probe edge cases and force precision about boundaries between concepts.

#### Cross-reference with code

When the user states how something works, check whether the code agrees. Surface contradictions plainly.

#### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Capture as it happens rather than batching. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

Don't couple `CONTEXT.md` to incidental implementation details—only include concepts that matter to domain experts.

#### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing course later is meaningful
2. **Surprising without context** — a future reader will wonder why it was done this way
3. **The result of a real trade-off** — there were genuine alternatives and one was chosen for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).
