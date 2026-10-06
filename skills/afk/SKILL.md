---
name: afk
description: "Unattended run of approved tickets: frontier waves of parallel /implement worktrees merged to an integration branch, then /code-review until clean."
disable-model-invocation: true
---

Run the approved tickets of one `work/<feature-slug>/` **unattended**: once step 1 is done, no questions reach the user until the report. Subagents get **context pointers** (absolute paths to the ticket, spec, worktree, and skill files), never copies.

**Exit condition**: every ticket is merged or parked, the integration branch verifies green (except named `**Pre-existing failures:**`), and the last `/code-review` has zero P0/P1 or each remaining one is parked after a failed fix. Never relax it to finish.

**Surface only** irreversible actions (push, merge to `main`, deleting unmerged work) and calls no experiment can settle. Everything else is yours to fix: a flaky test, a broken verifier, a merge conflict. A ticket that hits a real question is **parked** (see `../implement/SKILL.md` **Unattended**): its dependents wait, and the run continues on the rest of the graph.

**Commit** = stage the change, then follow [`../commit-msg/SKILL.md`](../commit-msg/SKILL.md) unattended.

Route spawns per [`../council/references/task-workflow.md`](../council/references/task-workflow.md). The scout, implementers, and fixers are portable role `general-purpose`, write-capable. The merger is `conflict-resolution`.

## 1. Start

Scope is the tickets folder the user named; else the one `work/*/tickets/` with open tickets; several → ask which. The tree must be clean apart from ignored paths; dirty → stop and say so.

Create `afk/<feature-slug>` from `main` and switch to it. If it already exists, switch to it and resume from the ticket status lines. When `git check-ignore -q work` fails, append `work/` to `.git/info/exclude`.

Read every ticket's status and **Blocked by**.

Unless `work/<feature-slug>/afk-notes.md` exists, one scout Task reads the spec and tickets, maps the code and docs they touch, and writes only that file. Every implementer gets its path.

**Done when**: `afk/<feature-slug>` is checked out, every ticket is known as open, merged, or parked, and the notes file exists.

## 2. Waves

The **frontier** is every open ticket whose blockers are all merged. A **wave** is up to 3 frontier tickets, lowest number first. Per wave:

1. Per ticket: `git worktree add work/<feature-slug>/worktrees/<NN> -b afk/<feature-slug>/<NN> afk/<feature-slug>`.
2. One message, one implementer per ticket, in parallel. Prompt: the worktree path (work only there), absolute paths in this checkout to the ticket, spec, and notes (`work/` is absent from worktrees), and "Read `<absolute path to ../implement/SKILL.md>` and run it unattended on this ticket. Return ready or parked, and the commit list."
3. One merger Task in this checkout with the ready branches and their ticket paths. It merges each into `afk/<feature-slug>` with `git merge --no-ff --no-edit`, lowest number first, resolving conflicts. Then it typechecks and runs the full suite, fixes red and commits, and returns the merged list and verify state.
4. `git worktree remove` and `git branch -d` each merged ticket; parked tickets keep their worktree.
5. If `work/<feature-slug>/map.md` and `<skill-dir>/../wayfinder/scripts/render_map.py` both exist, rerender the map (otherwise skip): `python3 <skill-dir>/../wayfinder/scripts/render_map.py work/<feature-slug>` (on Windows: `py` or `python`). Run it here, not in a worktree: `work/` is only in this checkout.

**Done when**: the frontier is empty, so every ticket is merged, parked, or waiting on a parked one.

## 3. Review

Read [`../code-review/SKILL.md`](../code-review/SKILL.md) and run it here, unattended (it fans out its own subagents; running it in this session keeps nesting one level shallower). Scope `main...afk/<feature-slug>`; work items are the merged tickets. Commit its `/remove-slop` edits.

Any P0/P1 → one fixer Task with those Findings rows; it commits; review again. A round that leaves the same finding → one fresh fixer naming the failed attempt. Still there → park the finding.

**Done when**: the last review has zero P0/P1, or every remaining one is parked.

## 4. Report

- Exit condition: met, or what is parked and why.
- `afk/<feature-slug>`: `git log --oneline main..` and each wave's tickets.
- Parked tickets and findings, each with its question or failed attempt.
- The last review's Slop, Structure, and Dismissed tables and any standards candidates.

Leave the checkout on `afk/<feature-slug>`. Pushing and merging to `main` stay with the user.

**Done when**: the report covers every ticket, and every `afk` worktree left in `git worktree list` belongs to a parked ticket the report names.
