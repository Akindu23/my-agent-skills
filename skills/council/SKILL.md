---
name: council
description: "Council: recon a codebase area, then return a cited brief."
---

The parent scouts, partitions, launches dives, waits, and writes the brief.

1. Scout the area: names, layout, ownership, and enough structure to partition dives. **Done when**: every partition has a concrete slice (paths or concerns) and shared keywords the workers can search.
2. Read [`references/task-workflow.md`](references/task-workflow.md); after probe, read only the harness file it names. Spawn one Task/Agent per independent slice in **one message** (unless the user set `n`); light lane for these dives. **Done when**: every slice has a launched Task/Agent.
3. Portable role `explore` (else `general-purpose`). Read-only Explore semantics (Cursor `readonly` / Claude `Explore`). Use a write-capable type only when that mode would strip a tool the slice needs. **Done when**: every dive has a resolved `subagent_type` and permission mode.
4. Most dives on-brief; at least one off-angle. **Done when**: at least one dive targets an adjacent module, caller, or failure path the scout did not name.
5. Inspect artifacts, reconcile contradictions, write the brief. If the merge is noisy, contradictory, or shallow: merge in the parent, or one `[heavy]` follow-up. Re-partition only when slices were wrong. **Done when**: every slice is in the brief, contradictions are resolved or marked unresolved, every finding is cited by file path.
