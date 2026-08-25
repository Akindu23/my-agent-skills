---
name: best-practices-research
description: >-
  Runs recon on current best practices for a language, framework, or domain
  via live web search before implementing. Use when starting non-trivial work
  in an unfamiliar or fast-moving domain, library, or framework, or when the
  user asks to follow best practices, current practices, or "the modern way"
  to do something. Skip for routine edits or familiar, stable code.
---

# Best Practices Research

## 1. Scope the recon

Identify 1-3 domains the task touches (a stack, library, or framework). For each domain, distill 1-3 concrete, specific questions and not generic ("Python best practices") but task-scoped ("rate-limiting a FastAPI endpoint with Redis in 2026", "current React Server Component data-fetching patterns"). Vague questions produce vague, unusable answers.

**Done when**: every domain has its own scoped question set (1-3 questions each).

## 2. Dispatch the recon subagent(s)

One domain → one subagent with all its questions. 2-3 clearly unrelated domains → one subagent per domain, dispatched together in a single message (parallel `Task` calls).

Probe Task/Agent enums; route per [`../council/references/task-workflow.md`](../council/references/task-workflow.md).

Use portable role **`general-purpose`**, write-capable, foreground (you need findings before writing code; read-only mode strips MCP/internet access these subagents need).

Prompt each subagent with:

- That domain's questions from step 1.
- Prefer Exa (`web_search_exa` via MCP) if available in its toolset; fall back to the built-in `WebSearch`/`WebFetch` tools otherwise.
- Weight recent sources over older or pretraining-era conventions (mention today's date so it doesn't default to stale guidance).
- Research and report only. No file edits.
- Return a concise, actionable summary: concrete conventions, pitfalls, and recommendations with source links. Not a raw dump of search results.

**Done when**: every dispatched subagent has returned its summary.

## 3. Apply the recon

Fold every subagent's recommendations into your implementation plan before writing code. Where findings conflict with each other or with your default approach, prefer the researched, current practice and note the source briefly. With multiple summaries, reconcile contradictions yourself; don't spawn another subagent to do it.

**Done when**: every recommendation from every recon summary is either incorporated into the implementation or explicitly rejected with a stated reason.
