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
    pack-init.mjs           # only if any page has Mermaid
```

Stable filenames; overwrite on re-render. HTML mirrors SSOT sections only — no inventing content absent from markdown.

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
  <!-- only when this page has Mermaid: -->
  <script type="module" src="./assets/pack-init.mjs"></script>
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

## Optional Mermaid

Include only when a diagram earns its keep (not mandatory).

```html
<figure class="diagram">
  <figcaption class="sr-only">…</figcaption>
  <pre class="mermaid">flowchart LR …</pre>
</figure>
```

### `assets/pack-init.mjs`

Pin Mermaid **≥11.10.0** (CVE-2025-54881). Example:

```javascript
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.10.0/dist/mermaid.esm.min.mjs";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "strict",
});

try {
  await mermaid.run({ querySelector: ".mermaid" });
} catch (err) {
  console.error(err);
  document.querySelectorAll("pre.mermaid").forEach((el) => {
    el.classList.add("mermaid-error");
    el.setAttribute("title", String(err));
  });
}
```

Load `pack-init.mjs` only on pages that contain `.mermaid` blocks.

## Anti-patterns

- `file://` preview when using ESM/CDN
- Per-page duplicated shell / inline-only CSS with no shared `assets/pack.css`
- Monolithic single-file report
- Timestamped HTML filenames
- Inventing HTML-only claims not present in markdown
- Scattering `id="src-N"` on multiple pages (registry only on `sources.html`)
