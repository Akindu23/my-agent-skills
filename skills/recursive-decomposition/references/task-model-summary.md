# Cursor Task `model` quick reference

Use this when launching **Task** subagents from Cursor.

1. **Probe** the Task `model` enum before fan-out.
2. **Default:** `composer-2.5` → `composer-2.5-fast` → inherit.
3. **Parallel (n ≥ 6):** fast-first — `composer-2.5-fast` → `composer-2.5` → inherit.

Set `model: <slug>` when a Composer slug matches; omit only when no Composer slug is in the enum.

**Rule of thumb:** Parallel fan-out of safe, independent slices → multiple Tasks in one message with the same probe rules; merge in the parent (or one follow-up Task) when results need deduping or conflict resolution.

Full workflow: [`../../council/references/cursor-task-workflow.md`](../../council/references/cursor-task-workflow.md).
