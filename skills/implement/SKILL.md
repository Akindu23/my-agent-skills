---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Prefer **one ticket per session**; clear context between tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Do **not** commit. After the slice is done, run `/code-review` in a fresh turn (or ask for it explicitly).

For a whole attached plan with council / best-practices / YAGNI, use /implement-plan instead.
