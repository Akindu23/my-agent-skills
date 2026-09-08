---
name: karpathy-guidelines
description: Karpathy guidelines. Use when implementing or making a surgical edit, or when another skill requires this discipline.
license: MIT
---

# Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment (N/A a section with why).

Surgical edits are this skill. Unrequested abstractions, speculative scope, and the stdlib/dependency ladder are `/yagni`.

## 1. Think Before Coding

**State assumptions. Surface interpretations and tradeoffs.**

Before implementing:
- State your assumptions. If uncertain, ask.
- When multiple interpretations exist, present them.
- Name the simpler approach when one exists. Push back when warranted.
- When something is unclear: stop, name it, ask.

## 2. Simplicity First

**The change is the minimum that satisfies the request.**

`/yagni` owns the how (ladder, unrequested abstractions, speculative scope). When that skill is in session, climb it and treat this section as a hit. When it is not, rewrite until a senior engineer would not call the change overcomplicated.

## 3. Surgical Changes

**Touch only what the request requires. Clean up only orphans this change created.**

When editing existing code:
- Edit the lines the request needs.
- Match the file's existing style.
- Mention unrelated dead code; leave it.

When this change creates orphans:
- Remove imports, variables, and functions this change made unused.
- Leave pre-existing dead code unless asked to remove it.

Every changed line traces to the request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**Done when**: every §1-4 guideline is a hit on this change, or explicit N/A (section + why).
