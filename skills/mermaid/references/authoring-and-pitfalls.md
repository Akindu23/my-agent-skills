# Authoring and pitfalls

Concise practices for agents authoring Mermaid. Full grammar and version quirks live in the official docs: **[mermaid.js.org](https://mermaid.js.org/)**.

## Structure

- **First line** declares the diagram type (for example `flowchart TD`, `sequenceDiagram`, `erDiagram`, `C4Context`). Wrong or missing keywords usually fail the whole block.
- **`%%` comments** document intent, sections, or tricky edges without affecting layout.
- **Naming**: Prefer stable identifiers and readable labels; avoid stuffing prose into node IDs.

## Reliability

- **Silent failures**: Invalid tokens or options often drop parts of the diagram without a loud error in every viewer—sanity-check in the [Live Editor](https://mermaid.live) when behavior looks wrong.
- **Reserved words**: Some diagram types treat certain words as syntax (for example flowcharts and `end` in node text—see notes in [flowchart.md](flowchart.md)).
- **Escaping**: Quotes and special characters are type-specific; when in doubt, check the per-type reference or official syntax page.

## Scope

- **One diagram, one story**: Large canvases are hard to review; split and link in markdown.
- **Version drift**: Integrations (GitHub, CLI, Live Editor) may run different Mermaid versions—stick to widely supported constructs for repo-native diagrams.

## Configuration

- Prefer YAML **frontmatter** `config:` for diagram-local settings (see [mermaid-frontmatter-in-diagrams.md](mermaid-frontmatter-in-diagrams.md) and [config-configuration.md](config-configuration.md)). Legacy `%%{init: ...}%%` directives remain documented under [config-directives.md](config-directives.md).
