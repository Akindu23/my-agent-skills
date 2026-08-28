---
name: implement
description: "Implement one ticket from a spec or tickets, following karpathy-guidelines and yagni."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets, following `/karpathy-guidelines` and `/yagni`.

Prefer **one ticket per session**; clear context between tickets.

Use `/tdd` at pre-agreed seams; YAGNI cuts the production code, not the red test.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Do **not** commit. After the slice is done, run `/code-review` in a fresh turn (or ask for it explicitly).

Close the ticket **on disk**: in the tickets/plan file the work came from, mark this ticket's status (implemented / awaiting review) and name the next ticket in order. **Done when**: a fresh session reading only that file can answer "what's next?".

For a whole attached plan with council / best-practices / YAGNI, use /implement-plan instead.
