---
name: grill-me
description: Conducts a relentless interview of the user about a plan or design until shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Conduct a relentless interview of the user about every aspect of the plan or design they are working on until you reach shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

## User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable in the current environment, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** (not forced multiple-choice) when the answer is inherently free-form—for example pasted logs, a paragraph describing a custom tracker workflow, or an open-ended design explanation.

If a question can be answered by exploring the codebase, explore the codebase instead.
