---
name: council
description: "Explores the codebase in a given area, spawns Task subagents (as much as requested by the main agent unless specified) for parallel deep dives including some out-of-the-box angles, then synthesizes results for the user's request or a plan. Use for multi-area codebase review, research before planning, broad architecture reconnaissance, or any task that benefits from parallel exploration."
disable-model-invocation: true
---

Based on the given area of interest, please:

1. Dig around the codebase in terms of that given area of interest, gather general information such as keywords and architecture overview.
2. Spawn **n={as much as needed by the main agent}** (unless specified otherwise) subagents with the **Task** tool. For **every** `Task` call, set the **`model`** field explicitly to the **Composer 2** family:
   - **`composer-2-fast`** — default for **Tier A** work and for **parallel** batches (lighter, faster; best token value when partitions are independent).
   - **`composer-2`** — use for **Tier B** work and whenever a subagent needs **full** reasoning depth (security, migrations, adversarial review, merge/synthesis quality).
   Do **not** omit `model` and do **not** mirror the main chat's model; subagent model choice is independent of the parent session.
3. Diversify prompts: some subagents should be "on brief", others slightly off-angle for coverage.
4. Once the subagents are done, use the information to do what the user wants.

If the user is in plan mode, use the information to create the plan.

## Task `model`: tier defaults

Pick `model` from the subagent's **role** (the `subagent_type` and prompt), not from the parent chat model.

| Tier | `model` | When |
|------|---------|------|
| **A** | `composer-2-fast` | Read-only `explore` sweeps, narrow research, tool-heavy scripts, CI/log polling, routine doc fetch, mechanical doc/code hygiene. |
| **B** | `composer-2` | `generalPurpose` implementation, all high-stakes reviewers (security, data, adversarial, API contracts), language reviewers, design fidelity, architecture/product lenses, `agents-memory-updater`. |
| **C** | Either | Depends on sub-prompt shape — see `references/cursor-subagent-model-matrix.md` (e.g. small README edit vs full rewrite; pattern scan vs architecture-changing refactors). |

Full tables for **`ce-*`** agents and other Task types: `references/cursor-subagent-model-matrix.md`.

## Parallel council runs (n ≥ 6)

- Run **all** parallel partition subagents on **`composer-2-fast`** when each partition is read-only or low-risk.
- After results return, if synthesis is noisy, contradictory, or shallow, run **one** follow-up Task with **`composer-2`** (or synthesize in the parent) dedicated to **merge, dedupe, and conflict resolution** — do not re-run the whole fan-out on full model unless needed.

## Slugs

Use only **`composer-2`** and **`composer-2-fast`** unless the session's Task tool rejects a slug; then follow the product schema for that build. Both slugs are valid in current Cursor Task invocations.

If Task returns an unsupported-model error, check the Task/subagent schema for your Cursor build and substitute the closest allowed slug while keeping the same tier intent (`composer-2-fast`-class vs `composer-2`-class).
