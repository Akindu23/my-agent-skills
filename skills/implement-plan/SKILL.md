---
name: implement-plan
description: >-
  User-invoked router: run /council and /best-practices-research on the
  attached plan, implement it following /karpathy-guidelines, then a /yagni
  pass to simplify.
disable-model-invocation: true
---

Using the plan attached to this message:

1. Run `/council` scoped to every area the plan touches, to gather context and validate the plan's approach against the existing codebase. **Done when**: every file/area the plan will change has been explored.
2. Run `/best-practices-research` on the domains the plan touches, before writing any code. **Done when**: every recommendation is incorporated into the plan or explicitly rejected.
3. Implement the plan, following `/karpathy-guidelines`. **Done when**: every step in the plan is implemented.
4. Run a `/yagni` pass over the changes made in step 3, to simplify. **Done when**: the pass has reviewed every file changed in step 3.
