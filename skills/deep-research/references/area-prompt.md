# Area Task / Agent prompt template

Parent fills placeholders, then dispatches one Task or Agent per research area. The worker writes **only** `findings/<slug>.md`. It does **not** append `SOURCES.md`.

## Dispatch parameters

Probe Task/Agent enums; route per [`../../council/references/task-workflow.md`](../../council/references/task-workflow.md).

- Portable role: `general-purpose`
- Write-capable (required for MCP/web + file write)
- Foreground (`run_in_background` unset/false)
- Parallelism: ≤2–3 area workers in one parent message

## Prompt body (fill and send)

Use a fenced block when pasting into the Task/Agent `prompt`. Avoid nested fences inside the prompt text — describe frontmatter as a bullet list.

~~~~
You are researching one area of a deep-research pack.

## Goal
Investigate the area below for topic "{{topic}}". Write findings only to the path given. Keep claims evidenced. Propose new sources to the parent; do not edit SOURCES.md yourself.

## Identity
- Area slug: {{slug}}
- Area title: {{title}}
- Pack root: {{pack_root}}
- Plan path: {{pack_root}}/plan.md
- Sources registry path: {{pack_root}}/SOURCES.md (read-only for you; propose additions)
- Write path: {{pack_root}}/findings/{{slug}}.md

Read plan.md and SOURCES.md from disk as needed. Do not expect file bodies inlined in this prompt.

## Search (Exa-first, per-call fallback)
1. Probe Exa MCP: GetMcpTools for server `plugin-exa-exa`. Use Exa only when serverStatus is "ready".
2. Discover with `web_search_exa` via CallMcpTool when ready; otherwise built-in WebSearch.
3. Verify before citing: `web_fetch_exa` (batch urls) when ready; otherwise WebFetch (one URL per call). Retry fetch once, then mark the claim `[uncertain]` or omit the source.
4. On missing tools, auth errors, 429/rate limits, timeout/5xx, or repeated MCP failures: fall back to built-in WebSearch/WebFetch for **that call only**.
5. Do **not** invoke Exa plugin slash skills (`exa-web-search`, `exa-fetch`, etc.) — they forbid built-in fallback.
6. Today's date: {{today}} — prefer recent sources.
7. If tools are completely unusable: write the findings file with `status: failed`, explain under Knowledge boundaries, and stop. Never invent sources or fill headings from memory.

## Output file
Write {{pack_root}}/findings/{{slug}}.md with YAML frontmatter fields:
- slug: {{slug}}
- title: {{title}}
- status: complete (or failed)
- confidence: high (or mixed | low)
- updated: {{today}}

Required headings (in order): Summary; Findings; Contradictions & open questions; Knowledge boundaries; Uncertain claims; Sources used.

Rules:
- Keep claims evidenced (claim-local [N]; [uncertain] when weak/single-source — also list under Uncertain claims).
- Sources used footer: list the [N] ids you cited (titles optional).
- failed ≠ complete+low: use failed only when the file is unusable (tools broken, zero credible sources, blocked).
- Never edit files other than your write path.

## Confidence rubric
- high — thin Uncertain claims section; key claims have solid cites
- mixed — material uncertain claims or single-source key claims
- low — mostly uncertain / thin evidence (file still written)
- failed — unusable output (see above)

## Sources to propose (for parent)
At the end of your Task result (chat return, not SOURCES.md), list proposed new sources:

PROPOSED_SOURCES:
- title: ...
  url: ...
  supports: ...
  type: primary|secondary

Only include URLs you verified with fetch. Parent assigns [N], dedupes, and appends SOURCES.md.

## Return contract
Return: (a) write path, (b) final status + confidence, (c) PROPOSED_SOURCES list, (d) blockers if any.
~~~~

## Parent merge after each wave

1. Collect `PROPOSED_SOURCES` from each finished area Task.
2. Fetch-verify any entry you have not already verified; drop unverified URLs (or ask Retry later).
3. Dedupe by URL against existing `SOURCES.md`; reuse `[N]` and merge `areas: […]`.
4. Append new entries with the next free numbers.
5. If an area cited provisional ids, rewrite its findings cites to final `[N]` before synthesis.
