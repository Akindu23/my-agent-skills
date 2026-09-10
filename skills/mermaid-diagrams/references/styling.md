# Styling (opt-in)

Reached only when the caller asks for colour, emphasis, or a theme.

## Highlight a class of nodes or edges

`classDef` plus `class` is the portable path; it renders on GitHub and Obsidian.

```mermaid
flowchart LR
  classDef leak stroke:#b91c1c,stroke-width:2px
  classDef deep fill:#1f2937,color:#f9fafb
  ui["UI"] --> core["Core"]
  ui --> db["DB"]
  class core deep
  class db leak
```

`:::leak` inline on a node (`db["DB"]:::leak`) is the same binding in one line.

## Theme

YAML frontmatter is the Mermaid 11 form:

```mermaid
---
config:
  theme: neutral
---
flowchart LR
  a["A"] --> b["B"]
```

GitHub's bundled Mermaid lags; when the frontmatter form is ignored there, the init directive still works:

```mermaid
%%{init: {"theme": "neutral"}}%%
flowchart LR
  a["A"] --> b["B"]
```
