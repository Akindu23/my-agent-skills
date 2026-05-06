# Cursor Task `model` quick reference

Use this when launching **Task** subagents from Cursor. Set `model` explicitly on every Task call; choice is based on the subagent’s job, not the parent chat model.

| Tier | Model | Typical use |
|------|--------|-------------|
| **A** | `composer-2-fast` | Read-only `explore` sweeps, mechanical hygiene, narrow research, parallel batches of independent partitions, log/CI polling. |
| **B** | `composer-2` | `generalPurpose` implementation, merge/synthesis after noisy parallel runs, security/data/adversarial reviewers, architecture or design-fidelity work that needs full depth. |
| **C** | Either | Small edits vs large refactors: prefer **fast** for trivial or isolated edits and **full** when the task changes behaviour, contracts, or risk surface in a meaningful way. |

**Rule of thumb:** Parallel fan-out of safe, independent slices → `composer-2-fast` for each; one follow-up **`composer-2`** Task (or parent synthesis) when results need deduping or conflict resolution.

For the expanded agent-type matrix, use the **council** skill’s `references/cursor-subagent-model-matrix.md` when that skill is installed — this file stays short on purpose.
