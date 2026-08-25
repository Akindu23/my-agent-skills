---
name: architecture-decision-records
description: >-
  Captures architectural decisions as lightweight ADRs with detailed rationale,
  optional expanded sections, scaffolding, and index maintenance. Detects decision
  moments, drafts for approval, writes files, and updates docs/adr/README.md.
  Use when recording why the codebase chose a pattern, library, or trade-off;
  when the user says ADR, record this decision, or why did we choose X.
---

# Architecture Decision Records

**Canonical owner** for ADR creation in a project: detect or accept invocation, draft, get approval, write the ADR, initialize scaffolding if needed, and update the index.

**Default shape:** minimal structure, **rich rationale** — title plus prose that covers context, decision, why, and trade-offs. Optional expanded sections when the decision needs more room.

## When to activate

- User says **"ADR this"**, **"record this decision"**, or invokes `/architecture-decision-records`
- User chooses between significant alternatives (framework, datastore, API shape, auth)
- User says **"we decided to…"** or **"the reason we're doing X instead of Y is…"**
- User asks **"why did we choose X?"** (read existing ADRs)
- Architectural trade-offs during planning (offer only — see below)

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session — field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

Ask **one decision at a time**.

## Offer vs write

| Mode | Behavior |
|------|----------|
| **Implicit** (you detect a decision moment) | **Offer** to record — only if [ADR-POLICY.md](references/ADR-POLICY.md) criteria are met. Do not auto-write. |
| **Manual** (user asks to ADR) | If the decision seems too small, **challenge once**; on confirm, run the workflow below. |

## Workflow (canonical)

1. **Pick target directory** — `docs/adr/` for system-wide; `src/<context>/docs/adr/` when `CONTEXT-MAP.md` scopes the decision. See [ADR-POLICY.md](references/ADR-POLICY.md).
2. **Initialize (first time only)** — if the directory is missing, ask consent; then create `README.md` with the index header per [ADR-INDEX.md](references/ADR-INDEX.md) and optional `template.md` from [ADR-TEMPLATE.md](references/ADR-TEMPLATE.md).
3. **Draft** — use the default template in [ADR-TEMPLATE.md](references/ADR-TEMPLATE.md). Add sections from [ADR-EXPANDED-SECTIONS.md](references/ADR-EXPANDED-SECTIONS.md) only when needed.
4. **Number** — next `NNNN` in that directory ([ADR-POLICY.md](references/ADR-POLICY.md)).
5. **Set `Captured via`** — `architecture-decision-records` unless a satellite skill initiated the offer (use that skill's slug).
6. **Approve** — show the draft; **only write after explicit approval**.
7. **Write** — `docs/adr/NNNN-slug.md` (or context path).
8. **Index** — append a row to that directory's `README.md` per [ADR-INDEX.md](references/ADR-INDEX.md).

If the user declines, discard the draft without writing files.

## Reading existing ADRs

1. If no `docs/adr/`, say no ADRs found and offer to start.
2. Read **`docs/adr/README.md`** first (index-first).
3. Open matching ADR files; summarize rationale (context, decision, why).
4. If no match, say so and offer to record one.

## References

| File | When to load |
|------|----------------|
| [references/ADR-POLICY.md](references/ADR-POLICY.md) | When to record, manual vs offer, paths, numbering, lifecycle, `Captured via` |
| [references/ADR-TEMPLATE.md](references/ADR-TEMPLATE.md) | Drafting the default ADR |
| [references/ADR-EXPANDED-SECTIONS.md](references/ADR-EXPANDED-SECTIONS.md) | Status, Deciders, Considered Options, Consequences, Risks, Supersedes |
| [references/ADR-INDEX.md](references/ADR-INDEX.md) | `README.md` table format and append rules |

## Decision detection (implicit offer)

**Explicit:** "Let's go with X", "Record this as an ADR", "We should use X instead of Y"

**Implicit (suggest only):** framework/library conclusion with stated rationale; datastore or auth strategy choice; pattern choice (monolith vs services, REST vs GraphQL) after real comparison

Apply the three criteria in [ADR-POLICY.md](references/ADR-POLICY.md) before offering.

## Satellite skills

`grill-with-docs`, `improve-codebase-architecture`, and `wayfinder` may **offer** ADRs under stricter or session-specific rules. When the user accepts, they hand off to **this workflow** (draft → approval → write → index) and set `Captured via` to their skill slug.
