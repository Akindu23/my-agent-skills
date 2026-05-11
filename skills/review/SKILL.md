---
name: review
description: Reviews changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (whether the code follows this repo's documented coding standards) and Spec (whether the code matches what the originating issue or PRD asked for). Runs both reviews in parallel Cursor Task invocations and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
disable-model-invocation: true
---

# Review — two-axis diff (Standards vs spec)

Invoke with **`/review`** in Agent chat so this workflow loads explicitly.

## When to use

- Reviewing a branch, PR, or uncommitted work against a baseline the user names.
- Phrases like "review since `main`", "diff against `origin/develop`", or "does this match the ticket".
- The user tags or names a doc (including an implementation **plan**) as the spec to check the diff against.

## Instructions

Two-axis review of changes since a fixed point the user supplies (committed range, uncommitted edits, or both — see step 1):

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?

Both axes run as **parallel Tasks** (`generalPurpose` subagents) so they don't pollute each other's context, then this skill aggregates their findings.

**Issue-linked specs** are optional. When you need to resolve specs from commit messages (`#123`, `Closes #45`, etc.) and the repo has `docs/agents/issue-tracker.md`, follow that file. If it is missing, skip the tracker workflow for this run: rely on user-named specs, paths under `docs/` / `specs/`, or ask the user. Repos that use the Matt Pocock stack can run **`/setup-matt-pocock-skills`** once to add the tracker doc and related agent layout.

## Process

### 1. Pin the fixed point and capture the diff

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. Don't be opinionated; pass it through. If they didn't specify one, ask: "Review against what — a branch, a commit, or `main`?" Don't proceed until you have it.

Then decide **committed branch work** vs **uncommitted / WIP** (ask if unclear):

**A. Committed changes on the branch (vs baseline)** — default when they are comparing branches or "what's on this branch":

- Diff: `git diff <fixed-point>...HEAD` (three-dot: merge-base of fixed point and `HEAD` to `HEAD`).
- History: `git log <fixed-point>..HEAD --oneline`.

**B. Uncommitted changes** — when they mention WIP, unstaged/staged work, or "before I commit":

- Single combined view vs last commit: `git diff HEAD` (staged + unstaged vs `HEAD`).
- Or split: `git diff` (unstaged) and `git diff --cached` (staged vs `HEAD`).

**C. Both** — commits since baseline *and* local edits: include **A** and **B** in the material you pass to the Tasks (two diff sections or one concatenated block with clear labels).

If **A** is empty but the user expected changes, check **B**; if there are uncommitted edits, use **B** as the primary diff (and still include **A** when non-empty for full picture).

### 2. Identify the spec source

Look for the originating spec, in this order (**explicit user choice always wins**):

1. **Tagged or named path** — anything the user points at as the spec for this review (argument, `@` file reference, pasted path, or “use this doc”). That includes an implementation **plan** (`.cursor/plans/`, etc.) when they say that is the contract to check against.
2. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — only if `docs/agents/issue-tracker.md` exists; fetch via the workflow described there. Otherwise skip this step and continue to 3.
3. A PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** Task will skip and report "no spec available".

### 3. Identify the standards sources

Anything in the repo that documents how code should be written. Common locations:

- `AGENTS.md`, `CLAUDE.md`
- `CONTRIBUTING.md`
- `CONTEXT.md`, `CONTEXT-MAP.md`, per-context `CONTEXT.md` files
- `docs/adr/` (architectural decisions are standards)
- `.editorconfig`, `eslint.config.*`, `biome.json`, `prettier.config.*`, `tsconfig.json` (machine-enforced standards — note them but don't re-check what tooling already checks)
- Any `STYLE.md`, `STANDARDS.md`, `STYLEGUIDE.md`, or similar at the repo root or under `docs/`

Collect the list of files. The **Standards** Task will read them.

### 4. Spawn both Tasks in parallel

In **one assistant turn**, issue **two Task tool calls** in parallel (two tool invocations in the same message).

For **each** Task:

- `subagent_type`: `generalPurpose`
- `model`: `composer-2-fast` — default for both axes (read-only diff + standards/spec reading).
- Use `composer-2` instead for either Task when the diff is high-stakes (security-sensitive, auth/authz, data migrations, or adversarial review depth). If the client rejects a model slug, use the closest allowed slug with the same intent (fast parallel vs deeper reasoning).

**Standards Task prompt** — include:

- The full diff output (all sections from step 1: committed and/or uncommitted, labeled) and commit list when **A** applies.
- The list of standards-source files you found in step 3.
- The brief: "Read the standards docs. Then read the diff. Report — per file/hunk where relevant — every place the diff violates a documented standard. Cite the standard (file + the rule). Distinguish hard violations from judgement calls. Skip anything tooling enforces. Under 400 words."

**Spec Task prompt** — include:

- The same diff material and commit list.
- The path or fetched contents of the spec.
- The brief: "Read the spec. Then read the diff. Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec Task and note this in the final report.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate so the user can see them independently.

End with a one-line summary: total findings per axis, and the worst single issue (if any) flagged.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
