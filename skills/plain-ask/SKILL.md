---
name: plain-ask
description: >-
  Plain-ask. Rewrites wayfinder HITL questions into ASD-STE100 Simplified
  Technical English with a gloss so a non-specialist can choose. Use when the
  user invokes /wayfinder, attaches wayfinder, or this session charts or works
  a wayfinder map.
license: MIT
---

# plain-ask

This skill runs in parallel with `/wayfinder` on the same prompt. Wayfinder owns the map, tickets, and what to decide. **Plain-ask** owns the words the user reads.

Before any HITL question from that run reaches the user, rewrite it. The decision stays the same.

## 1. Hold the decision

Name, in one line each: the decision, each option, and the recommended answer.

**Done when:** those lines exist and the option count matches the technical choice.

## 2. Write the surface

Two branches. Use the matching shape.

**Decision** — a design, destination, or ticket choice.

**Path** — a wayfinder process choice (`/to-spec`, `/to-plan`, Continue, Handoff, Stop, Implement now).

For every branch, write four fields:

1. **Ask** — the choice, one idea.
2. **Gloss** — numbered steps: what the question means, why a choice is needed now, what happens after a choice. Everyday words first. Then the name from `CONTEXT.md` when that file exists.
3. **Options** — one STE line per option. Put that option's gloss in the option text (MCQ clients hide preamble). Keep identifiers the choice is *about* (paths, skill names, type names); gloss them on the same line.
4. **Recommend** — the same recommended answer, in STE.

Read [`../simplify-this/references/ste.md`](../simplify-this/references/ste.md). Apply every rule to Ask, Gloss, Options, and Recommend.

**Path** gloss (keep 1:1 with wayfinder's list):

- **`/to-spec`** — Write a spec. Then make tickets. Build one ticket per session.
- **`/to-plan`** — Write one plan. Then build in this session's plan path.
- **Implement now** — Start the change in this session. Skip the spec and plan files.
- **Continue next** — Claim the next open ticket and work it now.
- **Handoff to new session** — Write a handoff note. Open a new chat on that note.
- **Stop** — End this session. You start again later.

**Done when:** every STE rule is a hit on the four fields, every option maps 1:1, and a reader with no stack knowledge can choose from the question and option text alone.

## 3. Hand back

Give the four fields to wayfinder's User clarifications. Put Ask + Gloss in the question body. Put each option's STE + gloss in that option. Put Recommend in the recommended-answer slot wayfinder already uses.

**Done when:** Ask, Gloss, every option, and Recommend are on the surface the user will answer on.
