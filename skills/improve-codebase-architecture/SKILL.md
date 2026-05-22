---
name: improve-codebase-architecture
description: >-
  Find deepening opportunities in a codebase, informed by CONTEXT.md and docs/adr/.
  Use for architecture review, refactoring opportunities, consolidation, testability,
  AI-navigability, or when the user says "deepening", "architecture review", or
  invokes /improve-codebase-architecture.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [LANGUAGE.md](LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [LANGUAGE.md](LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

This skill is _informed_ by the project's domain model. The domain language gives names to good seams; ADRs record decisions the skill should not re-litigate.

## Additional resources

| Resource | When to load |
|----------|----------------|
| [DEEPENING.md](DEEPENING.md) | Before HTML dependency badges (Step 2) |
| [HTML-REPORT.md](HTML-REPORT.md) | Step 2 scaffold, output path, preview |
| [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md) | User wants alternative interfaces |
| [LANGUAGE.md](LANGUAGE.md) | Full glossary and phrasing rules |

## Process

### 1. Explore

Read the project's domain glossary and any ADRs in the area you're touching first.

- If **`CONTEXT-MAP.md`** exists at the repo root, read it first for where domain docs and ADRs live.
- Scan **`docs/adr/`** for decisions that apply to the area under review.

Then walk the codebase using the **Task** tool:

- **`subagent_type: explore`**, **`readonly: true`**; probe Task `model` enum and set Composer slug per [`references/cursor-task-workflow.md`](references/cursor-task-workflow.md).
- Launch **multiple Tasks in one message** when partitions are independent (dirs, concerns, packages).
- Optional workflow detail: [`references/cursor-task-workflow.md`](references/cursor-task-workflow.md).

Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates as an HTML report

Write a self-contained HTML file under the **target project's workspace** (the repo being reviewed — not this skills collection repo when the skill runs elsewhere). See [HTML-REPORT.md](HTML-REPORT.md) → **Output location** for naming, co-located `report-init.mjs`, and preview.

**Default path:** `docs/architecture-reviews/architecture-review-<slug>-<unique>.html` (create `docs/architecture-reviews/` lazily).

**Preview:** Mermaid ESM fails under `file://`. After writing, start a local server in that directory (e.g. `python3 -m http.server 8765 --directory "docs/architecture-reviews"`) and open `http://127.0.0.1:8765/architecture-review-<slug>-<unique>.html`. Reply with the **workspace-relative path** plus absolute path if helpful. If open fails (sandbox, SSH, CI), path-only is fine — the user can `@` the file in a follow-up chat.

The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals — use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, render as a card (see [HTML-REPORT.md](HTML-REPORT.md)):

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Wins** — explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram** — side-by-side; custom-drawn or Mermaid per [HTML-REPORT.md](HTML-REPORT.md)
- **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge
- **Dependency badge** — per [DEEPENING.md](DEEPENING.md): `in-process`, `local-substitutable`, `ports & adapters`, or `mock`

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Use CONTEXT.md vocabulary for the domain, and [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly in the card (e.g. a warning callout: _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

**One question at a time.** Challenge terms against `CONTEXT.md`.

#### User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time**.

If **`AskQuestion`** is unavailable, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** when the answer is inherently free-form.

Side effects happen inline as decisions crystallize:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md` — same discipline as `/grill-with-docs` (see [references/CONTEXT-FORMAT.md](references/CONTEXT-FORMAT.md)). Create the file lazily if it doesn't exist.
- **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR only when [references/ADR-FORMAT.md](references/ADR-FORMAT.md) **When to offer an ADR** criteria are met **and** a future explorer would otherwise re-suggest the same refactor. Frame as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Skip ephemeral reasons ("not worth it right now") and self-evident ones.
- **Session is mostly terminology/ADR, not structural deepening?** Optionally hand off to `/grill-with-docs`.
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).
