---
name: research
description: >-
  Investigate a question against high-trust primary sources and capture the
  findings as a Markdown file in the repo. Use when the user wants a topic
  researched, docs or API facts gathered, or reading legwork delegated to a
  background agent — including when /wayfinder fires research tickets.
---

# Research

Delegate reading legwork to a **background Task** subagent so the parent keeps working while sources are read.

## 1. Scope the question

Pin the question the agent must answer. Prefer one sharp question (or a tight cluster that shares the same primary sources) over a vague survey.

**Done when**: the question is specific enough that a cited answer file can be judged complete or incomplete.

## 2. Dispatch a background Task

Spin up one **Task** with `run_in_background: true` so research continues while the parent proceeds.

Probe Task/Agent enums; route per [`../council/references/task-workflow.md`](../council/references/task-workflow.md).

Use portable role **`general-purpose`**, write-capable (read-only mode strips MCP/internet access research needs).

Prompt the subagent with:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a **single Markdown file**, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where in the reply.
4. Research and write the findings file only — no unrelated refactors.

When the caller (e.g. `/wayfinder`) needs git isolation, it may also ask for a throwaway `research/<name>` branch; otherwise stay on the current branch and only write the findings file.

**Done when**: the Task is launched in the background with an explicit output path (or clear instruction to choose one and report it).

## 3. Hand off the artifact

When the Task finishes (or when the parent later collects it), treat the **Markdown findings file** as the single source of truth. Link it from whatever ticket or note requested the research; do not paste the full findings into chat or the ticket body.

**Done when**: the findings path is known and linked from the requesting context (ticket, map note, or user reply).
