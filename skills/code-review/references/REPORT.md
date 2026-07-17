# Code-review report shape

```markdown
## Verdict
<one or two lines: ship / fix-before-merge / needs discussion>

## Findings
| Severity | Location | Lens | Finding |
|----------|----------|------|---------|
| high/medium/low | `path:line` | thermos / yagni / bpr / fresh | … |

Sort highest severity first. Dedupe overlapping items into one row; list every contributing lens.

## Skipped
- Delta BPR: <ran scoped to X | skipped — reason>
- Other: <none | …>

## Notes
<optional: contradictions resolved, intentional breakage accepted, empty sections omitted>
```
