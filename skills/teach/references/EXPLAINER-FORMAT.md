# HTML Explainer Format

HTML explainers are self-contained lessons saved inside a topic workspace. Use them for knowledge delivery, worked examples, retrieval practice, and lightweight in-browser exercises.

## Output Location

| Artifact | Directory | Filename pattern |
|----------|-----------|------------------|
| HTML explainer | `docs/learning/<topic-slug>/explainers/` | `<lesson-slug>-<unique>.html` |

**Rules:**

- Create `docs/learning/<topic-slug>/explainers/` lazily (`mkdir -p "docs/learning/<topic-slug>/explainers"`).
- `<lesson-slug>` is a short filesystem-safe hint from the lesson focus: lowercase, hyphens, ASCII, collapsed spaces, trimmed to about 40 characters.
- `<unique>` is `YYYYMMDD-HHMMSS` in UTC, or 6 hex chars if a file was already written in the same second.
- Do not create a `scripts/` directory or sidecar JavaScript file. Each explainer is one HTML file.

Example:

```text
docs/learning/typescript-generics/explainers/generic-constraints-20260531-081500.html
```

## Preview

Syntax highlighting works when the file is opened directly with `file://`, but Tailwind's browser CDN is more consistent from a local origin. After writing an explainer, offer this preview command:

```bash
python3 -m http.server 8765 --directory "docs/learning/<topic-slug>/explainers"
```

Then open:

```text
http://127.0.0.1:8765/<lesson-slug>-<unique>.html
```

First load requires network access for Tailwind and highlight.js CDNs.

## Scaffold

Use Tailwind browser CDN plus highlight.js pinned to `11.11.1` via cdnjs. The `github-dark` theme stylesheet is mandatory; without a theme, highlighted code can render monochrome.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{Lesson title}}</title>
    <script
      src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.4"
      crossorigin="anonymous"
    ></script>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css"
    />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", () => hljs.highlightAll());
    </script>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased">
    <main class="mx-auto max-w-4xl px-6 py-12 space-y-10">
      <header class="space-y-3">
        <p class="text-sm uppercase tracking-[0.2em] text-cyan-300">{{Topic}}</p>
        <h1 class="text-4xl font-semibold tracking-tight">{{Lesson title}}</h1>
        <p class="text-lg text-slate-300">{{Mission-linked promise of the lesson}}</p>
      </header>

      <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <h2 class="text-2xl font-semibold">{{Concept}}</h2>
        <p class="text-slate-300">{{Explanation grounded in RESOURCES.md and GLOSSARY.md}}</p>
        <pre><code class="language-python">{{Code example}}</code></pre>
      </section>

      <section class="rounded-2xl border border-cyan-900/60 bg-cyan-950/30 p-6 space-y-4">
        <h2 class="text-2xl font-semibold">Try It</h2>
        <p class="text-slate-300">{{Retrieval or scenario-based exercise}}</p>
      </section>
    </main>
  </body>
</html>
```

## Code Blocks

Always use explicit language classes:

```html
<pre><code class="language-python">
def greet(name: str) -> str:
    return f"Hello, {name}"
</code></pre>
```

Do not rely on auto-detection for short snippets; it often misfires. If a language is not included in the common highlight.js bundle, load the language module before `hljs.highlightAll()`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/rust.min.js"></script>
```

## Content Rules

- Ground factual explanations in verified entries from `RESOURCES.md`.
- Use terms from `GLOSSARY.md`; if a term is not ready for the glossary, introduce it plainly in the explainer.
- Tie the lesson to the user's `MISSION.md` in the opening promise or first exercise.
- Include at least one active step: retrieval question, scenario, worked example with a pause, or small in-browser exercise.
- Keep each explainer focused on one lesson-sized concept. If it needs multiple major sections, create multiple explainers.
