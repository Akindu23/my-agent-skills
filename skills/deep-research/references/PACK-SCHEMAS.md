# Pack artifact schemas

Markdown + YAML frontmatter only. No sidecar JSON. Load before writing or merging pack artifacts.

## `plan.md`

**Frontmatter:** `topic`, `slug`, `status: draft|locked`, `updated`

**Headings:** Goal · Scope · Areas (checklist with slugs) · Deferred proposals · Out of scope

## `findings/<area-slug>.md`

**Frontmatter:** `slug`, `title`, `status: pending|in_progress|complete|failed`, `confidence: high|mixed|low`, `updated`

**Headings:** Summary · Findings · Contradictions & open questions · Knowledge boundaries · Uncertain claims · Sources used

## `gaps.md`

**Headings:** Executive synthesis · Cross-area map · Evidence-backed gaps · Opportunity hypotheses · Contradictions & open questions · Knowledge boundaries · Confidence assessment

## `SOURCES.md`

Append-only numbered registry — `[N]. Title — URL` + one-line “supports …”; optional `as_of`, `type` (primary/secondary), `areas: […]`.

Parent owns all appends (dedupe URLs to one `[N]`, merge `areas`). Area Tasks propose entries; parent verifies (fetch) before assigning numbers.
