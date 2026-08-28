# Cursor spawn lanes

Load this file when probe selected **Cursor** (`Task`, and the `model` enum contains Composer, Grok, or Gemini Flash).

Docs: [Subagents](https://cursor.com/docs/subagents), [Models and pricing](https://cursor.com/docs/models-and-pricing).

**Spawn tool:** `Task`.

Lane classification lives in [`task-workflow.md`](task-workflow.md). This file only resolves slugs and types.

Each row is a family glob. First enum slug that matches wins. Effort suffixes (`-high`, `-medium`, `-fast`, thinking, and similar) are not ranked.

`[opus]` / `[complex]` have no Cursor opus equivalent: fall through to **heavy**.

## Heavy

1. `cursor-grok-4.6-*` or `grok-4.6-*`
2. Fall through to **medium**

## Medium

Members: `gemini-3.7-flash-*` and exact `composer-2.5` (never `composer-2.5-fast`).

If the enum has Gemini Flash, use the first `gemini-3.7-flash-*` slug. Else use exact `composer-2.5`.

Fall through to **light**.

Grok 4.6 is not a medium slug.

## Light

1. `composer-2.5` (not `composer-2.5-fast`)
2. Inherit (omit `model`) if that slug is absent

The same light slug applies to every partition worker.

## Notes

- Auto-pick Composer, Grok, or Gemini Flash per the lanes above. Claude or GPT only when the user requested that slug and it appears in the enum.
- Plugin agent markdown under `plugins/**/agents/*.md` may use `inherit`, `sonnet`, `haiku`, or `fast` for other harnesses - those are not Task `model` values.

## Task `subagent_type` orientation (probe enum)

The enum is session- and plugin-dependent. Use values that appear in the current Task tool enum. Prefer portable roles from [`task-workflow.md`](task-workflow.md).

**Auto-delegated (not Task picks):** Cursor may auto-delegate `explore`, `bash` (Task slug: `shell`), and `browser` without explicit Task calls.

**Custom agents:** `.cursor/agents/` or `~/.cursor/agents/` - invoked by `name` when that name appears in the enum (e.g. `code-reviewer`). Not built-in.

### Core (usually in enum)

| `subagent_type` | `readonly` | Parallel OK? | Notes |
|-----------------|------------|--------------|--------|
| `explore` | `true` when read-only | Yes | Codebase survey; partition by directory or concern. |
| `shell` | Usually `false` | Yes when independent | CLI, git, logs. Docs call this `bash`. |
| `generalPurpose` | `false` when edits needed | Yes when partitions don't conflict | Implementation, multi-step work, custom prompts. |

### Plugin-enabled (when installed)

Probe the enum. Examples by role:

| Role | Examples (if in enum) | `readonly` | Parallel OK? |
|------|----------------------|------------|--------------|
| Product / how-to | `cursor-guide` | `true` typical | Yes |
| CI | `ci-watcher`, `ci-investigator` | `true` typical | Yes |
| Library docs | `docs-researcher` | `true` typical | Yes; one lib per subagent when ambiguous |
| Code review | `bugbot`, `security-review`, `security-auditor` | `true` typical | Yes per file/area |
| Thermos audits | `thermo-nuclear-code-quality-review`, `thermo-nuclear-review-subagent`, `thermo-nuclear-code-quality-review-subagent` | `true` typical | Yes per area |
| Repo probes | `compatibility-scan-review`, `docs-reliability-review`, `startup-review`, `validation-review` | `true` typical | Varies |
| Variants | `best-of-n-runner` | `false` | Parallel variants OK; parent picks winner |
| Memory | `agents-memory-updater` | `false` | Prefer serial; avoid concurrent `AGENTS.md` writers |
