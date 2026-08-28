---
name: improve-codebase-architecture
description: >-
  Architecture review: scan a codebase for deepening opportunities, present
  them as a visual HTML report, then grill through the candidate the user
  picks. Use for architecture review, deepening refactors, testability
  improvements, or `/improve-codebase-architecture`.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** - refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

This command is _informed_ by the project's domain model and built on a shared design vocabulary:

- Run the `/codebase-design` skill for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every suggestion - don't drift into "component," "service," "API," or "boundary."
- The domain language in `CONTEXT.md` gives names to good seams; ADRs in `docs/adr/` record decisions this command should not re-litigate.

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session - field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

Ask **one decision at a time** when this skill already sequences questions that way.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Additional resources

| Resource | When to load |
|----------|----------------|
| [DEEPENING.md](../codebase-design/DEEPENING.md) | Before HTML dependency badges (Step 2) |
| [HTML-REPORT.md](HTML-REPORT.md) | Step 2 scaffold, output path, preview |

## Process

### 1. Explore

**Scope before you scan - YAGNI.** Deepening a module pays off by making future changes to it easier, so put extra weight on the parts of the codebase that have recently changed. Decide *where* to look before you look:

- If the user named a direction (a module, a subsystem, a pain point), take it and skip the inference below.
- Otherwise, walk back a good stretch of the commit history (`git log --oneline`) to find the codebase's hot spots - the files and areas that keep coming up - and let those paths pull your attention first. If the changes are scattered with no clear hot spot, widen the net.

Read the project's domain glossary (`CONTEXT.md`) and any ADRs in the area you're touching first.

- If **`CONTEXT-MAP.md`** exists at the repo root, read it first for where domain docs and ADRs live.
- **ADR index-first:** open **`docs/adr/README.md`**, then read matching ADR files (and context-scoped `src/<context>/docs/adr/` when applicable).

Then walk the codebase using the **Task** tool:

- Probe Task/Agent enums; route per [`../council/references/task-workflow.md`](../council/references/task-workflow.md). Portable role **`explore`**, read-only.
- Launch **multiple Task/Agent calls in one message** when partitions are independent (dirs, concerns, packages).

Don't follow rigid heuristics - explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** - interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates as an HTML report

Write a self-contained HTML file under the **target project's workspace** (the repo being reviewed - not this skills collection repo when the skill runs elsewhere). See [HTML-REPORT.md](HTML-REPORT.md) → **Output location** for naming, co-located `report-init.mjs`, and preview.

**Default path:** `docs/architecture-reviews/architecture-review-<slug>-<unique>.html` (create `docs/architecture-reviews/` lazily).

**Preview:** Mermaid ESM fails under `file://`. After writing, start a local server in that directory (e.g. `python3 -m http.server 8765 --directory "docs/architecture-reviews"`) and open `http://127.0.0.1:8765/architecture-review-<slug>-<unique>.html`. Reply with the **workspace-relative path** plus absolute path if helpful. If open fails (sandbox, SSH, CI), path-only is fine - the user can `@` the file in a follow-up chat.

The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals - use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, render a card (see [HTML-REPORT.md](HTML-REPORT.md)):

- **Files** - which files/modules are involved
- **Problem** - why the current architecture is causing friction
- **Solution** - plain English description of what would change
- **Wins** - explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram** - side-by-side; custom-drawn or Mermaid per [HTML-REPORT.md](HTML-REPORT.md)
- **Recommendation strength** - one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge
- **Dependency badge** - per [DEEPENING.md](../codebase-design/DEEPENING.md): `in-process`, `local-substitutable`, `ports & adapters`, or `mock`

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Use CONTEXT.md vocabulary for the domain, and the `/codebase-design` vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" - not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly in the card (e.g. a warning callout: _"contradicts ADR-0007 - but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, run the `/grilling` skill to walk the design tree with them - constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize - run the `/domain-modeling` skill to keep the domain model current as you go:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md`. Create the file lazily if it doesn't exist.
- **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing - skip ephemeral reasons ("not worth it right now") and self-evident ones. **On acceptance**, follow `/architecture-decision-records` with **`Captured via: improve-codebase-architecture`**.
- **Session is mostly terminology/ADR, not structural deepening?** Optionally hand off to `/grill-with-docs`.
- **Want to explore alternative interfaces for the deepened module?** Run the `/codebase-design` skill and use its design-it-twice parallel sub-agent pattern ([DESIGN-IT-TWICE.md](../codebase-design/DESIGN-IT-TWICE.md)).

**Done when:** the chosen candidate has an agreed interface shape, updated `CONTEXT.md` terms (if any), ADRs offered/recorded for load-bearing rejections, and a concrete next step (e.g. tracer-bullet issue, TDD starting point, or explicit "parked for later"). Stop the grilling loop - do not start implementing unless the user asks.
