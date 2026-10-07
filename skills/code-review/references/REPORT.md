# Code-review report shape

## Scale

Calibrate every finding onto this scale:

- **P0** - release-blocking: outage, security compromise, irreversible data loss.
- **P1** - severe common-path break: crash, major contract break, feature unusable on the intended path.
- **P2** - everything else (nits, style, ordinary test gaps, speculative hardening).

## Filter

Test every specialist finding before calibrating it. A finding that fails goes to **Dismissed**:

- **Nitpick gravity** - a lens with nothing serious pads its output with nits. Calibrate those as P2; a lens of only nits is reporting a clean diff.
- **Actual path** - trace the call site. A "what if X" stands only when a caller in this repo can deliver X.
- **Preference** - "I'd do it differently" stands only with a concrete defect in the current approach.

Dismiss a security or correctness finding only after the trace refutes it.

## Gate

The report **retains P0 and P1**. When the user asks for a wider audit, retain P2 too.

## Placement

- Failed the filter → **Dismissed** only.
- Named `**Pre-existing failures:**` paths stay off Findings, even as P0/P1.
- P0/P1 → **Findings** only (even when it is also a slop class).
- Slop class and not a blocker → **Slop** only (even when `thermos-quality` also flagged it).
- `thermos-quality` finding and not a blocker → **Structure** only.
- Neither → drop, unless a wider audit (then Findings as P2).

[`../scripts/render_review.py`](../scripts/render_review.py) parses this shape into the HTML view: keep the headings, column names, and `path:line` locations exactly as written.

```markdown
<One paragraph: scope, work items, standards file or its omission, baseline typecheck and test results.>

## Verdict
**<ship / fix-before-merge / needs discussion>.** P0: <n>. P1: <n>.

## Findings
| Severity | Location | Lens | Finding | Fix |
|----------|----------|------|---------|-----|
| P0/P1 | `path:line` | thermos-deep / thermos-quality / yagni / bpr / standards / fresh | what breaks and why | the change that fixes it |

Sort P0 then P1 (then P2 when retained). Dedupe overlapping items into one row; list every contributing lens.

## Slop
Snapshot of this diff. A later Run `/remove-slop` scans the tree as it is.

| Class | Location | Hit |
|-------|----------|-----|
| narration / over-defense / hatches / nesting / prose | `path:line` | … |

Omit this section when the scan missed every class. Tests are **code** (narration at `*_test.*` is comments).

## Structure
Non-blocking `thermos-quality` findings, in that rubric's priority order. Omit when it returned none.

| Location | Finding | Remedy |
|----------|---------|--------|
| `path:line` | … | … |

## Dismissed
Findings the filter rejected, so the user can override. Below-gate P2s are not listed. Omit when none.

| Location | Lens | Finding | Why dismissed |
|----------|------|---------|---------------|
| `path:line` | … | … | nitpick / no caller delivers X / preference … |

## Skipped
- Delta BPR: <ran scoped to X | skipped - reason>
- Other: <none | …>

## Notes
<optional: contradictions resolved, intentional breakage accepted, empty sections omitted>
```
