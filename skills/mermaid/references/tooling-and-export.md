# Tooling and export

Where Mermaid runs and how to produce PNG/SVG/PDF outside the editor.

## Native Markdown hosts

- **GitHub** and **GitLab**: fenced Markdown code blocks tagged `mermaid` render in many views; keep diagrams valid for their renderer versions.
- **Docs sites** (MkDocs, Docusaurus, etc.): usually need a Mermaid plugin or build step—follow that stack’s docs.

## Editors and notebooks

- **VS Code**: Markdown preview extensions often bundle or pair with Mermaid; confirm preview matches your target host.
- **Obsidian, Notion, Confluence** (where enabled): native or plugin Mermaid support varies—test if the diagram is customer-facing.

## Live Editor

- **[mermaid.live](https://mermaid.live)** — paste source, fix errors, export **PNG** / **SVG** / shareable link. Best quick validation path.

## CLI (`mmdc`)

Install the official CLI (package **`@mermaid-js/mermaid-cli`**, command **`mmdc`**):

```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram.mmd -o diagram.png
```

Useful flags (see upstream CLI docs for the full set): `-w` / `-H` width/height, `-b` background (including `transparent`).

## Docker

One-off render without a global npm install (image name may vary by registry; **`minlag/mermaid-cli`** is widely used):

```bash
docker run --rm -v "$PWD":/data minlag/mermaid-cli -i /data/input.mmd -o /data/output.png
```

Mount the directory containing your `.mmd` file and adjust paths accordingly.
