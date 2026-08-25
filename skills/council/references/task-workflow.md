# Portable task / Agent spawn workflow

Use this when spawning subagents via a harness **spawn tool** (Cursor **Task**, Claude Code **Agent**). This file is the spawn-routing source for `model` lanes and portable role → `subagent_type`. Dependents point here; after probe, load exactly one harness file.

Lane tables live in [`cursor.md`](cursor.md) and [`claude.md`](claude.md) — do not copy them into other skills.

## Scope

- Route only after probing the session’s spawn-tool schemas (or a rejection that lists allowed values). Use only tool names, `model` slugs, and `subagent_type` strings from that probe.
- Prefer harness-native lanes from the harness file probe selects.
- Plugin / custom agent frontmatter values are not interchangeable across tools — resolve via this file’s matrix and the harness file.

## Enum / tool probe (required)

Before fan-out:

1. Discover spawn tool(s) available in the session (`Task`, `Agent`, both, or neither).
2. Read `model` / `subagent_type` from the tool schema **or**, if unreadable, make one intentional invalid call and parse the rejection — never invent slugs.
3. If the spawn tool is `Task` and the `model` enum contains Composer, Grok, or Gemini Flash → that tool + read [`cursor.md`](cursor.md).
4. Else if `Agent` is present → `Agent` + read [`claude.md`](claude.md) (including when `Task` exists but failed step 3).
5. Else apply [`claude.md`](claude.md) on the spawn tool you have.
6. If neither spawn tool exists → parent does the work (no invent).
7. User-requested slug in enum always wins when present.
8. Lane resolution finds no matching slug → **omit** `model`; if the tool requires an explicit value and `inherit` is in the enum → pass `inherit`.

## Description tokens (orchestrator)

Put complexity tokens in the Task/Agent **`description`** (not the worker prompt):

| Token | Effect |
|-------|--------|
| `[opus]` or `[complex]` | Force **complex** lane (Claude Code: opus when in enum; Cursor: falls through to heavy). Ignored on partition workers. |
| `[heavy]` | Force **heavy** lane (unless this call is a partition worker) |
| `[medium]` | Force **medium** lane (unless this call is a partition worker) |
| `[light]` or `[standard]` | Force **light** lane even if the role is presumed-heavy |

## Choose lane

A **partition worker** is an explore/survey slice of a fan-out (paths or concerns). Always the **light** lane.

A **specialist** (review, yagni, thermos, judge) is not a partition worker even when several launch in one message. Lane follows presumed-heavy / `[heavy]` / the dependent skill.

**Presumed-heavy** jobs default to the heavy lane when they are not partition workers (match the delegate’s job, not `subagent_type` alone): `synthesis` (post-fan-out merge), `conflict-resolution` (dedupe / contradiction follow-up), `judge` / `critique`, `architecture-review`. Review plugin types (`bugbot`, `security-review`, thermos auditors, …) are not auto-heavy unless the parent assigns one of those jobs or marks `[heavy]`.

1. If the user requested a specific slug and it is in the enum → use it.
2. Else classify the Task/Agent call (first match):
   - **Light** if it is a **partition worker** **or** description is `[light]` / `[standard]`
   - **Complex** if description includes `[opus]` / `[complex]`
   - **Heavy** if the role is **presumed-heavy** **or** description includes `[heavy]`
   - **Medium** otherwise (serial default), including `[medium]`
3. Resolve a slug from the active harness file for that lane: each row is a **family glob**. Take the **first enum value that matches** (enum order). Do **not** rank reasoning-effort suffixes (`-high`, `-medium`, `-fast`, thinking, and similar). Fall through **complex → heavy → medium → light**. Set **`model: <slug>`**. Omit `model` only when the lane (and fallthrough) finds no matching slug (or use `inherit` per probe step 8).

After a fan-out: parent merges, or one presumed-heavy / `[heavy]` follow-up. Re-partition only when slices were wrong. Mark `[opus]` / `[complex]` only when that follow-up is genuinely hard (large contradictory batch, multi-subsystem architecture).

## Portable roles

Prescribe **portable role names** in dependent skills. Resolve the exact `subagent_type` enum string from this matrix after probe. If the preferred type is absent from the enum, fall back per the unknown/missing row (do not invent).

| Portable role | Cursor `subagent_type` | Claude Code `subagent_type` |
|---------------|------------------------|-----------------------------|
| `explore` | `explore` | `Explore` |
| `general-purpose` | `generalPurpose` | `general-purpose` |
| `shell` / `bash` | `shell` | `general-purpose` |
| `plan` | `plan` (when in enum) | `Plan` |
| `judge` / `critique` | reviewer type from enum if present, else `generalPurpose` | `general-purpose` |
| `synthesis` / `conflict-resolution` | `generalPurpose` | `general-purpose` |
| `architecture-review` | `generalPurpose` | `general-purpose` |
| unknown / missing | `generalPurpose` | `general-purpose` |

Plugin / review type strings stay in [`cursor.md`](cursor.md). Undocumented Claude types (e.g. session `claude`) are not portable defaults. `fork` and custom agents are out of this v1 matrix.

## Delegate jobs

Model-lane routing does not imply one `subagent_type`, one permission mode, or one prompt shape. Resolve types via **Portable roles** (and [`cursor.md`](cursor.md) orientation tables when on Cursor). Parent partitions, launches, waits, and merges; dive permissions follow this table.

| Delegate job | Portable role (resolve via matrix) | Read-only preference | Notes |
|--------------|------------------------------------|----------------------|-------|
| Codebase survey, subsystem mapping, file ownership research | `explore` or `general-purpose` | Prefer read-only / Explore semantics | Keep findings narrow and cited by file path. Light lane (partition workers). |
| Review, critique, judge, synthesis | `judge` or `synthesis` | Prefer read-only | Judge artifacts after workers finish; do not judge partial outputs. Presumed-heavy → heavy lane when available. `[opus]` / `[complex]` only when the task is very complex — not the default for every judge. |
| Implementation, codemods, doc edits, generated artifacts | `general-purpose` or a specialized writer | Write-capable | Give each writer a non-overlapping scope or serialize writers. Overlapping write targets: serial Task/Agent calls or a single general-purpose worker. |
| Shell, git, tests, local scripts | `shell` / `bash` (→ `general-purpose` on Claude Code) or parent shell | Write-capable when commands mutate | On Cursor, `readonly` may remove tool/MCP access; use it only when the command set is observational. |
| MCP, web, or external research | docs/research-capable type or `general-purpose` | Write-capable when tools are needed | Read-only only when it still leaves the tools the delegate needs. |

## Guardrails

- Plugin `haiku` / `fast` / `sonnet` frontmatter are not Cursor Task `model` values (see [`cursor.md`](cursor.md)).
- Custom `.cursor/agents/` or `.claude/agents/` names only when that name appears in the current enum.
