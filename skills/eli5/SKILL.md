---
name: eli5
description: Explain a topic like I'm a 5 year old. Use when the user types /eli5 or asks for a dead-simple picture explainer of how something works.
disable-model-invocation: true
---

# eli5

Explain like I'm someone who knows nothing about this topic: HTML with big pictures and few words.

Write those words per [`../simplify-this/references/ste.md`](../simplify-this/references/ste.md) (SSOT). Keep the pictures big.

Probe the tool list for `AskUserQuestion` (Claude Code) or `AskQuestion` (Cursor).

- `AskUserQuestion` → publish an HTML **artifact** (Artifacts).
- `AskQuestion`, or neither → write `work/eli5/<topic-slug>.html` (create the folder lazily), inline CSS, and open it (`open` / `xdg-open` / `start`).

**Done when:** that surface is showing the explainer, the pictures carry the idea, and every STE rule is applied to the words.
