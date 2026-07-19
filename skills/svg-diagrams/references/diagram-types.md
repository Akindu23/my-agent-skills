# Diagram types

Infer one primary type, then apply the matching layout notes.

## Architecture (box-and-arrow)

- Layer: context → container → component. Do not overload one canvas with every subsystem and runtime path.
- Prefer left→right for process/value flow; top→bottom for hierarchies.
- Align to a grid: consistent box sizes unless hierarchy needs emphasis; even spacing; group related nodes in bordered `<g>` regions.
- Minimize edge crossings; route orthogonal connectors when needed.
- Label nodes, groups, and non-obvious edges. Add a compact legend when line styles encode meaning (solid = sync, dashed = async).

## Sequence

- Lifelines left→right; initiator leftmost. Time flows top→bottom; preserve message order.
- Minimize lifeline crossings and very long horizontals — reorder participants when it shortens arrows.
- Place human actors left; keep role positions consistent across related diagrams.
- Truncate or wrap long message labels at lifeline boundaries (`<tspan>`).
- Skip object-destruction markup unless it communicates something important.

## Freeform

- One primary subject, secondary annotations, tertiary decoration only if it clarifies.
- Group with proximity, similarity, and enclosed regions (Gestalt).
- DOM paint order is z-order — later siblings paint on top; no `z-index` in SVG.
- Reuse parts via `<defs>` + `<use>`; give named clones their own `<title>` when needed.
