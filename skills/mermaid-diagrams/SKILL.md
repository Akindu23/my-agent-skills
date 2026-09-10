---
name: mermaid-diagrams
description: >-
  Mermaid. Use for Mermaid source in a markdown fence, or to fix a Mermaid
  parse error.
license: MIT
---

# Mermaid diagrams

Author **plain** Mermaid fences for markdown that renders on GitHub, Obsidian, and VS Code / Cursor preview.

**Lane:** Use `/svg-diagrams` for static `.svg` files and HTML embeds; use this skill for Mermaid source in a fence.

## Craft floor (every fence)

- Quote every label: `A["Checkout"]`. Hosted renderers (GitHub, Obsidian) run a Mermaid 11 that parses bare labels as markdown, so `[1. Step]` fails there with `Unsupported markdown: list`.
- Numbered labels as `"1\. Step"` or `"Step 1"`.
- Reserved word `end` is written `End` as a node id or label.
- One idea per node; a long label becomes two nodes. `<br/>` in plain labels renders inconsistently.
- Subgraphs declared `subgraph id["Title"]`; edges reference `id`, never the title.
- Direction on line one: `flowchart LR` for flow, `TD` for hierarchy.
- Fifteen nodes is the ceiling; past it, split into two fences.

## Defaults

- Plain fence: no `classDef`, `style`, `linkStyle`, or config until the caller asks.
- The fence sits directly under the sentence it supports.
- Five types: flowchart, sequence, state, class, ER. Others render unreliably on hosted markdown.

## Workflow

1. **Pick** the type and direction from [types](references/types.md) and read that type's section.

   **Done when:** type and direction are named and the type's starter and gotchas are in context.

2. **Write** the fence.

   **Done when:** every label is quoted, every subgraph has an id, every edge names a declared id, the node count is under the ceiling, and the fence sits under its sentence.

3. **Style** only when the caller asks - [styling](references/styling.md).

   **Done when:** styling matches the request, or none was requested.

4. **Fix** a pasted parse error: map the error to the craft-floor rule it violates and rewrite.

   **Done when:** the rewritten fence passes step 2.
