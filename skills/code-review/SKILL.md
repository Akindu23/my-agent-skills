---
name: code-review
description: "Diff/PR review: council → thermos/yagni → delta BPR → Sol merge. Report only; may nominate coding-standards."
disable-model-invocation: true
---

Post-change **code review**. Report only — do not edit code unless the user asks after the report. `CODING_STANDARDS.md` is the exception: append a rule only after the user accepts a nomination (step 8).

Probe Task/Agent enums; route per [`../council/references/task-workflow.md`](../council/references/task-workflow.md) (SSOT), with these overrides:

| Role | Model |
|------|--------|
| Council workers | SSOT defaults (parallel / light) |
| Thermos, `/yagni` | heavy lane / `[heavy]` |
| Fresh pass + merge | **Cursor:** `gpt-5.6-sol-medium` if in enum, else heavy. **Claude Code:** `claude-opus-4-8` if in enum, else `opus`, else heavy |

Delta `/best-practices-research` runs as that skill is written (it owns its Task fan-out and model picks).

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session — field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

1. **Scope.** Honor the user's prompt. If unspecified: changes vs `main` **including** working-tree WIP (committed on the branch + staged + unstaged). **Done when**: base, WIP inclusion, and any path/PR narrowing are explicit.

2. **Package.** Build the review **package**: git diff for that scope + full contents of every changed file (shell + explore Tasks as needed). If `CODING_STANDARDS.md` exists at the repo root, include its full contents; if it is missing, omit it and proceed. Stop in one line if the diff is empty. **Done when**: the package holds diff output, every changed file's contents, and either the standards file or an explicit omit, or an empty-diff stop.

3. **Council.** Run `/council` scoped only to areas the change touches — context brief for specialists, not the review itself. Attach that brief to later Task prompts. **Done when**: every touched area has been explored enough to brief steps 4–6.

4. **Specialists.** In **one** message, two parallel heavy-lane Task/Agent calls (each gets the package + council brief):
   - **Thermos** — `subagent_type` matching thermos review in the enum (`thermo-nuclear-review-subagent` preferred). Prompt with `### Git / diff output` and `### Changed file contents`. If no thermos type exists, say so and stop (Thermos plugin required).
   - **YAGNI** — portable role `general-purpose` (readonly). Run the `/yagni` skill (read [`../yagni/SKILL.md`](../yagni/SKILL.md) if not already loaded); review the change set; return findings only.
   **Done when**: both have returned.

5. **Delta BPR.** Run `/best-practices-research` only when the diff adds a new domain/library/API surface not covered by an earlier recon artifact, **or** thermos/yagni flags uncertain conventions. Reuse prior recon; research only what's new. Otherwise skip with a one-line reason. **Done when**: skipped with reason, or delta findings are in the package.

6. **Fresh pass + merge.** One Task/Agent (portable role `general-purpose`, or a review/judge type if in the enum; readonly). Prompt must include the package, council brief, and full thermos / yagni / BPR outputs. Worker: (1) independent **fresh pass** over the package, (2) apply **every** rule in `CODING_STANDARDS.md` when that file is in the package (lens: `standards`), (3) merge all lenses — dedupe, calibrate severity, attribute each finding's lens. Model per the table above. **Done when**: a single prioritized report is ready, and every standards rule was applied or the file was omitted.

7. **Report.** Give the user the merged report ([shape](references/REPORT.md)). Do not fix. **Done when**: every finding has severity, `file:line`, summary, and lens; or empty diff was already stated.

8. **Nominate.** After the report, check every merged finding against the membership preamble of `CODING_STANDARDS.md` (or [`../setup-work/coding-standards.md`](../setup-work/coding-standards.md) if the file is missing). At most 3 candidates. If none, say so and stop.

End the report turn before the nomination MCQ. Put every candidate's accept / skip into **one** structured-MCQ call (`questions[]`). Each question includes the proposed rule. After the round: if `CODING_STANDARDS.md` is missing, copy that seed (recreate its heading, preamble, and empty `## Rules` if the seed path is missing), then append each accepted rule under `## Rules`. Leave skipped candidates unwritten.

**Done when**: each candidate is accepted or skipped, and accepted rules are in `CODING_STANDARDS.md`.

Do **not** nest council, BPR, or yagni inside the Sol Task. Do **not** run full BPR by default.
