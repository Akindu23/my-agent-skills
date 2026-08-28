---
name: to-spec
description: Turn the current conversation into a published spec, then validate it with /council and /best-practices-research - no interview, no tickets.
disable-model-invocation: true
---

Synthesize a spec (PRD) from what you already know - do **not** interview. Then validate it once. **Do not** run `/to-tickets` or implement unless the user asks in the same turn.

Default tracker: local markdown under `work/`. If `docs/agents/issue-tracker.md` exists, follow it. Run `/setup-work` only when the tracker is not local `work/` (or you need to switch / record a non-default tracker).

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session - field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

Ask **one decision at a time** when this skill already sequences questions that way.

## Process

1. Explore the repo if you haven't already. Use the project's domain glossary; respect ADRs in the area you're touching.
   **Done when**: you can write the spec in glossary vocabulary without inventing modules you haven't seen.

2. Sketch test seams - prefer existing, highest seam; fewer is better (ideal: one). Check with the user that seams match expectations.
   **Done when**: user has confirmed the seams (or accepted the default).

3. Write the spec with the template below; publish to the issue tracker.
   **Done when**: the spec is published and reachable by path or issue URL.

4. Run `/council` scoped to every area the spec touches.
   **Done when**: every file/area the spec will change has been explored.

5. Run `/best-practices-research` on the domains the spec touches. Fold each recommendation into the published spec or reject it explicitly (brief note under Further Notes or Implementation Decisions).
   **Done when**: every recommendation is incorporated or explicitly rejected on the published spec.

6. **Hard stop.** Tell the user the spec is ready. Next is `/to-tickets` → `/implement` (one ticket per session), or `/to-plan` → `/implement-plan` if the remaining build fits one session. Do **not** start tickets, plans, or implementation unless asked in the same turn.
   **Done when**: this session has stopped without `/to-tickets`, `/to-plan`, or implementation unless the user explicitly requested one of those in the same turn.

Skip steps 4-5 only when the user asked for a draft spec without validation.

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts - not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>
