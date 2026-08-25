---
name: explain-code
description: Explains code in a short, scannable structure with a TL;DR, sectioned ideas, and small code examples. Use when the user wants code explained, summarized, walkthroughs, or documentation-style breakdowns.
disable-model-invocation: true
---

# Explain Code

Explain the user-scoped code as a short, scannable post. Prefer small code sketches over exhaustive walkthroughs.

Read [`../simplify-this/references/ste.md`](../simplify-this/references/ste.md). Apply rules 1, 2, 3, and 5 to the title, the TL;DR, and each section lead-in. Keep Format as the structure. Name identifiers from the code.

**Done when:** every scoped idea has a section with a sketch, and those four STE rules hold on the title, TL;DR, and lead-ins.

## Defaults

- Match the user's scope exactly.
- Use this structure: `#` title, `## TL;DR`, then one or more `##` sections.
- Each `##` section covers one idea and includes at least one fenced code block.
- Keep snippets small.
- Simplify code when useful, but stay faithful to behavior.
- Do not invent intent that the code or prompt does not support.

## Format

### `#` Title

One line naming the topic.

### `## TL;DR`

Write 2-3 short sentences that give the gist to someone who did not write the code.

Optional: include one small `mermaid` block only when the main story is easier to grasp as flow or handoff.

After the TL;DR section, add a horizontal rule: `---`.

### `##` Sections

For each section:

1. Write a `##` title (no emoji required).
2. Add a one- or two-sentence lead-in.
3. Show one fenced code block.

Stop the section after the code block.

Separate body sections with a horizontal rule: `---`.

## Code

- Show only the code needed for the current section's point.
- Default to about 10 non-blank lines or fewer.
- Omit anything that does not help explain the current point.
- Use `...`, `// ...`, placeholders, or simplified identifiers when that makes the idea easier to see.
- Every snippet must include short intent comments on the key lines. Use them to tell the reader what this line is doing here and why it matters.
- Prefer behavior-faithful sketches over verbatim excerpts.

## User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable in the current environment, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** (not forced multiple-choice) when the answer is inherently free-form—for example pasted logs, a paragraph describing a custom tracker workflow, or an open-ended design explanation.

## Scope fallback

- If the user gives no scope and there are unstaged changes, default to the unstaged diff.
- If the user gives no scope and there are no unstaged changes, do not guess what to explain; explicitly ask the user to identify the file, diff, or area they want explained.

## Guardrails

- Do not create prose-only `##` sections.
- Do not add explanatory text after a section's code block.
- Do not include long literals, secrets, or opaque blobs when a placeholder teaches the same point.
- Do not turn the answer into a line-by-line transcript unless the user asked for that.