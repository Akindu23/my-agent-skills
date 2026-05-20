# Cursor Task workflow (Composer 2.5)

Use this when spawning the **Task** tool from Cursor.

## Scope

- Every Task call sets **`model: composer-2.5`** (standard Composer tier; Composer pool).
- Plugin agent markdown under `plugins/**/agents/*.md` may use `inherit`, `sonnet`, `haiku`, or `fast` for other harnesses — **do not** copy those values into Cursor Task `model`.
- **Do not use:** `composer-2.5-fast`, `composer-2-fast`, `composer-2`, any `*-fast` slug, or `"fast"` as a Task model.

**Pricing note:** Composer 2.5 *fast* is a latency tier with higher per-token cost than standard — not a token-savings lever. See [Cursor models and pricing](https://cursor.com/docs/models-and-pricing.md).

**Fallback** if `composer-2.5` is rejected by the session schema: try `composer-2`, then omit `model` and inherit the parent (intent remains standard Composer only).

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

Use the same **`model: composer-2.5`** for all `ce-*` Task types. Choose `subagent_type`, `readonly`, and prompt depth by role — not by model slug.

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
| Independent partitions (dirs, files, concerns) | Multiple Tasks in **one message**; same `model: composer-2.5`. |
| Noisy or contradictory parallel results | **Parent synthesis** or **one** follow-up Task (`composer-2.5`) for merge/dedupe — don't re-fan-out unless partitions were wrong. |
| Overlapping write targets | Serial Tasks or single `generalPurpose` Task. |

## Anti-patterns

- Using fast slugs to "save tokens" (fast costs more per token for Composer 2.5).
- Omitting `model` without a documented fallback path.
- Mapping plugin `haiku` / `fast` frontmatter to Task `model` in Cursor.
- Re-running entire parallel batches because synthesis was shallow — fix synthesis first.
