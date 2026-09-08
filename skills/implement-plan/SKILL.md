---
name: implement-plan
description: Heavy one-shot implement of an attached plan (baseline → council → best practices → Karpathy → YAGNI).
disable-model-invocation: true
---

Using the plan attached to this message (typically `work/<feature-slug>/plan.md` from `/to-plan`, or any attached plan):

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session - field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

1. **Baseline.** Locate the plan's **edit targets** (the files the plan's steps will change), then run the full typecheck plus the baseline test scope on the untouched tree. Test scope is the first rung that resolves: runner-related tests for the edit targets (`jest --findRelatedTests` / `vitest related`), else the owning package's test script (`pnpm --filter <pkg> test`), else tests colocated with the edit targets (same dir, `__tests__/`, `<basename>.test.*`), else (edit targets not locatable) the full suite. Record the command on the plan as `Baseline: <command>`. Green: continue. Red: diagnose in one short block (which tests, which files, inside or outside the edit targets), then one structured MCQ. Put the overlap fact in the question. Typecheck errors classify by the paths they name, same inside/outside split. Omit **Proceed** when any failure is inside the edit targets.
   - **Fix first** - repair the baseline, run `/commit-msg` on that repair only, then re-run verify. Later steps start only when that re-run is green.
   - **Proceed** - write `**Pre-existing failures:**` on the plan (each failing path + one-liner). Later verify may still fail those paths: leave them.
   - **Abort** - stop this run. Next hop: a prefactor in a later session (`/to-tickets`, or a new first plan step).
   Mechanical (missing install, stale generated file, cache): fix, say so, re-run verify. File changes from that fix go through `/commit-msg` before later steps, same gate as Fix first.
   **Done when**: verify is green, or Proceed was accepted and `**Pre-existing failures:**` is on the plan.

2. Run `/council` scoped to every area the plan touches, to gather context and validate the plan's approach against the existing codebase. **Done when**: every file/area the plan will change has been explored.
3. Run `/best-practices-research` on the domains the plan touches, before writing any code. **Done when**: every recommendation is incorporated into the plan or explicitly rejected.
4. Implement the plan, following `/karpathy-guidelines`. Run the full test suite once at the end. An end-suite failure outside the `Baseline:` scope: check that test on a clean checkout (stash or worktree). Reproduces → append it to `**Pre-existing failures:**` (path + one-liner) and leave it. Does not → fix before close. **Done when**: every step in the plan is implemented, and the end suite is green except named `**Pre-existing failures:**`.
5. Run a `/yagni` **Review** over the changes made in step 4 (simplify misses). **Done when**: rungs 1-7 are each hit or miss on the step-4 diff, and misses are simplified.
6. Close the plan **on disk**: mark the plan file's status `implemented / awaiting review` (whole plan - this path has no per-ticket order). Status line only; `**Pre-existing failures:**` stays if present. **Done when**: a fresh session reading only the plan file knows the work is built and pending review.

Do **not** use this as the default executor for `/to-tickets` output - that is `/implement` (one ticket per session). `/to-spec` already runs council/BPR on the Matt path; this skill runs them on the attached plan - do not also re-prep a spec here.
