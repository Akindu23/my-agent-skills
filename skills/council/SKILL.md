---
name: council
description: "Explores the codebase in a given area, spawns parallel Task subagents (Composer 2.5) for deep dives including off-angle coverage, then synthesizes results for the user's request or plan. Use for multi-area codebase review, research before planning, broad architecture reconnaissance, or any task that benefits from parallel exploration."
disable-model-invocation: true
---

Based on the given area of interest, please:

1. Dig around the codebase in terms of that given area of interest, gather general information such as keywords and architecture overview.
2. Spawn **n={as much as needed by the main agent}** (unless specified otherwise) subagents with the **Task** tool. For **every** `Task` call, set **`model: composer-2.5`** explicitly.
   Do **not** omit `model` and do **not** mirror the main chat's model; subagent model choice is independent of the parent session.
3. Diversify prompts: some subagents should be "on brief", others slightly off-angle for coverage.
4. Once the subagents are done, use the information to do what the user wants.

If the user is in plan mode, use the information to create the plan.

## Task `model`

| Rule | Detail |
|------|--------|
| **Slug** | `composer-2.5` on every Task |
| **Do not use** | `composer-2.5-fast`, `composer-2-fast` or any `*-fast` slug, `"fast"` |
| **Why** | Standard Composer 2.5 is the cost-efficient tier; fast variants charge more per token for latency, not savings ([pricing](https://cursor.com/docs/models-and-pricing.md), [Composer 2.5](https://cursor.com/docs/models/cursor-composer-2-5)) |
| **Fallback** | If rejected: try `composer-2`, then omit `model` (inherit parent) — intent stays standard Composer only |

Pick **`subagent_type`**, **`readonly`**, and prompt shape from role and risk — not from model tier. Workflow tables: `references/cursor-task-workflow.md`.

## Parallel council runs (n ≥ 6)

- Fan out independent partitions in **one message** with multiple Task calls; each uses **`model: composer-2.5`**.
- After results return, if synthesis is noisy, contradictory, or shallow: **merge in the parent** or run **one** follow-up Task (`composer-2.5`) for dedupe and conflict resolution — do not re-run the whole fan-out unless partitions were wrong.
