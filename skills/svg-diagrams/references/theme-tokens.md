# Theme tokens

All tokens are **optional**. When the caller supplies none (or a partial map), fill gaps from the chosen `color-scheme` defaults. If `color-scheme` is omitted, use **`light`**.

## Token names

| Token | Role |
|-------|------|
| `--diagram-fg` | Primary text / strokes on background |
| `--diagram-bg` | Canvas / panel fill |
| `--diagram-muted` | Secondary labels, de-emphasized strokes |
| `--diagram-accent` | Primary highlight / key nodes |
| `--diagram-border` | Box edges, dividers (target ≥3:1 vs bg) |
| `--diagram-success` | Success / healthy (always dual-encode) |
| `--diagram-warn` | Warning / caution (always dual-encode) |
| `--diagram-info` | Informational highlight (always dual-encode) |
| `--diagram-danger` | Error / critical (always dual-encode) |

## Defaults (WCAG-minded)

Verified for typical text-on-bg (≥4.5:1) and structural borders (≥3:1 vs bg).

### Light (`color-scheme: light`)

| Token | Hex |
|-------|-----|
| `--diagram-bg` | `#ffffff` |
| `--diagram-fg` | `#161616` |
| `--diagram-muted` | `#525252` |
| `--diagram-accent` | `#0969da` |
| `--diagram-border` | `#8d8d8d` |
| `--diagram-success` | `#198038` |
| `--diagram-warn` | `#9a6700` |
| `--diagram-info` | `#0043ce` |
| `--diagram-danger` | `#da1e28` |

### Dark (`color-scheme: dark`)

| Token | Hex |
|-------|-----|
| `--diagram-bg` | `#161616` |
| `--diagram-fg` | `#f4f4f4` |
| `--diagram-muted` | `#c6c6c6` |
| `--diagram-accent` | `#78a9ff` |
| `--diagram-border` | `#6f6f6f` |
| `--diagram-success` | `#42be65` |
| `--diagram-warn` | `#f1c21b` |
| `--diagram-info` | `#4589ff` |
| `--diagram-danger` | `#fa4d56` |

## Bake vs `var()`

| Embed | Rule |
|-------|------|
| File + `<img>` | Resolve tokens to hex/hsl and **bake** into attributes or an internal `<style>`. Host CSS variables do not cross the image boundary. |
| Inline `<svg>` | Prefer `fill="var(--diagram-accent, #0969da)"` (scheme-appropriate fallback). |

Partial caller overrides: merge onto the scheme defaults, then bake or emit `var()` as above.
