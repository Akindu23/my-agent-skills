---
name: grilling
description: Interview the user relentlessly about a plan or design. Use when the user wants to stress-test a plan before building, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Each round the user answers reshapes the tree — settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a **Task** subagent to find it — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report — ask the rest of the frontier now. The _decisions_ are the user's — put each to them and wait.

Probe Task/Agent enums; route per [task-workflow.md](../council/references/task-workflow.md) (SSOT).

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

### Prefer one question at a time?

If the user (or their `AGENTS.md`, `CLAUDE.md`, or user/rules) says to ask one question at a time when grilling, honor that and fall back to the old one-at-a-time rhythm for this session.

## User clarifications (Cursor)

When a frontier round includes **discrete decisions** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool: put **all** such decisions from the current frontier into **one** `AskQuestion` call (`questions[]`), so the user can answer the round in the structured UI.

Put **free-form** frontier items (open-ended design explanations, pasted logs, custom workflows) in the **same round** as numbered chat prompts with your recommended answer — do not force them into multiple-choice.

Do not start the next round until both the AskQuestion answers and the free-form replies for this frontier are in.

If **`AskQuestion`** is unavailable in the current environment, ask the whole frontier (discrete and free-form) as a numbered chat list with recommended answers.

If a question can be answered by exploring the codebase, explore the codebase instead (via Task when it shouldn't block the rest of the frontier).
