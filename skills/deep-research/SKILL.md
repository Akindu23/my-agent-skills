---
name: deep-research
description: >-
  Runs a multi-phase deep dive—defaulting to a product/market lens—and writes a
  navigable multi-page HTML report pack under docs/research/<topic-slug>/.
disable-model-invocation: true
---

# Deep Research

The user invoked `/deep-research`. Product/market lens by default; other topics allowed.

**Leading words:** **`pack`** — `docs/research/<topic-slug>/` (markdown + HTML). **`SSOT`** — markdown authoritative; HTML mirrors. **`gate`** — fixed uncertainty menu + HITL tripwires. **`wave`** — ≤2–3 parallel area Tasks. **`evidenced`** — claim-local `[N]` bound to `SOURCES.md`; weak claims `[uncertain]`; never invent sources.

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session — field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat (topic wording, Retry scope, Drop/demote lists).

Ask **one decision at a time**.

### Uncertainty gate menu (fixed)

When a pre-synthesis or pre-render tripwire fires, present exactly these options (same labels and order every time):

1. **Proceed as-is** — continue; shaky items stay marked in markdown/HTML
2. **Retry** — user names areas (pre-synth) or “re-synthesize” (pre-render); re-run only that scope; **re-evaluate the same gate**
3. **Drop or demote** — user confirms items; edit findings/`gaps.md`; **re-evaluate**
4. **Stop**

Do not invent a fifth option.

## Research pack

```text
docs/research/<topic-slug>/
  plan.md
  findings/<area-slug>.md
  gaps.md
  SOURCES.md
  *.html + assets/   # full tree: references/PACK-HTML.md
```

Pick a short lowercase hyphenated ASCII slug from the topic, or ask when ambiguous. Create directories lazily on first write.

**Resume (v1):** If `plan.md` already has `status: locked`, skip plan lock. Skip findings with `status: complete`. Treat `in_progress` as resume-that-area before starting new waves. If MD is newer than HTML, re-render at the HTML phase.

## Additional resources

| Resource | When to load |
|----------|--------------|
| [references/PACK-SCHEMAS.md](references/PACK-SCHEMAS.md) | Before writing or merging pack artifacts |
| [references/area-prompt.md](references/area-prompt.md) | Before dispatching each area Task |
| [references/synthesis-prompt.md](references/synthesis-prompt.md) | Before the synthesis Task |
| [references/PACK-HTML.md](references/PACK-HTML.md) | Before the HTML render phase |

## Evidenced claims

Claim-local `[N]` bound to `SOURCES.md` / `#src-N`. Mark weak claims `[uncertain]` in place. Never invent sources.

## Task / Agent routing

Probe Task/Agent enums; route per [`../council/references/task-workflow.md`](../council/references/task-workflow.md) (SSOT).

| Role | Skill-local override |
|------|----------------------|
| Area waves | portable role `general-purpose`; write-capable; **foreground**; ≤2–3 parallel; writes findings only |
| Synthesis | Serial; portable role `general-purpose`; write-capable; writes `gaps.md` only (overrides council’s generic synthesis-readonly default); include `[heavy]` in description |

Pass **path pointers** (pack root, `plan.md`, `SOURCES.md`, write path, slug/title) — not inlined file bodies. Load full prompt text from `references/`.

## Process

### 1. Plan lock (HITL)

Propose default area seeds: **landscape**, **competitors**, **academic**, **adjacent**, **gaps**. May propose extras in the same gate. One decision locks seeds + extras + scope + out-of-scope. Write `plan.md` with `status: locked` per [PACK-SCHEMAS.md](references/PACK-SCHEMAS.md).

**Done when:** user confirmed; `plan.md` is `locked` with an Areas checklist of slugs.

### 2. Gather waves (AFK)

Run locked areas in waves of ≤2–3 parallel Tasks. After each wave: merge proposed sources into `SOURCES.md` (verify, dedupe, number); confirm each findings file matches [PACK-SCHEMAS.md](references/PACK-SCHEMAS.md). Mid-gather area ideas go under **Deferred proposals** in `plan.md` — never silent adds, never interrupt the wave.

**Done when:** every locked area is `complete` or `failed`; `SOURCES.md` is current.

### 3. Deferred-areas gate (HITL, conditional)

If Deferred proposals is non-empty, ask whether to add any. On yes, append to Areas, gather those areas (same wave rules), then continue. On no, leave them deferred.

**Done when:** deferred list cleared or explicitly left deferred by the user — or skipped because empty.

### 4. Pre-synthesis uncertainty gate (HITL, conditional)

Fire when any of: any area `status: failed`; any area `confidence: low`; ≥2 areas with `confidence: mixed`. Otherwise skip AFK into synthesis. Use the fixed uncertainty menu; after Retry or Drop/demote, **re-evaluate**.

**Done when:** gate skipped, cleared, or user chose Stop / Proceed.

### 5. Synthesis (AFK)

One serial Task per [references/synthesis-prompt.md](references/synthesis-prompt.md). Writes only `gaps.md`. Claims stay evidenced; list failed/pending areas under Knowledge boundaries.

**Done when:** `gaps.md` has all locked headings per [PACK-SCHEMAS.md](references/PACK-SCHEMAS.md).

### 6. Pre-render uncertainty gate (HITL, conditional)

Fire when any of: any opportunity/gap marked `[uncertain]`; Contradictions & open questions blocks a promoted opportunity; Confidence assessment lists any opportunity as low. Otherwise skip AFK into HTML. Same fixed menu; re-evaluate after Retry / Drop-demote.

**Done when:** gate skipped, cleared, or user chose Stop / Proceed.

### 7. HTML render (AFK)

Render markdown SSOT into the flat pack per [references/PACK-HTML.md](references/PACK-HTML.md). Shared `assets/` shell; `#src-N` cites; diagrams as **static SVG** under `assets/diagrams/` (no client-side Mermaid). Overwrite stable filenames on re-render.

**Done when:** `index.html`, `plan.html`, `area-*.html`, `gaps.html`, `sources.html`, and `assets/pack.css` exist and navigate via relative links; any diagrams are SVG `<img>` embeds (no `pre.mermaid` / Mermaid runtime).

### 8. Hand off (AFK)

Reply with the pack path and preview command. No report-accept gate.

```bash
python3 -m http.server 8765 --directory "docs/research/<topic-slug>"
```

Open `http://127.0.0.1:8765/index.html` (not `file://`).

**Done when:** user has pack path + preview URL/command.
