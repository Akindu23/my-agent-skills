---
name: zoom-out
description: >-
  Produces a higher-level map of relevant modules, callers, and domain vocabulary when a
  code area is unfamiliar. Use when the user needs broader context than local implementation detail.
disable-model-invocation: true
---

# Zoom out

## When to use

- The user is orienting in an unfamiliar area of the codebase.
- The goal is how modules connect, who calls whom, and terms from the project's domain glossary — not line-by-line implementation.

## Instructions

1. Read domain glossary / `CONTEXT` material when present; scan entry points and key callers for the user's scope.
2. Deliver a concise map: relevant modules, main call directions, and vocabulary to reuse.
3. Stay one layer of abstraction above the last answer unless the user asks to go deeper.

The user should leave with enough structure to navigate without knowing every file yet.
