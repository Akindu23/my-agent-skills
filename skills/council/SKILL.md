---
name: council
description: "Explores the codebase in a given area, spawns parallel Task/Agent subagents for deep dives including off-angle coverage, then synthesizes results for the user's request or plan."
---

Based on the given area of interest, please:

1. Dig around the codebase in terms of that given area of interest, gather general information such as keywords and architecture overview.
2. Spawn **n={as much as needed by the main agent}** (unless specified otherwise) subagents with **Task** or **Agent**. Probe Task/Agent enums; route per [`references/task-workflow.md`](references/task-workflow.md) (SSOT).
3. Choose portable role → **`subagent_type`** and read-only vs write-capable per delegate role and risk (Cursor `readonly` / Claude harness-equivalent — see SSOT). Do not make the whole council read-only by default:
   - Use read-only delegates for exploration, review, judging, and synthesis.
   - Use write-capable delegates when the requested outcome requires edits, shell work, MCP/web access, or other state-changing actions.
4. Diversify prompts: some subagents should be "on brief", others slightly off-angle for coverage.
5. Once the subagents are done, inspect their artifacts or findings directly, reconcile contradictions, and use the information to do what the user wants.

If the user is in plan mode, use the information to create the plan.

## Subagent routing

| Rule | Detail |
|------|--------|
| **Probe / lanes / types** | Follow [`references/task-workflow.md`](references/task-workflow.md) (SSOT) |
| **Role vs model** | Portable role → `subagent_type` and read-only vs write-capable follow job/risk; independent of model lane |

**Done when**: every launched Task/Agent has an explicit `model` when a lane slug matched, or omitted only after probe found none.

## Parallel council runs (n ≥ 6)

- Fan out independent partitions in **one message** with multiple Task/Agent calls; lane and type rules from the SSOT.
- After results return, if synthesis is noisy, contradictory, or shallow: **merge in the parent** or run **one** follow-up Task/Agent (presumed-heavy / `[heavy]` per SSOT) for dedupe and conflict resolution. Do not re-run the whole fan-out unless partitions were wrong.
