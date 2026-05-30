---
name: council
description: "Explores the codebase in a given area, spawns parallel Task subagents (Composer-family models) for deep dives including off-angle coverage, then synthesizes results for the user's request or plan. Use for multi-area codebase review, research before planning, broad architecture reconnaissance, or any task that benefits from parallel exploration."
disable-model-invocation: true
---

Based on the given area of interest, please:

1. Dig around the codebase in terms of that given area of interest, gather general information such as keywords and architecture overview.
2. Spawn **n={as much as needed by the main agent}** (unless specified otherwise) subagents with the **Task** tool. Before fan-out, **probe** the Task tool's **`model`** enum and set **`model`** to the first matching Composer slug per [`references/cursor-task-workflow.md`](references/cursor-task-workflow.md). Omit `model` only when the enum lists no Composer slugs (inherit parent).
3. Choose **`subagent_type`** and **`readonly`** per delegate role and risk. Do not make the whole council read-only by default:
   - Use read-only delegates for exploration, review, judging, and synthesis.
   - Use write-capable delegates when the requested outcome requires edits, shell work, MCP/web access, or other state-changing actions.
4. Diversify prompts: some subagents should be "on brief", others slightly off-angle for coverage.
5. Once the subagents are done, inspect their artifacts or findings directly, reconcile contradictions, and use the information to do what the user wants.

If the user is in plan mode, use the information to create the plan.

## Subagent routing

| Rule | Detail |
|------|--------|
| **Probe** | Read the Task tool **`model`** enum/description before fan-out and read the workflow reference document |
| **Default priority** | `composer-2.5` → `composer-2.5-fast` → `composer-2` → `composer-2-fast` → inherit |
| **Parallel (n ≥ 6)** | `composer-2.5-fast` → `composer-2.5` → `composer-2-fast` → `composer-2` → inherit |
| **Explicit** | Pass `model: <chosen slug>` whenever a Composer slug is selected |
| **Role-based permissions** | Pick `subagent_type` and `readonly` from the delegate's job, not from the Composer constraint |

**`subagent_type`**, **`readonly`**, and prompt shape are driven by **role and risk**, independent of **`model`** tier. See tables and anti-patterns in [`references/cursor-task-workflow.md`](references/cursor-task-workflow.md).

## Parallel council runs (n ≥ 6)

- Fan out independent partitions in **one message** with multiple **Task** calls; use **fast-first** priority from the workflow reference.
- After results return, if synthesis is noisy, contradictory, or shallow: **merge in the parent** or run **one** follow-up Task (same probe + priority rules) for dedupe and conflict resolution. Do not re-run the whole fan-out unless partitions were wrong.
