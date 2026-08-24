---
name: setup-work
description: Optional per-repo bootstrap of `docs/agents/issue-tracker.md` and `docs/agents/domain.md` so engineering skills know where issues live (local markdown under `work/` by default; GitHub and GitLab also supported) and how to consume domain docs. May seed reviewer-owned `CODING_STANDARDS.md`. Not required for the default path — skills assume local `work/` and single-context `CONTEXT.md` / `docs/adr/` when these files are missing. Run when switching to GitHub/GitLab/custom tracker, changing tracker, confirming multi-context domain layout, or seeding coding standards.
disable-model-invocation: true
---

# Setup Work

Optional scaffold for per-repo configuration the engineering skills read when present:

- **Issue tracker** — where issues live (local markdown under `work/` by default; GitHub and GitLab are also supported out of the box)
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them
- **Coding standards** — optional reviewer-owned `CODING_STANDARDS.md` (empty **Rules** until a human accepts a rule)

**Defaults without this skill:** local markdown under `work/`, single-context `CONTEXT.md` + `docs/adr/` at the repo root, no `CODING_STANDARDS.md` until `/code-review` or `/retro` creates it on an accepted rule. Run this when those defaults are wrong, when switching trackers, or to seed `CODING_STANDARDS.md`.

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write. Do **not** edit `AGENTS.md` / `CLAUDE.md`.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub or GitLab repo? Which one?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does this skill's prior output already exist?
- `CODING_STANDARDS.md` at the repo root
- `work/` — sign that the local-markdown issue tracker convention is already in use
- `.scratch/` — legacy local-tracker root; if present and `work/` is missing (or both exist), plan a migrate into `work/` when local markdown is chosen
- Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order — one section, one answer, then the next.

## User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable in the current environment, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** (not forced multiple-choice) when the answer is inherently free-form—for example pasted logs, a paragraph describing a custom tracker workflow, or an open-ended design explanation.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when there's no monorepo; Section C when `CODING_STANDARDS.md` already exists).

Assume the user does not know what these terms mean. Each section that *does* run starts with a short explainer (what it is, why these skills need it, what changes if they pick differently). Then show the choices and the default.

**Section A — Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `to-spec`, and `wayfinder` read from and write to it — they need to know whether to write markdown under `work/`, call `gh issue create`, call `glab issue create`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: **local markdown under `work/`** (committed, not gitignored). Lead with that as the recommended answer even when a GitHub or GitLab remote exists — don't auto-pick a remote tracker just because `origin` points at github.com or gitlab.com. Still list matching remotes as alternatives so one word can accept local, or the user can opt into Issues.

Offer:

- **Local markdown** (recommended) — issues live as files under `work/<feature-slug>/` in this repo
- **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI); list when a GitHub remote exists, or if the user asks
- **GitLab** — issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI); list when a GitLab remote exists (`gitlab.com` or self-hosted), or if the user asks
- **Other** (Jira, Linear, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

If exploration found `.scratch/` and the user chooses local markdown, **migrate**: move contents into `work/` (same `<feature-slug>/` layout), then write the new convention. Don't leave both roots in active use.

Record the choice in `docs/agents/issue-tracker.md`.

**Section B — Domain docs.** Default to **single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. This fits almost every repo; write it without asking.

Offer **multi-context** — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files — only when exploration found monorepo signals. Then confirm which layout they want.

> Explainer (only when offering multi-context): Some skills (`improve-codebase-architecture`, `diagnosing-bugs`, `tdd`) read a `CONTEXT.md` file to learn the project's domain language, and `docs/adr/` for past architectural decisions. They need to know whether the repo has one global context or multiple (e.g. a monorepo with separate frontend/backend contexts) so they look in the right place.

**Section C — Coding standards.** Skip when `CODING_STANDARDS.md` already exists.

> Explainer: `/code-review` applies this file; implementers do not load it. Seed it empty. Rules are added later when you accept a nomination from `/code-review` or `/retro`.

Recommend **create the seed** (yes). On no, skip. Do not generate rules in this section.

### 3. Confirm and edit

Show the user a draft of:

- The contents of `docs/agents/issue-tracker.md` and `docs/agents/domain.md`
- `CODING_STANDARDS.md` when Section C ran (the seed, no invented rules)

Let them edit before writing.

### 4. Write

Write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker (`work/`)
- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab issue tracker
- [domain.md](./domain.md) — domain doc consumer rules + layout
- [coding-standards.md](./coding-standards.md) — reviewer-owned `CODING_STANDARDS.md` seed (Section C only)

When writing the local tracker and `.scratch/` still has content, perform the migrate into `work/` as part of this step (after the user confirmed Section A), then remove or leave an empty `.scratch/` only if nothing remains.

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.

When Section C ran, write [coding-standards.md](./coding-standards.md) to `CODING_STANDARDS.md` at the repo root. Do not invent rules.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files. Mention they can edit `docs/agents/*.md` and `CODING_STANDARDS.md` directly later — re-running this skill is only necessary if they want to switch issue trackers, change domain layout, or restart from scratch. If Section C was skipped because the file already existed, leave it untouched.
