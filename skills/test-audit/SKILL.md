---
name: test-audit
description: Test audit. Use when sweeping existing tests for low-value ones or test-only backdoors in production code.
---

# Test Audit

A focused sweep of existing tests that re-assert source, duplicate stronger proof, couple behavior to implementation, or keep a test-only **backdoor** alive in production code. Optimize for confidence, not deletion count: a few high-confidence candidates beat a large speculative inventory. A test earns its maintenance cost by protecting behavior, a credible regression, or an independently meaningful contract; one that must change for a behavior-preserving refactor is suspect, not automatically deletable.

Read [`references/junk-patterns.md`](references/junk-patterns.md) before step 2: it holds the patterns you hunt and the retention bar every candidate must clear.

## Steps

1. **Scope.** Confirm the area with the user (a package, module, or test folder). Read `GLOSSARY.md` (or legacy `CONTEXT.md`), `CODING_STANDARDS.md`, scoped `AGENTS.md`, and ADRs in that area. Done when the scope is one named area.
2. **Discover.** Discovery is read-only. Hunt the junk patterns across the scope; for a broad scope, split into parallel lanes by top-level area plus one cross-cutting pattern sweep (`/council`). For each candidate, read the complete test and its owner: entry point, callers, callees, sibling implementations, overlapping tests, CI wiring, and `git log` for the test and the code it covers. When the test claims dependency-backed behavior, read the dependency source or types. Done when every candidate has a full evidence record (below) and has been checked against the retention bar, or is dropped.
3. **Report.** Present the candidates with their evidence records, plus the matches you kept under the retention bar and why. Done when the user picks the batch to apply.
4. **Edit one batch.** Apply only the picked batch (see Edit shape). Done when the batch is applied and nothing outside it changed.
5. **Validate.** Run the checks below. Done when every check has run and its result is recorded.
6. **Hand off.** Report using the Handoff list and leave committing to the user.

### Candidate evidence

Record every field before editing. A missing field means the candidate is not ready for deletion:

- exact test name and location;
- what failure it can actually detect;
- non-test callers of the covered production or support code;
- stronger remaining proof at the owning seam, or why no proof is needed;
- relevant history and the reason the test or backdoor exists;
- production or test-support deletion unlocked;
- risk and the focused validation command.

### Edit shape

Pick one batch per owning module. Delete backdoors, test-only globals and wrappers, and dead production paths outright, leaving no aliases behind. Move retained regressions to their owning seam. Consolidate repeated package or dependency assertions into one generic contract.

Prefer net-negative production LOC. Replacement tests assert behavior at the owning seam; an uncertain candidate stays in the report, not in the batch.

### Validation

Keep the test watcher stopped while editing. Use the project's own test and lint commands (`package.json` scripts, `Makefile`, CI config).

1. Run the smallest owner and sibling tests for each touched area.
2. For a removed source grep or plan assertion, run the executable script or dry run that owns the real contract.
3. Run the formatter on changed files, then `git diff --check`.
4. Run the project's full changed-files gate (lint, typecheck, test).
5. Read `git diff --numstat` and report production and tooling LOC separately from test and test-support LOC.

### Handoff

Report:

- root cause and the junk patterns removed;
- production owner simplifications;
- matches kept under the retention bar and why;
- focused and full proof actually run, with results;
- production versus test LOC;
- named follow-up batches for the next sweep.
