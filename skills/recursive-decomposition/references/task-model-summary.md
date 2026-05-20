# Cursor Task `model` quick reference

Use this when launching **Task** subagents from Cursor.

| Rule | Detail |
|------|--------|
| **Slug** | `composer-2.5` on every Task |
| **Do not use** | `composer-2.5-fast`, `composer-2-fast`, `composer-2`, any `*-fast` slug, `"fast"` |

**Rule of thumb:** Parallel fan-out of safe, independent slices → multiple Tasks in one message, each `composer-2.5`; merge in the parent (or one follow-up Task) when results need deduping or conflict resolution.

For `subagent_type`, `readonly`, parallelism, and anti-patterns, see the **council** skill's `references/cursor-task-workflow.md` when that skill is installed.
