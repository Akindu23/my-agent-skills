---
name: implement
description: "Implement one ticket from a spec or tickets, following karpathy-guidelines and yagni."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets, following `/karpathy-guidelines` and `/yagni`.

Prefer **one ticket per session**; clear context between tickets.

Use `/tdd` at pre-agreed seams; YAGNI cuts the production code, not the red test.

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session - field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

**Baseline.** Locate the ticket's **edit targets** (the files this slice will change), then, before any change, run the full typecheck plus the baseline test scope on the untouched tree. Test scope is the first rung that resolves:

1. Runner-related tests for the edit targets (`jest --findRelatedTests` / `vitest related`).
2. The owning package's test script (`pnpm --filter <pkg> test`).
3. Test files colocated with the edit targets (same dir, `__tests__/`, `<basename>.test.*`).
4. Edit targets not locatable: the full suite.

Record the command on the ticket as `Baseline: <command>`. Green: start the ticket. Red: diagnose in one short block (which tests, which files, inside or outside the edit targets), then one structured MCQ. Put the overlap fact in the question. Typecheck errors classify by the paths they name, same inside/outside split. Omit **Proceed** when any failure is inside the edit targets.

- **Fix first** - repair the baseline, run `/commit-msg` on that repair only, then re-run verify. Ticket work starts only when that re-run is green.
- **Proceed** - write `**Pre-existing failures:**` on the ticket (each failing path + one-liner). The end suite may still fail those paths: leave them.
- **Abort** - stop this run. Next hop: `/to-tickets` for the repair.

Mechanical (missing install, stale generated file, cache): fix, say so, re-run verify. File changes from that fix go through `/commit-msg` before ticket work, same gate as Fix first.

**Done when**: verify is green, or Proceed was accepted and `**Pre-existing failures:**` is on the ticket.

Run typechecking regularly, single test files regularly, and the full test suite once at the end. An end-suite failure outside the `Baseline:` scope: check that test on a clean checkout (stash or worktree). Reproduces → append it to `**Pre-existing failures:**` (path + one-liner) and leave it. Does not → fix before close. **Done when**: the end suite is green except named `**Pre-existing failures:**`.

Ticket work stays uncommitted. Baseline **Fix first** and mechanical file changes are the only commits, through `/commit-msg`. After the slice is done, run `/code-review` in a fresh turn (or ask for it explicitly).

Close the ticket **on disk**: in the tickets/plan file the work came from, mark this ticket's status (implemented / awaiting review) and name the next ticket in order. Status line only; `**Pre-existing failures:**` stays if present. **Done when**: a fresh session reading only that file can answer "what's next?".

For a whole attached plan with council / best-practices / YAGNI, use /implement-plan instead.
