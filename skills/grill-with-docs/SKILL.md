---
name: grill-with-docs
description: >-
  Sharpen a plan or design against this codebase via grilling + domain-modeling
  (CONTEXT.md / ADR offers). May offer /wayfinder when fog appears. Invoke with
  `/grill-with-docs`.
disable-model-invocation: true
---

# Grill with docs

Run `/grilling` with `/domain-modeling` until the design is sharp **or** fog makes a decision map the right next move. It is a a sharpening skill and not a size-based rival to `/wayfinder`. 

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session — field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

## 1. Grill

Run a `/grilling` session using `/domain-modeling`. Glossary updates and ADR offers proceed as those skills specify.

**Done when**: the frontier is empty, the user stopped, or step 2 offered a path and the user left grilling.

## 2. Fog offer

After a frontier round, offer a switch **only when both hold**:

- The **destination** is nameable (what “done” looks like in one or two lines)
- Breadth shows **fog**: open decisions that will not fit one agent session (blocked threads, multi-session map need)

Do **not** offer on hardness alone, or before the destination can be named.

**Soft dumb-zone check:** if the thread already feels lossy or very long (~120k tokens is a heuristic, not a meter), include the handoff option below; otherwise omit it.

**Normal (not dumb-zoned)**

- **Switch to `/wayfinder` now** (recommended)
- **Keep grilling**
- **Stop**

**Dumb-zoned**: same three, plus:

- **`/handoff` then fresh `/wayfinder`**: write `docs/handoffs/CURRENT.md` per `/handoff`; next session opens `@docs/handoffs/CURRENT.md` and charts the map

**Handoff “For next session”** (when that option is chosen) must say: open as **`/wayfinder` Chart the map** mid-session entry from `/grill-with-docs`; link `CONTEXT.md` / notes. Then stop this session.

**On Switch to `/wayfinder` now:** continue in this chat under `/wayfinder` **Chart the map** mid-session entry. Do not restate charting steps here.

**Done when**: the user picked an option and this skill either returns to step 1, stops, handed off, or yielded to `/wayfinder` charting.
