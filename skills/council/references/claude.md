# Claude Code spawn lanes

Load this file when probe selected **Claude Code** (`Agent` present, or `Task` without Composer / Grok / Gemini Flash in its `model` enum).

Docs: [Subagents](https://code.claude.com/docs/en/sub-agents), [Tools reference](https://code.claude.com/docs/en/tools-reference), [Model config](https://code.claude.com/docs/en/model-config).

**Spawn tool:** `Agent` (`Task` is a legacy alias - prefer `Agent` when both appear).

Lane classification lives in [`task-workflow.md`](task-workflow.md). This file only resolves slugs and types.

First match in the enum wins (`haiku` / `sonnet` / `opus` aliases, or the full IDs those aliases resolve to).

Three observable lanes: light (`haiku`), default (`sonnet`), complex (`opus`). Heavy and medium share `sonnet` - `[heavy]` and presumed-heavy do not pick a stronger Claude slug.

## Light

- Partition workers, `[light]`, `[standard]` → `haiku`
- Else inherit / omit per probe rules in [`task-workflow.md`](task-workflow.md)

## Default (medium and heavy)

- Serial default, `[medium]`, presumed-heavy, `[heavy]` → `sonnet`
- Else fall through to light

## Complex

- `[opus]` / `[complex]` when the subagent task is very complex → `opus` (or `claude-opus*` if that is what the enum lists)
- Else fall through to default (`sonnet`)

`fable` is not a lane. `opus` is complex-lane only - not ordinary synthesis, judge, or `[heavy]` work.

## Types

Built-in types use documented casing: `Explore`, `Plan`, `general-purpose` (see portable matrix in [`task-workflow.md`](task-workflow.md)). There is no `shell` built-in - map shell/bash work to `general-purpose`.

Read-only equivalent (no Cursor `readonly` param): `Explore` or `Plan` (Write/Edit denied), or a custom agent with write tools omitted / `permissionMode: plan`. Write-capable work → `general-purpose` (or a custom agent that includes Write/Edit).

Undocumented session types (e.g. `claude`) are not portable defaults.

`fork` and custom `.claude/agents/` names: use them only when present in the enum and required by the job.
