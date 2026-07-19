# Synthesis Task prompt template

Parent fills placeholders, then dispatches **one serial** Task after gather (and after any pre-synthesis gate). The Task writes **only** `gaps.md`. It does **not** edit findings, `SOURCES.md`, or HTML.

## Dispatch parameters

- `subagent_type: generalPurpose`
- `readonly: false` (writes `gaps.md`)
- Foreground; serial (not parallel with other writers)
- Model: Grok lane when available, else Composer — probe enum per [`../../council/references/cursor-task-workflow.md`](../../council/references/cursor-task-workflow.md); do not hard-code stale slugs
- Description token: include `[heavy]` so routing stays on the Grok lane when present

## Prompt body (fill and send)

~~~~
You are synthesizing cross-area findings for a deep-research pack.

## Goal
Write a gaps/opportunities synthesis to the path given. Keep claims evidenced (claim-local [N] already in SOURCES.md; [uncertain] when thin; never invent). No follow-up web search (parent owns Retry).

## Paths (read from disk)
- Pack root: {{pack_root}}
- Plan: {{pack_root}}/plan.md
- Sources registry: {{pack_root}}/SOURCES.md
- Findings to include (status complete — include low/mixed):
{{findings_paths}}
- Write path: {{pack_root}}/gaps.md
- Failed or pending areas (list under Knowledge boundaries; do not synthesize as if complete):
{{failed_or_pending}}

## Output file
Write gaps.md with these headings in order (no YAML frontmatter required):
1. Executive synthesis
2. Cross-area map
3. Evidence-backed gaps
4. Opportunity hypotheses
5. Contradictions & open questions
6. Knowledge boundaries
7. Confidence assessment

## Hard rules
- Keep claims evidenced; every opportunity hypothesis needs ≥1 cite.
- Fill every locked heading. If a section has nothing solid, say so briefly — do not pad with speculation.
- Under Knowledge boundaries, name failed/pending areas and any coverage holes.
- Under Confidence assessment, call out any opportunity that is low-confidence or blocked by a contradiction.
- Do not edit findings/*.md, SOURCES.md, plan.md, or HTML files.
- Do not invoke Exa plugin slash skills. No web expansion in this Task.

## Return contract
Return: (a) write path, (b) whether any opportunities/gaps are marked [uncertain] or low-confidence, (c) blockers if any.
~~~~

## Parent after synthesis

Re-evaluate the pre-render gate per the skill (tripwires + fixed menu live only there).
