---
name: to-plan
description: Publish a one-session implementation plan for /implement-plan — escape hatch when the build fits one context window.
disable-model-invocation: true
---

Synthesize an implementation plan from what you already know — do **not** interview. Default artifact: `work/<feature-slug>/plan.md` (run `/setup-matt-pocock-skills` if the tracker is unknown).

**SSOT is the markdown plan.** HTML is an optional review render only — `/implement-plan` reads the `.md`.

## User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable in the current environment, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** for free-form answers.

## Process

1. Gather context (conversation, named map/spec links). Prefer glossary vocabulary; respect ADRs.
   **Done when**: constraints for the build are listed or linked.

2. **Size check** (recommend, user confirms): would clearing context halfway force re-deriving seams, contracts, or open edge cases?
   - Yes → abort; recommend `/to-spec` → `/to-tickets` → `/implement`.
   - Unsure → recommend `/to-spec` first, then choose tickets vs plan.
   - No → continue.
   **Done when**: user confirmed one-session plan, or you aborted to the Matt path.

3. Sketch seams briefly (prefer existing, highest; fewer is better). Confirm if non-obvious.
   **Done when**: seams are agreed or accepted.

4. Write and publish the plan (`work/<feature-slug>/plan.md` locally, or tracker equivalent). Apply `ready-for-agent` when the tracker uses triage labels.
   **Done when**: `plan.md` (or tracker equivalent) exists with the template sections filled.

5. **HTML (optional):** If the user already said “with HTML,” write `plan.html` beside the plan per [references/PLAN-HTML.md](references/PLAN-HTML.md). Otherwise AskQuestion — write HTML review companion? — default **No**.
   **Done when**: HTML written if requested/accepted, or skipped.

6. **Hard stop.** Tell the user to run `/implement-plan` against the plan file. Do not start `/implement-plan` unless asked in the same turn.
   **Done when**: user knows the plan path; heavy stack not started unless asked.

<plan-template>

# Plan: \<feature title\>

## Goal

What the user gets when this plan is done — one or two sentences.

## Context

- Source: wayfinder map / grill / conversation (link paths or issue URLs)
- Decisions that constrain the build (bullets; link ADRs — do not restate them in full)

## Seams

Where behavior will be tested. Prefer existing seams; note any new ones.

## Steps

Numbered, ordered, verifiable steps sized for **one** fresh agent session — if you cannot keep them that small, abort and recommend `/to-spec` instead.

1. …
2. …

## Out of scope

What this plan will not do.

## Done when

Acceptance checks for the overall plan (not layer-by-layer file lists).

</plan-template>

Avoid specific file paths or large code dumps — they go stale. Exception: trim prototype snippets that encode a decision (state machine, schema, type shape) and note they came from a prototype.
