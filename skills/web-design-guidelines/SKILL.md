---
name: web-design-guidelines
description: Reviews UI code for Web Interface Guidelines compliance. Use when the user asks to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices". Ask for a file or glob pattern if none are given.
metadata:
  author: vercel
  version: "1.0.0"
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable in the current environment, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** (not forced multiple-choice) when the answer is inherently free-form—for example pasted logs, a paragraph describing a custom tracker workflow, or an open-ended design explanation.

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use the environment’s web fetch tool (e.g. WebFetch when available) to retrieve the latest rules. The fetched content contains all the rules and output format instructions. If no fetch tool is available, use Read after downloading the file manually or paste the URL for the user to open.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
