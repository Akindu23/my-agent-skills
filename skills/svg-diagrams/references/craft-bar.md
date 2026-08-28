# Craft bar (static SVG)

Clarity over decoration. Treat SVG as a structured document: fixed coordinate system, accessible name, system fonts, sufficient contrast, dual encoding beyond color. **v1 is static only** - no CSS/SMIL/JS animation.

## Root document

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 800 450"
     role="img"
     aria-labelledby="diagram-title">
  <title id="diagram-title">Short diagram name</title>
  <!-- optional <desc id="diagram-desc">…</desc> + aria-describedby -->
  …
</svg>
```

- Always set `xmlns="http://www.w3.org/2000/svg"` and a padded `viewBox` (≈5-10% margin beyond content).
- Prefer scalable sizing (`viewBox` + host CSS); omit fixed root `width`/`height` unless reserving layout space.
- Use semantic primitives (`rect`, `circle`, `line`, `text`, `g`, `marker`) over hand-authored `path` when possible.
- Plan layout before coordinates: type → flow direction → margins → place nodes.

## Accessible name

Every SVG needs a non-empty child `<title>` (required by validate). `aria-label` / `aria-labelledby` may supplement; they do not replace `<title>`.

| Embed | Extra |
|-------|-------|
| Standalone `.svg` / file for `<img>` | HTML `alt` carries the name in image mode. |
| Inline `<svg>` | `role="img"` + `aria-labelledby` → `<title>` (and `<desc>` when complex). |

Do not rely on SVG `<title>` alone for AT when embedded as `<img>` - also set meaningful `alt` on the `<img>`.

## Typography

System stacks only - no `@font-face`, no font CDN:

| Role | Stack |
|------|-------|
| Labels | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Code / IDs | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

- Color text with `fill`, not CSS `color`.
- SVG text does not wrap by default - use `<tspan>` or shorter labels.
- Center in boxes with `text-anchor="middle"` and `dominant-baseline="middle"`; keep ≥12px equivalent at display size.
- Prefer `text-rendering: geometricPrecision` when the diagram scales.

## Contrast & dual encoding

| Element | Minimum |
|---------|---------|
| Essential strokes / fills / icons | **3:1** vs adjacent color (WCAG 1.4.11) |
| Normal text labels | **4.5:1** vs background (WCAG 1.4.3) |

Never encode meaning with color alone - pair with label, dash pattern, marker, or icon. Use the skill [theme tokens](theme-tokens.md).

## Connectors

- Define arrowheads once in `<defs><marker …></marker></defs>`; attach with `marker-end`.
- Prefer `markerUnits="strokeWidth"` and `orient="auto-start-reverse"`.
- Label non-obvious edges; use two one-way arrows instead of a bidirectional double-head when request/response must be distinct.

## Forbidden (validate script enforces)

- `<!DOCTYPE>` / `<!ENTITY>`; malformed XML; missing root `xmlns` or `viewBox`
- Missing non-empty child `<title>`
- `@font-face` / external font or CDN URLs
- `<script>` or `on*` event-handler attributes
- Animation: SMIL `animate*` / `set`; CSS `@keyframes` / `animation:` in `<style>`

Layout quality, label containment, crossings, and contrast stay on the [agent checklist](agent-checklist.md).
