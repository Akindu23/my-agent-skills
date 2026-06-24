# HTML Report Format

The architectural review is a single self-contained HTML file plus a co-located `report-init.mjs` in the project workspace. Tailwind and Mermaid load from pinned CDNs (network required on first open). Mermaid handles graph-shaped diagrams reliably; hand-built divs and inline SVG handle editorial visuals (mass diagrams, cross-sections). Mix the two — don't lean on Mermaid for everything.

## Output location

**Default:** write under the **target project's workspace root** (the repo being reviewed).

| Artifact | Directory | Filename pattern |
|----------|-----------|------------------|
| Architecture review HTML | `docs/architecture-reviews/` | `architecture-review-<slug>-<unique>.html` |
| Mermaid init (ESM) | `docs/architecture-reviews/` | `report-init.mjs` (overwritten each run) |

**Rules:**

- Create `docs/architecture-reviews/` lazily (`mkdir -p docs/architecture-reviews`).
- **`<slug>`** — Short filesystem-safe hint from the review focus or top candidate (lowercase, hyphens, ASCII; collapse spaces; trim to ~40 chars). Examples: `order-intake`, `billing-seam`.
- **`<unique>`** — `YYYYMMDD-HHMMSS` in **UTC**, or 6 hex chars if a file was already written in the same second.
- Co-locate **`report-init.mjs`** next to the HTML so `<script type="module" src="./report-init.mjs">` resolves under a local HTTP server.

**Example:**

```text
docs/architecture-reviews/architecture-review-order-intake-20260520-143022.html
docs/architecture-reviews/report-init.mjs
```

**Fallback (only when the user explicitly wants no repo file):** OS temp — state clearly the file is outside the workspace.

**Git:** Do not add `docs/architecture-reviews/` to `.gitignore` by default; teams may commit reviews like handoffs. Document that teams *may* ignore `*.html` if they prefer CI-only artifacts.

## Preview (local HTTP server)

Mermaid ESM fails under `file://`. After writing the report:

1. Start a server **in `docs/architecture-reviews/`**:

```bash
python3 -m http.server 8765 --directory "docs/architecture-reviews"
```

2. Open `http://127.0.0.1:8765/architecture-review-<slug>-<unique>.html` (not `file://`).
3. Reply with the workspace-relative path; add absolute path if helpful.
4. Windows: quote paths with spaces; `start "" "<url>"` if needed.

First load needs network access for Tailwind and Mermaid CDNs.

## Scaffold

Pin CDN versions. Prefer `securityLevel: "strict"` (or omit). External `report-init.mjs` calls `mermaid.initialize({ startOnLoad: false })` then `await mermaid.run()` and surfaces failures visibly.

**`report-init.mjs`** (co-located with the HTML):

```javascript
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.esm.min.mjs";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "strict",
});

document.querySelectorAll("pre.mermaid").forEach((el) => {
  el.classList.add("font-mono", "text-sm");
});

try {
  await mermaid.run({ querySelector: ".mermaid" });
} catch (err) {
  console.error(err);
  document.querySelectorAll("pre.mermaid").forEach((el) => {
    el.classList.add("mermaid-error", "border", "border-red-300", "bg-red-50", "p-3");
    el.setAttribute("title", String(err));
  });
}
```

