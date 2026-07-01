# Cursor Task tool workflow (Composer family)

Use this when spawning subagents via the **Task** tool. In Cursor docs, **Task** is the agent tool; **subagent** is the worker it launches ([Subagents](https://cursor.com/docs/subagents)).

## Scope

- Prefer **Composer-family** Task `model` slugs from the session enum; inherit the parent only when **no** Composer slug is listed.
- Plugin agent markdown under `plugins/**/agents/*.md` may use `inherit`, `sonnet`, `haiku`, or `fast` for other harnesses — **do not** copy those values into Task `model`.
- Docs: [Subagents](https://cursor.com/docs/subagents), [Models and pricing](https://cursor.com/docs/models-and-pricing).

## Enum probe (required)

Before fan-out, read the Task tool **`model`** and **`subagent_type`** parameter enums (or attempt a Task call and read available values from a rejection). **Do not** assume slugs from memory or stale skills.

## Priority after probe (`model`)

Pick the **first** slug in the list that appears in the session enum. Set **`model: <slug>`** when a Composer slug is chosen; **omit** `model` only when **no** Composer slug appears (inherit parent).

| Context | Order (first match wins) |
|---------|--------------------------|
| **Default** (n < 6 or unspecified) | `composer-2.5` → `composer-2.5-fast` → inherit |
| **Parallel** (n ≥ 6 independent Task calls in one message) | `composer-2.5-fast` → `composer-2.5` → inherit |

User-requested slugs override these tables when they appear in the enum.

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

The Composer-family rule applies to **`model`** only. It does not imply one `subagent_type`, one permission mode, or one prompt shape.

| Delegate job | `subagent_type` | `readonly` | Notes |
|--------------|-----------------|------------|-------|
| Codebase survey, subsystem mapping, file ownership research | `explore` or `generalPurpose` | `true` | Keep findings narrow and cited by file path. |
| Review, critique, judge, synthesis | reviewer type from enum or `generalPurpose` | `true` | Judge artifacts after workers finish; do not judge partial outputs. |
| Implementation, codemods, doc edits, generated artifacts | `generalPurpose` or a specialized writer | `false` | Give each writer a non-overlapping scope or serialize writers. |
| Shell, git, tests, local scripts | `shell` or parent shell | `false` | `readonly` may remove tool/MCP access; use it only when the command set is observational. |
| MCP, web, or external research | docs/research-capable type or `generalPurpose` | `false` when tools are needed | Do not set `readonly: true` if it strips the tool access the delegate needs. |

Default to read-only for research delegates, not for the council itself. The parent remains the orchestrator: it partitions, launches, waits, audits artifacts, resolves contradictions, and decides whether another single follow-up delegate is needed.

## Parallelism

| Situation | Approach |
|-----------|----------|
| Independent partitions (dirs, files, concerns) | Multiple **Task** calls in **one message**; same probe rules; **parallel** uses fast-first priority order. |
| Noisy or contradictory parallel results | **Parent synthesis** or **one** follow-up Task (same probe rules) for merge/dedupe. Do not re-fan-out unless partitions were wrong. |
| Overlapping write targets | Serial Tasks or single `generalPurpose` Task. |

## Anti-patterns

- Skipping the enum probe and hard-coding `model` or `subagent_type` from stale skills.
- Omitting `model` when a Composer slug was available in the enum.
- Mapping plugin `haiku` / `fast` frontmatter to Task `model` in Cursor.
- Treating custom `.cursor/agents/` names as always available without checking the enum.
- Re-running entire parallel batches because synthesis was shallow.
