---
name: council
description: "Explores the codebase in a given area, spawns parallel Task subagents on Cursor first-party models for deep dives including off-angle coverage, then synthesizes results for the user's request or plan."
disable-model-invocation: true
---

Based on the given area of interest, please:

1. Dig around the codebase in terms of that given area of interest, gather general information such as keywords and architecture overview.
2. Spawn **n={as much as needed by the main agent}** (unless specified otherwise) subagents with the **Task** tool. Before fan-out, **probe** the Task tool's **`model`** enum and set **`model`** per [`references/cursor-task-workflow.md`](references/cursor-task-workflow.md) (Composer default; Grok for presumed-heavy roles or `[heavy]`; `[light]`/`[standard]` force Composer; parallel partition workers stay Composer). Omit `model` only when no first-party slug is listed.
3. Choose **`subagent_type`** and **`readonly`** per delegate role and risk. Do not make the whole council read-only by default:
   - Use read-only delegates for exploration, review, judging, and synthesis.
   - Use write-capable delegates when the requested outcome requires edits, shell work, MCP/web access, or other state-changing actions.
4. Diversify prompts: some subagents should be "on brief", others slightly off-angle for coverage.
5. Once the subagents are done, inspect their artifacts or findings directly, reconcile contradictions, and use the information to do what the user wants.

If the user is in plan mode, use the information to create the plan.

## Subagent routing

| Rule | Detail |
|------|--------|
| **Probe** | Read the Task tool **`model`** / **`subagent_type`** enums before fan-out; follow [`references/cursor-task-workflow.md`](references/cursor-task-workflow.md) (SSOT) |
| **Lanes** | Composer default; Grok for presumed-heavy / `[heavy]`; `[light]`/`[standard]` force Composer; parallel partition workers stay Composer |
| **Role vs model** | `subagent_type` and `readonly` follow job/risk; independent of model lane |

**Done when**: every launched Task has an explicit `model` when a first-party slug matched, or omitted only after probe found none.

## Parallel council runs (n ≥ 6)

- Fan out independent partitions in **one message** with multiple **Task** calls; workers use the Composer lane from the workflow reference.
- After results return, if synthesis is noisy, contradictory, or shallow: **merge in the parent** or run **one** follow-up Task (presumed-heavy → Grok lane when available) for dedupe and conflict resolution. Do not re-run the whole fan-out unless partitions were wrong.
