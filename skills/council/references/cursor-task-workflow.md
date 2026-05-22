# Cursor Task workflow (Composer family)

Use this when spawning the **Task** tool from Cursor.

## Scope

- Prefer **Composer-family** Task `model` slugs from the session enum; inherit the parent only when **no** Composer slug is listed.
- Plugin agent markdown under `plugins/**/agents/*.md` may use `inherit`, `sonnet`, `haiku`, or `fast` for other harnesses — **do not** copy those values into Cursor Task `model`.
- Docs: [Subagents](https://cursor.com/docs/subagents), [Models and pricing](https://cursor.com/docs/models-and-pricing).

## Enum probe (required)

Before fan-out, read the Task tool **`model`** parameter description or enum (or attempt a Task and read **Available models** from a rejection). **Do not** assume slugs from memory or stale skills.

## Priority after probe

Pick the **first** slug in the list that appears in the session enum. Set **`model: <slug>`** when a Composer slug is chosen; **omit** `model` only when **no** Composer slug appears (inherit parent).

| Context | Order (first match wins) |
|---------|--------------------------|
| **Default** (n < 6 or unspecified) | `composer-2.5` → `composer-2.5-fast` → `composer-2` → `composer-2-fast` → inherit |
| **Parallel** (n ≥ 6 independent Tasks in one message) | `composer-2.5-fast` → `composer-2.5` → `composer-2-fast` → `composer-2` → inherit |

User-requested slugs override these tables when they appear in the enum.

## Built-in Task types

| `subagent_type` | `readonly` | Parallel OK? | Notes |
|-----------------|------------|--------------|--------|
| `explore` | `true` when read-only | Yes | Codebase survey; partition by directory or concern. |
| `shell` | Usually `false` | Yes when independent | CLI, git, logs; scope each command set. |
| `generalPurpose` | `false` when edits needed | Yes when partitions don't conflict | Implementation, multi-step work. |
| `cursor-guide` | `true` typical | Yes | Product / how-to questions. |
| `ci-watcher` | `true` typical | Yes | Poll checks; light synthesis. |
| `docs-researcher` | `true` typical | Yes | Library docs via Context7; one lib per Task when ambiguous. |
| `code-reviewer`, `typescript-reviewer`, `python-reviewer` | `true` typical | Yes per file/area | Match user agents under `~/.cursor/agents/`. |
| `best-of-n-runner` | `false` | Parallel variants OK | Isolated worktrees; parent picks winner. |
| `agents-memory-updater` | `false` | Prefer serial | Durable `AGENTS.md` edits; avoid concurrent writers. |

## Compound Engineering (`ce-*`)

Use the same **enum probe + priority** for all `ce-*` Task types. Choose `subagent_type`, `readonly`, and prompt depth by role — not by model slug.

| Pattern | `readonly` | Notes |
|---------|------------|--------|
| Doc consistency (`ce-coherence-reviewer`, `ce-code-simplicity-reviewer`) | `true` | Mechanical passes. |
| Security / data / adversarial reviewers | `false` when fixes needed | Need write access for fixes. |
| `ce-explore`-style survey agents | `true` | Pair with narrow `Scope:` in prompt. |
| `ce-repo-research-analyst` | `true` for phased survey | Full onboarding: fewer, wider Tasks. |
| Design / Figma sync | varies | Screenshots + code paths in prompt. |

Full agent list lives in the Cursor Task tool schema for your build; behavioral notes above apply regardless of agent name.

## Parallelism

| Situation | Approach |
|-----------|----------|
| Independent partitions (dirs, files, concerns) | Multiple Tasks in **one message**; same probe rules; **parallel** uses fast-first priority order. |
| Noisy or contradictory parallel results | **Parent synthesis** or **one** follow-up Task (same probe rules) for merge/dedupe — don't re-fan-out unless partitions were wrong. |
| Overlapping write targets | Serial Tasks or single `generalPurpose` Task. |

## Anti-patterns

- Skipping the enum probe and hard-coding slugs from stale skills.
- Omitting `model` when a Composer slug was available in the enum.
- Mapping plugin `haiku` / `fast` frontmatter to Task `model` in Cursor.
- Re-running entire parallel batches because synthesis was shallow — fix synthesis first.
