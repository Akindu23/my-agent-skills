---
name: code-review
description: "Diff/PR review: council → thermos/yagni → delta BPR → Sol merge. Report only."
disable-model-invocation: true
---

Post-change **code review**. Report only — do not edit code unless the user asks after the report.

Probe Task/Agent enums; route per [`../council/references/task-workflow.md`](../council/references/task-workflow.md) (SSOT), with these overrides:

| Role | Model |
|------|--------|
| Council workers | SSOT defaults (parallel / light) |
| Thermos, `/yagni` | heavy lane / `[heavy]` |
| Fresh pass + merge | **Cursor:** `gpt-5.6-sol-medium` if in enum, else heavy. **Claude Code:** `claude-opus-4-8` if in enum, else `opus`, else heavy |

Delta `/best-practices-research` runs as that skill is written (it owns its Task fan-out and model picks).

1. **Scope.** Honor the user's prompt. If unspecified: changes vs `main` **including** working-tree WIP (committed on the branch + staged + unstaged). **Done when**: base, WIP inclusion, and any path/PR narrowing are explicit.

2. **Package.** Build the review **package**: git diff for that scope + full contents of every changed file (shell + explore Tasks as needed). Stop in one line if the diff is empty. **Done when**: the package holds diff output and every changed file's contents, or an empty-diff stop.

3. **Council.** Run `/council` scoped only to areas the change touches — context brief for specialists, not the review itself. Attach that brief to later Task prompts. **Done when**: every touched area has been explored enough to brief steps 4–6.

4. **Specialists.** In **one** message, two parallel heavy-lane Task/Agent calls (each gets the package + council brief):
   - **Thermos** — `subagent_type` matching thermos review in the enum (`thermo-nuclear-review-subagent` preferred). Prompt with `### Git / diff output` and `### Changed file contents`. If no thermos type exists, say so and stop (Thermos plugin required).
   - **YAGNI** — portable role `general-purpose` (readonly). Run the `/yagni` skill (read [`../yagni/SKILL.md`](../yagni/SKILL.md) if not already loaded); review the change set; return findings only.
   **Done when**: both have returned.

5. **Delta BPR.** Run `/best-practices-research` only when the diff adds a new domain/library/API surface not covered by an earlier recon artifact, **or** thermos/yagni flags uncertain conventions. Reuse prior recon; research only what's new. Otherwise skip with a one-line reason. **Done when**: skipped with reason, or delta findings are in the package.

6. **Fresh pass + merge.** One Task/Agent (portable role `general-purpose`, or a review/judge type if in the enum; readonly). Prompt must include the package, council brief, and full thermos / yagni / BPR outputs. Worker: (1) independent **fresh pass** over the package, (2) merge all lenses — dedupe, calibrate severity, attribute each finding's lens. Model per the table above. **Done when**: a single prioritized report is ready.

7. **Report.** Give the user the merged report ([shape](references/REPORT.md)). Do not fix. **Done when**: every finding has severity, `file:line`, summary, and lens; or empty diff was already stated.

Do **not** nest council, BPR, or yagni inside the Sol Task. Do **not** run full BPR by default.
