---
name: retro
description: Session retrospective — propose environment improvements (pointers, checks, reviewer standards, tool economy). Apply only what you accept.
disable-model-invocation: true
---

# Retro

Improve the coding agent's **environment** from a finished session. You propose **candidates**; the user accepts; then you apply.

## User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable, ask the same choices in ordinary chat.

## 1. Writing style

Run `/writing-for-agents` (read [`../writing-for-agents/SKILL.md`](../writing-for-agents/SKILL.md) if not already loaded). That skill is the style guide for every steering-file or skill edit this run may produce.

**Done when**: `writing-for-agents` is in context.

## 2. Sources

Read the session the user names. If they name none, use the current conversation. Search this machine's session logs only when they point at another run.

**Done when**: the primary source for that session is in context.

## 3. Candidates

Scan the session for candidates. A candidate is a concrete change to the environment, not a recap of the work. Use every category that fired; skip the rest.

- **Navigation** — a **navigation pointer** (usually one line in `AGENTS.md` / `CLAUDE.md`) would have found the file or dependency faster. Use when the session spent a long time locating information.
- **Automated checks** — a linter, typecheck, test, or filesystem check would have caught the agent's mistake. Use when the mistake is mechanically detectable.
- **Coding standards** — a this-repo rule for the **reviewer** (`CODING_STANDARDS.md`). Membership is the preamble of that file, or the seed at [`../setup-work/coding-standards.md`](../setup-work/coding-standards.md) if the file is missing. Use when a missed convention belongs in **Rules**.
- **Steering load** — a line in `AGENTS.md` / `CLAUDE.md` (repo or user-global) should move to coding standards, an automated check, or a skill. Use when those files are large.
- **Tool economy** — an expensive or token-heavy tool/MCP/CLI call has a tighter path. Use when the session paid that cost.
- **No-ops** — a steering instruction that does not change behaviour vs the model's default. Use when steering files are large.
- **Information access** — logs, readonly third-party access, or a tee'd dev server would have unblocked the agent. Use when a needed fact was out of reach.

**Done when**: every firing category has its candidates listed, or you can state that none fired.

## 4. Present

Show candidates in severity order (highest first). Each one: the change, where it lands, and the session evidence that justifies it.

Then **AskQuestion** per candidate (accept / skip). Ask coding-standards candidates one after another.

**Done when**: every candidate has accept or skip.

## 5. Apply

Apply only accepted candidates. Draft every steering-file or skill edit under `/writing-for-agents`.

- **`CODING_STANDARDS.md`**: if missing, copy the seed from [`../setup-work/coding-standards.md`](../setup-work/coding-standards.md) (if that path exists) or recreate that seed's heading, preamble, and empty `## Rules`. Append each accepted rule under `## Rules`.
- **Navigation pointers / steering load / no-ops**: edit whichever of `AGENTS.md` or `CLAUDE.md` the repo already uses. Pointer lines name the target and the branch that should load it.
- **Automated checks / tool economy / information access**: make the repo change the candidate named (script, CI step, config). Skip and say so when the change needs credentials or a dashboard the agent cannot complete.
- **Skills**: apply the accepted skill edit.

**Done when**: every accepted candidate is applied or explicitly skipped with why, and skipped candidates are untouched.

## Reference

### Implementer vs reviewer

The implementer carries exploration, writing, and debug — **context pressure**. The reviewer receives a diff. **Coding standards bind the reviewer** (`/code-review` reads `CODING_STANDARDS.md`).

### Files this pack already owns

- `AGENTS.md` / `CLAUDE.md` — always-loaded; **navigation pointers** and almost nothing else. `/setup-work` does not edit these; this skill may, on accept.
- `CODING_STANDARDS.md` — reviewer-owned. Seed: [`../setup-work/coding-standards.md`](../setup-work/coding-standards.md).
- `CONTEXT.md` / `docs/adr/` / `docs/agents/` — domain and tracker layout.
- Skills — `/writing-for-agents` is the style guide.
