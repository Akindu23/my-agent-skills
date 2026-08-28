---
name: svg-diagrams
description: >-
  Authors static SVG (architecture, sequence, freeform) and HTML embed snippets.
  Use for standalone SVG visuals and HTML packs/lessons that need diagrams as
  `.svg` / `<img>` / inline SVG. Not for Mermaid source or markdown-fenced
  Mermaid diagrams.
license: MIT
---

# SVG diagrams

Author **static** SVG diagrams (no animation in v1) for architecture, sequence, and freeform visuals, plus HTML embed snippets when needed.

**Lane:** Use the Mermaid skill for Mermaid source / markdown-native diagrams; use this skill for static SVG files and HTML embeds.

## Workflow

1. **Infer** diagram type (`architecture` | `sequence` | `freeform`), embed mode (`img` default | `inline`), `color-scheme` (`light` default | `dark`), and any caller theme tokens.

   **Done when:** type, embed mode, and color-scheme are named (tokens noted if the caller supplied any).

2. **Read references** for this run only:
   - Always [craft bar](references/craft-bar.md)
   - Diagram type → [diagram types](references/diagram-types.md)
   - HTML embed / caller preset → [embed](references/embed.md)
   - Colors or `color-scheme` → [theme tokens](references/theme-tokens.md)

3. **Write** a self-contained static `.svg` (semantic shapes, system fonts, baked or `var()` colors per embed mode).

4. **Checklist** - run [agent checklist](references/agent-checklist.md) (layout, labels, crossings, contrast/dual-encoding, type rules, earns-its-keep).

   **Done when:** every checklist item is checked (or explicitly N/A with reason).

5. **Validate (required)** before shipping. Locate this skill’s directory (the folder that contains this `SKILL.md`), then:

   ```bash
   python3 scripts/validate.py path/to/diagram.svg
   ```

   Non-zero exit → fix and re-run. Do not ship on failure.

   **Done when:** the command prints `OK:` and exits 0.

6. **Embed snippet** if the caller needs HTML - [embed](references/embed.md) (`deep-research`, `teach`, `standalone`).

   **Done when:** snippet matches the caller preset and embed mode from step 1, or no HTML was requested.
