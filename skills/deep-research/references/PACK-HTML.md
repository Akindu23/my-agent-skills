# Pack HTML

Render the markdown SSOT into a flat multi-page HTML pack. Shared shell (nav + assets) is required. Do **not** use a docs-site toolchain (MkDocs/VitePress/etc.). Do **not** emit a single monolithic HTML file.

## Pack layout

```text
docs/research/<topic-slug>/
  plan.md, findings/<slug>.md, gaps.md, SOURCES.md   # SSOT (already written)
  index.html
  plan.html
  area-<slug>.html          # one per area in plan.md
  gaps.html
  sources.html
  assets/
    pack.css                # shared nav + typography + print
    diagrams/               # static SVG only (when diagrams earn their keep)
      <diagram-slug>.svg
```

Stable filenames; overwrite on re-render. HTML mirrors SSOT sections only — no inventing content absent from markdown (diagrams may visualize relationships already stated in the SSOT).

## Page roles

| Page | Source | Role |
|------|--------|------|
| `index.html` | derived | Hub: topic, short executive summary, nav, teaser of key opportunities from `gaps.md` |
| `plan.html` | `plan.md` | Research plan / areas checklist with links to `area-*.html` |
| `area-<slug>.html` | `findings/<slug>.md` | Per-area findings + inline cites + Sources used |
| `gaps.html` | `gaps.md` | Cross-area synthesis |
| `sources.html` | `SOURCES.md` | Global registry; each entry `id="src-N"` |

## Shared shell

Every page:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{topic}} — {{page}}</title>
  <link rel="stylesheet" href="./assets/pack.css" />
</head>
<body>
  <nav class="pack-nav" aria-label="Report">
    <a href="./index.html">Overview</a>
    <a href="./plan.html">Plan</a>
    <!-- one link per area -->
    <a href="./area-{{slug}}.html">{{title}}</a>
    <a href="./gaps.html">Gaps</a>
    <a href="./sources.html">Sources</a>
  </nav>
  <main>…</main>
</body>
</html>
```

Mark the current page link with `aria-current="page"`. Relative links only (`./…`).

### `assets/pack.css` (minimum)

- Consistent nav + max-width content column
- System UI font stack is fine (utilitarian pack)
- `.uncertain` styling for `[uncertain]` claims
- `figure.diagram img` — full-width, readable on mobile
- `@media print` — hide `.pack-nav`; avoid breaks inside articles

Shared CSS in `assets/` is required for this multi-page pack (do not put per-page-only styles and skip `pack.css`).

## Citations

| Location | HTML shape |
|----------|------------|
| Inline claim | `<sup><a class="cite" href="./sources.html#src-12">[12]</a></sup>` |
| Registry row | `<article id="src-12" class="source-entry">…</article>` (or `<li id="src-12">`) |
| Sources used footer | links to `./sources.html#src-N` for ids on that page |
| Uncertain | keep `[uncertain]` text or wrap with `<span class="uncertain">` |

From body pages always use `./sources.html#src-N` (flat pack — not `../sources.html`).

## Diagrams (static SVG — preferred)

Include a diagram only when it earns its keep (not mandatory). When you do, follow `/svg-diagrams` (`deep-research` preset): craft, checklist, and `scripts/validate.py` before shipping.

1. Write a self-contained SVG under `assets/diagrams/<diagram-slug>.svg`.
2. Embed it in HTML as an image (no runtime JS):

```html
<figure class="diagram">
  <figcaption class="sr-only">…</figcaption>
  <img src="./assets/diagrams/{{diagram-slug}}.svg" alt="…" loading="lazy" />
</figure>
```

### SVG rules

- Inline-safe: no external fonts/CDN; use `system-ui, sans-serif` (or omit font-family and inherit).
- Include `<title>` (and `role="img"` + `aria-labelledby` when helpful).
- Prefer simple flow/box diagrams; match pack colors via CSS variables only if inlined — for `<img>` SVGs, hard-code a small palette consistent with `pack.css`.
- Stable filenames; overwrite on re-render.

### Authoring from markdown

- Findings/`gaps.md` may sketch structure in prose, a list, or a fenced ` ```mermaid ` block as an **authoring draft**.
- At HTML render, **do not** ship `pre.mermaid`, Mermaid CDN/ESM, or `pack-init.mjs`. Convert any diagram worth keeping into `assets/diagrams/*.svg` and embed with `<img>`.
- If a Mermaid draft is too costly to convert and the diagram is not essential, drop it and keep the prose.

### Why not client-side Mermaid

Preview environments (Cursor Simple Browser, restricted webviews, `file://`, blocked CDN) often leave raw Mermaid source on screen. HTML escaping of `-->` and label `:` characters also breaks parse. Static SVG avoids all of that.

## Anti-patterns

- Client-side Mermaid (`pre.mermaid`, CDN/ESM `pack-init.mjs`, vendored `mermaid.min.js` for runtime render)
- `file://` as the primary preview path when anything still expects a server (prefer `python3 -m http.server` for the pack root)
- Per-page duplicated shell / inline-only CSS with no shared `assets/pack.css`
- Monolithic single-file report
- Timestamped HTML filenames
- Inventing HTML-only claims not present in markdown
- Scattering `id="src-N"` on multiple pages (registry only on `sources.html`)
