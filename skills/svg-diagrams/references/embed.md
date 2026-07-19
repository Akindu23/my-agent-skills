# Embed contract

## Decision

**Default:** write a `.svg` file and embed with `<img>` unless an inline trigger fires.

**Inline when** (any one):

- Host must style internals at runtime (`:hover` / `:focus`, CSS classes)
- Click targets, quiz/JS highlighting, or other host script access
- Live `var(--*)` theming without regenerating the file

| Mode | Theming | Accessible name in HTML |
|------|---------|-------------------------|
| `<img>` | Bake resolved hex/hsl into the SVG | `alt` on `<img>` (+ optional `role="img"`) |
| Inline `<svg>` | `var(--diagram-*, fallback)` | `role="img"` + `aria-labelledby` → `<title>` |

Host CSS cannot style internals of an `<img>` SVG. External stylesheets linked from the SVG do not apply in image context.

## Caller presets

### `deep-research`

Path: `assets/diagrams/<diagram-slug>.svg` (stable names; overwrite on re-render).

```html
<figure class="diagram">
  <img src="./assets/diagrams/<diagram-slug>.svg"
       alt="…" role="img" loading="lazy" />
</figure>
```

Bake palette at write time. Relative `./` paths only. No runtime Mermaid/CDN for diagrams — see `skills/deep-research/references/PACK-HTML.md`.

### `teach`

Default: same file + `<img>` pattern (lesson-relative path often `../assets/diagrams/<slug>.svg`).

Switch to **inline** only when an inline trigger applies:

```html
<svg class="diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"
     role="img" aria-labelledby="d-title">
  <title id="d-title">…</title>
  <!-- shapes; fills/strokes use var(--diagram-*, fallback) -->
</svg>
```

Use stable, slug-prefixed IDs when the lesson will hook elements.

### `standalone`

- With HTML: file + `<img>` (or inline if a trigger applies).
- Without HTML: ship the bare `.svg`.

## Responsive / print (host CSS)

```css
figure.diagram img,
svg.diagram {
  display: block;
  max-width: 100%;
  width: 100%;
  height: auto;
}
@media print {
  figure.diagram { break-inside: avoid; }
}
```

Default `preserveAspectRatio` (`xMidYMid meet`) is usually correct.
