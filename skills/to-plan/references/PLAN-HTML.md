# Plan HTML (optional review companion)

Write only when the user passed **with HTML** or accepted the post-`plan.md` structured MCQ (default No).

**SSOT remains `plan.md`.** Do not tell `/implement-plan` to read the HTML.

## Output

| Artifact | Path |
|---|---|
| Markdown (SSOT) | `work/<feature-slug>/plan.md` |
| HTML companion | `work/<feature-slug>/plan.html` |

Same directory as the plan. Overwrite `plan.html` on re-run.

## Shape

One **self-contained** HTML file — inline CSS, no bundler, no CDN required. Open with `open work/<feature-slug>/plan.html` (or double-click).

Render the plan for **human scan**, not for the agent:

1. **Title + Goal** — prominent
2. **Steps** — numbered, easy to skim; each step one clear outcome
3. **Seams** — short list
4. **Context / decisions** — compact; links as plain URLs or relative paths
5. **Out of scope** + **Done when** — secondary, not competing with steps

Keep typography readable (system UI stack is fine here). No Mermaid, no local HTTP server, no architecture-review scaffolding.

## Done when

`plan.html` exists beside `plan.md`, opens offline, and mirrors the markdown sections without inventing content absent from the plan.
