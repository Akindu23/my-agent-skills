# HTML Lesson Format

HTML lessons are self-contained teaching files saved inside a topic workspace. Use them for knowledge delivery, worked examples, retrieval practice, and lightweight in-browser exercises.

## Output Location

| Artifact | Directory | Filename pattern |
|----------|-----------|------------------|
| HTML lesson | `docs/learning/<topic-slug>/lessons/` | `0001-<lesson-slug>.html` |

**Rules:**

- Create `docs/learning/<topic-slug>/lessons/` lazily (`mkdir -p "docs/learning/<topic-slug>/lessons"`).
- `<lesson-slug>` is a short filesystem-safe hint from the lesson focus: lowercase, hyphens, ASCII, collapsed spaces, trimmed to about 40 characters.
- Scan `lessons/` for the highest existing number and increment by one (same scheme as `learning-records/`).
- Do not create a `scripts/` directory or sidecar JavaScript file. Each lesson is one HTML file.

Example:

```text
docs/learning/typescript-generics/lessons/0003-generic-constraints.html
```

## Design

Each lesson should be **beautiful** — clean, readable typography and layout — since the user will return to these later to review.

Vary visual design to fit the topic and lesson mood. Do not reuse the same palette, layout, or section shape every time. Prefer print-friendly contrast and scannable hierarchy over a fixed house style.

Make opening a lesson as easy as possible — ideally a single CLI command the user can run to open the HTML file in their browser.

## Preview

After writing a lesson, offer this preview command:

```bash
python3 -m http.server 8765 --directory "docs/learning/<topic-slug>/lessons"
```

Then open:

```text
http://127.0.0.1:8765/0003-generic-constraints.html
```

Serving from a local origin is more reliable than `file://` when a lesson loads fonts, CSS, or scripts from a CDN. First load may require network access for those assets.

## Code Blocks

When lessons include code, use explicit language classes so syntax highlighting is reliable:

```html
<pre><code class="language-python">
def greet(name: str) -> str:
    return f"Hello, {name}"
</code></pre>
```

Do not rely on auto-detection for short snippets; it often misfires.

For syntax highlighting, [highlight.js](https://highlightjs.org/) `11.11.1` via cdnjs is a good default. Load a theme stylesheet that matches the lesson's visual design — without a theme, highlighted code can render monochrome. If a language is not in the common bundle, load its module before calling `hljs.highlightAll()`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/rust.min.js"></script>
<script>document.addEventListener("DOMContentLoaded", () => hljs.highlightAll());</script>
```

CSS approach is open: plain CSS, a CDN utility framework, or embedded styles are all fine. Choose what serves the lesson best.

## Content Rules

- Ground factual explanations in verified entries from `RESOURCES.md`.
- Use terms from `GLOSSARY.md`; if a term is not ready for the glossary, introduce it plainly in the lesson.
- Tie the lesson to the user's `MISSION.md` in the opening promise or first exercise.
- Include at least one active step: retrieval question, scenario, worked example with a pause, or small in-browser exercise.
- Litter lessons with citations — link only to entries in `RESOURCES.md` (Exa-verified when added). Do not link to URLs not yet listed there.
- Keep each lesson focused on one concept. If it needs multiple major sections, create multiple lessons.
- Include a reminder to ask follow-up questions to the agent when something is unclear.

## Reference Sheets

`reference/*.html` files follow the same design freedom as lessons: beautiful, print-friendly, quick to scan. No exercises. Layouts may be denser than lessons when the topic benefits from cheat-sheet compression.
