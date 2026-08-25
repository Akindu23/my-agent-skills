# Code-review report shape

## Scale

Calibrate every finding onto this scale:

- **P0** — release-blocking: outage, security compromise, irreversible data loss.
- **P1** — severe common-path break: crash, major contract break, feature unusable on the intended path.
- **P2** — everything else (nits, style, ordinary test gaps, speculative hardening).

## Gate

The report **retains P0 and P1**. When the user asks for a wider audit, retain P2 too.

## Placement

- P0/P1 → **Findings** only (even when it is also a slop class).
- Slop class and not a blocker → **Slop** only.
- Neither → drop, unless a wider audit (then Findings as P2).

```markdown
## Verdict
<ship / fix-before-merge / needs discussion>. State the P0 and P1 counts (zero is a count).

## Findings
| Severity | Location | Lens | Finding |
|----------|----------|------|---------|
| P0/P1 | `path:line` | thermos / yagni / bpr / standards / fresh | … |

Sort P0 then P1 (then P2 when retained). Dedupe overlapping items into one row; list every contributing lens.

## Slop
Snapshot of this diff. A later Run `/remove-slop` scans the tree as it is.

| Class | Location | Hit |
|-------|----------|-----|
| narration / over-defense / hatches / nesting / prose | `path:line` | … |

Omit this section when the scan missed every class. Tests are **code** (narration at `*_test.*` is comments).

## Skipped
- Delta BPR: <ran scoped to X | skipped — reason>
- Other: <none | …>

## Notes
<optional: contradictions resolved, intentional breakage accepted, empty sections omitted>
```
