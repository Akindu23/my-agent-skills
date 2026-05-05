---
name: explain-code
description: Explains code in a short, scannable structure with a TL;DR, sectioned ideas, and small code examples. Use when the user wants code explained, summarized, walkthroughs, or documentation-style breakdowns.
disable-model-invocation: true
---

# Explain Code

Explain the user-scoped code as a short, scannable post. Prefer plain-English prose and small code sketches over exhaustive walkthroughs.

## Defaults

- Match the user's scope exactly.
- Use this structure: `#` title, `📋 TLDR`, then one or more `##` sections.
- Each `##` section covers one idea and includes at least one fenced code block.
- Keep prose simple and snippets small.
- Simplify code when useful, but stay faithful to behavior.
- Do not invent intent that the code or prompt does not support.

## Format

### `#` Title

One plain-English line naming the topic.

### `📋 TLDR`

Write 2-3 short sentences that give the gist to someone who did not write the code.

Optional: include one small `mermaid` block only when the main story is easier to grasp as flow or handoff.

After the `📋 TLDR`, add a horizontal rule: `---`.

### `##` Sections

For each section:

1. Write a plain-English `##` title with at least one emoji.
2. Add a one- or two-sentence lead-in.
3. Show one fenced code block.

Stop the section after the code block.

Separate body sections with a horizontal rule: `---`.

## Prose

- One main idea per sentence.
- Use short, common words where possible.
- Start with the simple story, then add detail.
- Avoid dense sentences, unexplained jargon, and private shorthand.

## Code

- Show only the code needed for the current section's point.
- Default to about 10 non-blank lines or fewer.
- Omit anything that does not help explain the current point.
- Use `...`, `// ...`, placeholders, or simplified identifiers when that makes the idea easier to see.
- Every snippet must include short intent comments on the key lines. Use them to tell the reader what this line is doing here and why it matters.
- Prefer behavior-faithful sketches over verbatim excerpts.

## Scope fallback

- If the user gives no scope and there are unstaged changes, default to the unstaged diff.
- If the user gives no scope and there are no unstaged changes, do not guess what to explain; explicitly ask the user to identify the file, diff, or area they want explained.

## Guardrails

- Do not create prose-only `##` sections.
- Do not add explanatory text after a section's code block.
- Do not include long literals, secrets, or opaque blobs when a placeholder teaches the same point.
- Do not turn the answer into a line-by-line transcript unless the user asked for that.