**HTML head/body shell:**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Architecture review — {{repo name}}</title>
    <script
      src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.4"
      crossorigin="anonymous"
    ></script>
    <script type="module" src="./report-init.mjs"></script>
    <style>
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
      pre.mermaid { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      @media print {
        .before-after { flex-direction: column !important; }
        article { break-inside: avoid; }
      }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

Document SRI hashes in project docs if your team requires Subresource Integrity on CDN scripts; pinning versions is the baseline here.

**Future (out of v1):** pre-rendered SVG, vendored offline bundles, full CSP nonce workflow for hosted reports.

## Header

Repo name, date, and a compact legend: solid box = module, dashed line = seam, red arrow = leakage, thick dark box = deep module. No introduction paragraph — straight into the candidates.

## Candidate card

The diagrams carry the weight. Prose is sparse, plain, and uses the glossary terms ([`/codebase-design`](../codebase-design/SKILL.md)) without ceremony.

Each candidate is one `<article>`:

- **Title** — short, names the deepening (e.g. "Collapse the Order intake pipeline").
- **Badge row** — recommendation strength (`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate), plus dependency category from [DEEPENING.md](../codebase-design/DEEPENING.md) (`in-process`, `local-substitutable`, `ports & adapters`, `mock`).
- **Files** — monospaced list, `font-mono text-sm`.
- **Before / After diagram** — centrepiece. Wrap each diagram in `<figure>` with `<figcaption>` for accessibility. Two columns (`before-after` flex row); see patterns below.
- **Problem** — one sentence. What hurts.
- **Solution** — one sentence. What changes.
- **Wins** — bullets, ≤6 words each. e.g. "Tests hit one interface", "Pricing logic stops leaking", "Delete 4 shallow wrappers".
- **ADR callout** (if applicable) — one line in an amber-tinted box.

No paragraphs of explanation. If the diagram needs a paragraph to be understood, redraw the diagram.

## Diagram patterns

Pick the pattern that fits the candidate. Mix them. Don't make every diagram look the same — variety is part of the point.

### Mermaid graph (the workhorse for dependencies / call flow)

Use a Mermaid `flowchart` or `graph` when the point is "X calls Y calls Z, and look at the mess." Wrap it in a Tailwind-styled card. Style with classDef to colour leakage edges red and the deep module dark. Sequence diagrams work well for "before: 6 round-trips; after: 1."

```html
<figure class="rounded-lg border border-slate-200 bg-white p-4">
  <figcaption class="sr-only">Before: shallow call chain</figcaption>
  <pre class="mermaid">
flowchart LR
  A[OrderHandler] --> B[OrderValidator]
  B --> C[OrderRepo]
  C -.leak.-> D[PricingClient]
  classDef leak stroke:#dc2626,stroke-width:2px;
  class C,D leak
  </pre>
</figure>
```

### Hand-built boxes-and-arrows (when Mermaid's layout fights you)

Modules as `<div>`s with borders and labels. Arrows as inline SVG `<line>` or `<path>` elements positioned absolutely over a relative container. Reach for this when you want the "after" diagram to feel like one thick-bordered deep module with greyed-out internals — Mermaid won't render that with the right weight.

### Cross-section (good for layered shallowness)

Stack horizontal bands (`h-12 border-l-4`) to show layers a call passes through. Before: 6 thin layers each doing nothing. After: 1 thick band labelled with the consolidated responsibility.

### Mass diagram (good for "interface as wide as implementation")

Two rectangles per module — one for interface surface area, one for implementation. Before: interface rectangle is nearly as tall as the implementation rectangle (shallow). After: interface rectangle is short, implementation rectangle is tall (deep).

### Call-graph collapse

Before: a tree of function calls rendered as nested boxes. After: the same tree collapsed into one box, with the now-internal calls shown faded inside it.

## Style guidance

- Lean editorial, not corporate-dashboard. Generous whitespace. Serif optional for headings (`font-serif` works well with stone/slate).
- Colour sparingly: one accent (emerald or indigo) plus red for leakage and amber for warnings.
- Keep diagrams ~320px tall so before/after sits comfortably side by side without scrolling.
- Use `text-xs uppercase tracking-wider` for module labels inside diagrams — they should read as schematic, not as UI.
- Scripts: Tailwind browser CDN, Mermaid via `report-init.mjs`. Otherwise static — no app code beyond diagram rendering.

## Top recommendation section

One larger card. Candidate name, one sentence on why, anchor link to its card. That's it.

## Tone

Plain English, concise — but the architectural nouns and verbs come straight from [`/codebase-design`](../codebase-design/SKILL.md). Concision is not an excuse to drift.

**Use exactly:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**Never substitute:** component, service, unit (for module) · API, signature (for interface) · boundary (for seam) · layer, wrapper (for module, when you mean module).

**Phrasings that fit the style:**

- "Order intake module is shallow — interface nearly matches the implementation."
- "Pricing leaks across the seam."
- "Deepen: one interface, one place to test."
- "Two adapters justify the seam: HTTP in prod, in-memory in tests."

**Wins bullets** name the gain in glossary terms: *"locality: bugs concentrate in one module"*, *"leverage: one interface, N call sites"*, *"interface shrinks; implementation absorbs the wrappers"*. Don't write *"easier to maintain"* or *"cleaner code"* — those terms aren't in the glossary and don't earn their place.

No hedging, no throat-clearing, no "it's worth noting that…". If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it. If a term isn't in [`/codebase-design`](../codebase-design/SKILL.md), reach for one that is before inventing a new one.
