---
name: handoff
description: >-
  Writes a compact handoff markdown file from the current Agent chat so a new
  session or another agent can continue without re-deriving context. Use when the
  user asks for a handoff, session summary, continuation doc, context for the next
  chat, or ending work with follow-on tasks. Triggers: "handoff", "hand off",
  "summary for next session", "new agent", "pick up later", "/handoff".
---

# Handoff

In **Cursor Agent** chat, this skill is invoked manually with **`/handoff`** or when the agent matches the description. The artifact is a single markdown file the next session can open with **`@path/to/file.md`**.

## When to Use

- User wants to stop now and continue in a fresh chat or delegate to another agent
- User says "write a handoff", "session handoff", "what should the next session do?"
- Long thread: capture only what matters for continuation, not a full transcript

## Instructions

1. **Next-session focus** — If the user typed text after `/handoff` or described a focus in the same message, use it as the primary goal for the handoff. Otherwise infer the most important continuation goal from the conversation.
2. **Extract, do not duplicate** — Do not paste large chunks of PRDs, plans, ADRs, issues, commit messages, or diffs. **Link** them by workspace path or URL. Quote at most a line or two if absolutely necessary.
3. **Choose output path** — Follow **Output Location** below. Create `docs/handoffs/` if missing (unless using the temp fallback).
4. **Fill the template** — Copy the structure from **Handoff Template**, omit empty sections, and keep bullets tight.
5. **Skills** — In the template, list **Cursor Agent Skills** the next session should consider (invoke with **`/skill-name`** per [Agent Skills](https://cursor.com/docs/skills)). Only suggest skills that fit the remaining work.
6. **Finish** — Run **Verification**, then reply with the **workspace-relative path** and one-line instruction to open it in the next session.

## Output Location

**Default (use this whenever the handoff belongs in the project):**

`docs/handoffs/handoff-<slug>-<unique>.md`

- **`<slug>`** — Short filesystem-safe hint from the task or next-session focus (lowercase, hyphens only, ASCII; collapse spaces; trim to ~40 chars if needed).
- **`<unique>`** — `YYYYMMDD-HHMMSS` in UTC **or** 6 hex characters to avoid collisions.

**Fallback (only when the user asks for a temporary or private handoff, or the workspace must not get a new file):**

- A path from `mktemp` (or OS temp) **only** in those cases. State clearly in the reply that the file is **outside the workspace** and the user must paste or attach it for the next session.

## Handoff Template

Use this structure inside the written file (replace placeholders; delete sections with nothing useful):

```markdown
# Handoff: <short title>

**For next session:** <one sentence — what to accomplish first>

**Created:** <ISO date or YYYY-MM-DD>

## Current state

- <what works, what was tried, current branch or context if relevant>

## Decisions and constraints

- <only items the next agent must not reverse or redo>

## Links (no prose duplication)

- Plan / PRD: <path or URL>
- ADR: <path or URL>
- Issue / ticket: <path or URL>
- PR / diff: <path or URL>

## Blockers and open questions

- <or "None">

## Next actions (ordered)

1. <smallest concrete step>
2. …

## Suggested Cursor skills

- `/skill-name` — <why>
```

## Verification

- Confirm the file exists and is readable after writing.
- Reply with the final path (workspace-relative when under `docs/handoffs/`).
- If any link target was cited from memory and might be wrong, mark it **verify** or omit it.
