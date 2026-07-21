# Portable task / Agent spawn workflow

Use this when spawning subagents via a harness **spawn tool** (Cursor **Task**, Claude Code **Agent**). This file is the **single source of truth** for spawn `model` routing and portable role → `subagent_type` resolution. Dependents should point here; do not copy lane or priority tables elsewhere.

Docs: [Cursor Subagents](https://cursor.com/docs/subagents), [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents), [Claude Code tools](https://code.claude.com/docs/en/tools-reference).

## Scope

- Route only after probing the session’s spawn-tool schemas (or a rejection that lists allowed values). **Never invent** tool names, `model` slugs, or `subagent_type` strings from memory or stale skills.
- Prefer harness-native lanes from the sections below once the probe selects a harness.
- Plugin / custom agent frontmatter values for other harnesses are **not** interchangeable across tools — resolve via this file’s matrix and harness sections.

## Enum / tool probe (required)

Before fan-out:

1. Discover spawn tool(s) available in the session (`Task`, `Agent`, both, or neither).
2. Read `model` / `subagent_type` from the tool schema **or**, if unreadable, make one intentional invalid call and parse the rejection — never invent slugs.
3. If Composer/Grok slugs appear in a tool’s `model` enum → use that tool + **Cursor** lanes.
4. Else if `Agent` is present → use `Agent` + **Claude Code** lanes (including when `Task` exists but has no Composer/Grok).
5. Else apply Claude/fallback lanes on the spawn tool you have.
6. If neither spawn tool exists → parent does the work (no invent).
7. User-requested slug in enum always wins when present.
8. Lane resolution finds no matching slug → **omit** `model`; if the tool requires an explicit value and `inherit` is in the enum → pass `inherit`.

## Description tokens (orchestrator)

Put complexity tokens in the Task/Agent **`description`** (not the worker prompt):

| Token | Effect |
|-------|--------|
| `[heavy]` | Force **heavy** lane (unless this call is a parallel partition worker — see hard split under Choose lane) |
| `[light]` or `[standard]` | Force **light** lane even if the role is presumed-heavy |

## Choose lane (shared algorithm)

1. If the user requested a specific slug and it is in the enum → use it.
2. Else classify the Task/Agent call:
   - **Heavy lane** when **all** of:
     - not a **parallel partition worker** (hard split below), and
     - description is not `[light]` / `[standard]`, and
     - role is **presumed-heavy** **or** description includes `[heavy]`
   - **Light lane** otherwise.
3. Resolve the first matching slug from the active harness’s light/heavy tables (Cursor or Claude Code sections). Set **`model: <slug>`**. Omit `model` only when the lane (and fallthrough) finds no matching slug (or use `inherit` per probe step 8).

### Hard split (parallel workers)

Independent **partition workers** in a parallel fan-out (explore/survey slices in one message) always use the **light** lane. Do not put heavy-lane models on the swarm; run presumed-heavy / `[heavy]` work as **serial or post-batch** Task/Agent calls instead.

## Presumed-heavy roles

Closed list — match the delegate’s job, not `subagent_type` alone:

- `synthesis` (post-fan-out merge)
- `conflict-resolution` (dedupe / contradiction follow-up)
- `judge` / `critique`
- `architecture-review`

Review plugin types (`bugbot`, `security-review`, thermos auditors, …) are **not** auto-heavy unless the parent assigns one of the roles above or marks `[heavy]`.

## Portable roles

Prescribe **portable role names** in dependent skills. Resolve the exact `subagent_type` enum string from this matrix after probe. If the preferred type is absent from the enum, fall back per the unknown/missing row (do not invent).

| Portable role | Cursor `subagent_type` | Claude Code `subagent_type` |
|---------------|------------------------|-----------------------------|
| `explore` | `explore` | `Explore` |
| `general-purpose` | `generalPurpose` | `general-purpose` |
| `shell` / `bash` | `shell` | `general-purpose` |
| `plan` | `plan` (when in enum) | `Plan` |
| unknown / missing | `generalPurpose` | `general-purpose` |

Plugin / review types stay in Cursor orientation tables below — not in this matrix. Do not document undocumented Claude types (e.g. session `claude`) as portable defaults. `fork` and custom agents are out of this v1 matrix.

## Parallelism

| Situation | Approach |
|-----------|----------|
| Independent partitions (dirs, files, concerns) | Multiple Task/Agent calls in **one message**; light lane for workers; same probe rules. |
| Noisy or contradictory parallel results | **Parent synthesis** or **one** follow-up Task/Agent (presumed-heavy / heavy lane when available) for merge/dedupe. Do not re-fan-out unless partitions were wrong. |
| Overlapping write targets | Serial Task/Agent calls or a single general-purpose worker. |

## Council orchestrator contract

Model-lane routing does not imply one `subagent_type`, one permission mode, or one prompt shape. Resolve types via **Portable roles** (and Cursor orientation tables when on Cursor).

| Delegate job | Portable role (resolve via matrix) | Read-only preference | Notes |
|--------------|------------------------------------|----------------------|-------|
| Codebase survey, subsystem mapping, file ownership research | `explore` or `general-purpose` | Prefer read-only / Explore semantics | Keep findings narrow and cited by file path. Light lane (partition workers). |
| Review, critique, judge, synthesis | reviewer type from enum or `general-purpose` | Prefer read-only | Judge artifacts after workers finish; do not judge partial outputs. Presumed-heavy → heavy lane when available. |
| Implementation, codemods, doc edits, generated artifacts | `general-purpose` or a specialized writer | Write-capable | Give each writer a non-overlapping scope or serialize writers. |
| Shell, git, tests, local scripts | `shell` / `bash` (→ `general-purpose` on Claude Code) or parent shell | Write-capable when commands mutate | On Cursor, `readonly` may remove tool/MCP access; use it only when the command set is observational. |
| MCP, web, or external research | docs/research-capable type or `general-purpose` | Write-capable when tools are needed | Do not force read-only if it strips the tool access the delegate needs. |

Default to read-only for research delegates, not for the council itself. The parent remains the orchestrator: it partitions, launches, waits, audits artifacts, resolves contradictions, and decides whether another single follow-up delegate is needed.

## Anti-patterns

- Skipping the enum/tool probe and hard-coding `model` or `subagent_type` from stale skills.
- Teaching Composer/Grok or haiku/sonnet lane tables in dependent skills (drift); point at this file instead.
- Prescribing Cursor-only enum strings (`explore`, `generalPurpose`, `shell`) as universal across harnesses.
- Omitting `model` when a matching lane slug was available in the enum.
- Auto-picking non-native slugs for the active harness without a user-requested slug (e.g. Claude/GPT on Cursor when Composer/Grok exist; Composer/Grok on Claude Code).
- Putting heavy-lane models on parallel partition workers instead of a post-batch / serial heavy Task/Agent.
- Mapping plugin `haiku` / `fast` frontmatter into Cursor Task `model`.
- Treating custom `.cursor/agents/` or `.claude/agents/` names as always available without checking the enum.
- Documenting undocumented Claude `claude` built-in or putting `opus` / `fable` into **default** Claude lanes.
- Re-running entire parallel batches because synthesis was shallow.
- Leaving a stub at a retired SSOT path.

---

## Cursor

**Spawn tool:** `Task`.

### Model lanes

#### Heavy lane (order)

First match in the enum wins:

1. `cursor-grok-4.5-high`
2. Other `cursor-grok-4.5-*` preferring higher tier when several exist (`-high` > `-medium` > `-fast` > other suffix)
3. Fall through to **light lane**

#### Light lane (order)

First match in the enum wins:

1. `composer-2.5`
2. `composer-2.5-fast`
3. Inherit (omit `model`) if no Composer slug

There is **no** separate parallel/fast-first table — the same light (Composer) order applies for `n < 6` and `n ≥ 6`.

### Cursor notes

- Prefer **Cursor first-party** Task `model` slugs (Composer / Grok). **Never auto-pick** non-first-party slugs (e.g. Claude, GPT) unless the **user requested** that slug and it appears in the enum.
- Plugin agent markdown under `plugins/**/agents/*.md` may use `inherit`, `sonnet`, `haiku`, or `fast` for other harnesses — **do not** copy those values into Task `model`.
- Docs: [Subagents](https://cursor.com/docs/subagents), [Models and pricing](https://cursor.com/docs/models-and-pricing).

### Task `subagent_type` orientation (probe enum)

The enum is **session- and plugin-dependent**. Tables below are orientation only — use values that appear in the current Task tool enum. Prefer portable roles from the shared matrix when prescribing types in dependents.

**Auto-delegated (not Task picks):** Cursor may auto-delegate `explore`, `bash` (Task slug: `shell`), and `browser` without explicit Task calls.

**Custom agents:** `.cursor/agents/` or `~/.cursor/agents/` — invoked by `name` when that name appears in the enum (e.g. `code-reviewer`). Not built-in.

#### Core (usually in enum)

| `subagent_type` | `readonly` | Parallel OK? | Notes |
|-----------------|------------|--------------|--------|
| `explore` | `true` when read-only | Yes | Codebase survey; partition by directory or concern. |
| `shell` | Usually `false` | Yes when independent | CLI, git, logs. Docs call this `bash`. |
| `generalPurpose` | `false` when edits needed | Yes when partitions don't conflict | Implementation, multi-step work, custom prompts. |

#### Plugin-enabled (when installed)

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

---

## Claude Code

**Spawn tool:** `Agent` (`Task` is a legacy alias — prefer `Agent` when both appear).

### Model lanes

#### Light lane

- Parallel partition workers, `[light]`, `[standard]` → first match: `haiku`
- Else inherit / omit per probe rules

#### Heavy lane

- Default (non-parallel) + presumed-heavy / `[heavy]` → first match: `sonnet`
- Else fall through to light lane, then omit / `inherit`

**Not in default Claude lanes:** `opus`, `fable`. Skill-local overrides may request them (or full IDs) when present in the enum.

### Claude Code notes

- Built-in types use documented casing: `Explore`, `Plan`, `general-purpose` (see portable matrix). There is **no** `shell` built-in — map shell/bash work to `general-purpose`.
- **Read-only equivalent** (no Cursor `readonly` param): use `Explore` or `Plan` (Write/Edit denied), or a custom agent with write tools omitted / `permissionMode: plan`. Write-capable work → `general-purpose` (or a custom agent that includes Write/Edit).
- Do **not** treat undocumented session types (e.g. `claude`) as portable defaults.
- `fork` and custom `.claude/agents/` names are out of the v1 portable matrix; use them only when present in the enum and required by the job.
- Docs: [Subagents](https://code.claude.com/docs/en/sub-agents), [Tools reference](https://code.claude.com/docs/en/tools-reference), [Model config](https://code.claude.com/docs/en/model-config).
