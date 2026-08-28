# Agent checklist

Run **after** writing the SVG and **in addition to** the required validate script. The script cannot see these craft issues.

- [ ] **Layout / spacing** - consistent gaps; content padded inside `viewBox`; no accidental clipping of strokes/markers/labels
- [ ] **Label containment** - text sits inside boxes/lanes with padding; no overlaps of essential labels
- [ ] **Crossings** - edge crossings minimized; arrows do not pass through unrelated nodes
- [ ] **Contrast** - text ≥4.5:1; essential graphics ≥3:1 vs adjacent colors
- [ ] **Dual encoding** - status/category not color-only (label, dash, icon, or shape)
- [ ] **Type rules** - architecture / sequence / freeform notes from [diagram-types.md](diagram-types.md) applied
- [ ] **Earns its keep** - diagram clarifies something prose alone would not; drop decorative noise
