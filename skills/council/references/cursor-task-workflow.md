# Cursor Task tool workflow (first-party models)

Use this when spawning subagents via the **Task** tool. In Cursor docs, **Task** is the agent tool; **subagent** is the worker it launches ([Subagents](https://cursor.com/docs/subagents)).

This file is the **single source of truth** for Task `model` routing. Dependents should point here; do not copy priority tables elsewhere.

## Scope

- Prefer **Cursor first-party** Task `model` slugs from the session enum: **Composer** (`composer-2.5`, `composer-2.5-fast`, …) and **Grok** (`cursor-grok-4.5-*`).
- **Never auto-pick** non-first-party slugs (e.g. Claude, GPT). Use them only when the **user requested** that slug and it appears in the enum.
- **Omit** `model` (inherit parent) only when **no** first-party slug is listed.
- Plugin agent markdown under `plugins/**/agents/*.md` may use `inherit`, `sonnet`, `haiku`, or `fast` for other harnesses — **do not** copy those values into Task `model`.
- Docs: [Subagents](https://cursor.com/docs/subagents), [Models and pricing](https://cursor.com/docs/models-and-pricing).

## Enum probe (required)

Before fan-out, read the Task tool **`model`** and **`subagent_type`** parameter enums (or attempt a Task call and read available values from a rejection). **Do not** assume slugs from memory or stale skills.

## Description tokens (orchestrator)

Put complexity tokens in the Task **`description`** (not the worker prompt):

| Token | Effect |
|-------|--------|
| `[heavy]` | Force **Grok lane** (unless this Task is a parallel partition worker — see hard split) |
| `[light]` or `[standard]` | Force **Composer lane** even if the role is presumed-heavy |

## Choose lane, then slug

1. If the user requested a specific slug and it is in the enum → use it.
2. Else classify the Task:
   - **Grok lane** when **all** of:
     - not a **parallel partition worker** (hard split below), and
     - description is not `[light]` / `[standard]`, and
     - role is **presumed-heavy** **or** description includes `[heavy]`
   - **Composer lane** otherwise.
3. Pick the first matching slug in that lane’s order. Set **`model: <slug>`**. Omit `model` only when the lane (and fallthrough) finds no first-party slug.

### Presumed-heavy roles (auto-Grok)

Closed list — match the delegate’s job, not `subagent_type` alone:

- `synthesis` (post-fan-out merge)
- `conflict-resolution` (dedupe / contradiction follow-up)
- `judge` / `critique`
- `architecture-review`

Review plugin types (`bugbot`, `security-review`, thermos auditors, …) are **not** auto-Grok unless the parent assigns one of the roles above or marks `[heavy]`.

### Hard split (parallel workers)

Independent **partition workers** in a parallel fan-out (explore/survey slices in one message) always use the **Composer lane**. Do not put Grok on the swarm; run presumed-heavy / `[heavy]` work as **serial or post-batch** Tasks instead.

### Grok lane (order)

First match in the enum wins:

1. `cursor-grok-4.5-high`
2. Other `cursor-grok-4.5-*` preferring higher tier when several exist (`-high` > `-medium` > `-fast` > other suffix)
3. Fall through to **Composer lane**

### Composer lane (order)

First match in the enum wins:

1. `composer-2.5`
2. `composer-2.5-fast`
3. Inherit (omit `model`) if no Composer slug

There is **no** separate parallel/fast-first table — the same Composer order applies for `n < 6` and `n ≥ 6`.

## Task `subagent_type` (probe enum)

The enum is **session- and plugin-dependent**. Tables below are orientation only — use values that appear in the current Task tool enum.

**Auto-delegated (not Task picks):** Cursor may auto-delegate `explore`, `bash` (Task slug: `shell`), and `browser` without explicit Task calls.

**Custom agents:** `.cursor/agents/` or `~/.cursor/agents/` — invoked by `name` when that name appears in the enum (e.g. `code-reviewer`). Not built-in.

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

## Council orchestrator contract

First-party **`model`** routing does not imply one `subagent_type`, one permission mode, or one prompt shape.

| Delegate job | `subagent_type` | `readonly` | Notes |
|--------------|-----------------|------------|-------|
| Codebase survey, subsystem mapping, file ownership research | `explore` or `generalPurpose` | `true` | Keep findings narrow and cited by file path. Composer lane (partition workers). |
| Review, critique, judge, synthesis | reviewer type from enum or `generalPurpose` | `true` | Judge artifacts after workers finish; do not judge partial outputs. Presumed-heavy → Grok lane when available. |
| Implementation, codemods, doc edits, generated artifacts | `generalPurpose` or a specialized writer | `false` | Give each writer a non-overlapping scope or serialize writers. |
| Shell, git, tests, local scripts | `shell` or parent shell | `false` | `readonly` may remove tool/MCP access; use it only when the command set is observational. |
| MCP, web, or external research | docs/research-capable type or `generalPurpose` | `false` when tools are needed | Do not set `readonly: true` if it strips the tool access the delegate needs. |

Default to read-only for research delegates, not for the council itself. The parent remains the orchestrator: it partitions, launches, waits, audits artifacts, resolves contradictions, and decides whether another single follow-up delegate is needed.

## Parallelism

| Situation | Approach |
|-----------|----------|
| Independent partitions (dirs, files, concerns) | Multiple **Task** calls in **one message**; Composer lane for workers; same probe rules. |
| Noisy or contradictory parallel results | **Parent synthesis** or **one** follow-up Task (presumed-heavy / Grok lane when available) for merge/dedupe. Do not re-fan-out unless partitions were wrong. |
| Overlapping write targets | Serial Tasks or single `generalPurpose` Task. |

## Anti-patterns

- Skipping the enum probe and hard-coding `model` or `subagent_type` from stale skills.
- Omitting `model` when a first-party slug was available in the enum.
- Auto-picking Claude/GPT (or other non-first-party) without a user-requested slug.
- Putting Grok on parallel partition workers instead of a post-batch / serial heavy Task.
- Copying priority tables into dependent skills (drift); point at this file instead.
- Mapping plugin `haiku` / `fast` frontmatter to Task `model` in Cursor.
- Treating custom `.cursor/agents/` names as always available without checking the enum.
- Re-running entire parallel batches because synthesis was shallow.
