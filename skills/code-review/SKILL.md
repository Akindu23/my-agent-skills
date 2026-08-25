---
name: code-review
description: "Diff/PR review: council → thermos/yagni/slop-report → delta BPR → Sol merge. P0/P1 + slop table; may nominate; may Run /remove-slop when the gate is empty."
disable-model-invocation: true
---

Post-change **code review**. Report only through step 8. Edits only on an accepted Run `/remove-slop` (step 9) or an accepted coding-standards nomination (step 8).

Probe Task/Agent enums; route per [`../council/references/task-workflow.md`](../council/references/task-workflow.md), with these overrides:

| Role | Model |
|------|--------|
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

4. **Specialists.** In **one** message, three parallel Task/Agent calls (each gets the package + council brief):
   - **Thermos** — heavy. `subagent_type` matching thermos review in the enum (`thermo-nuclear-review-subagent` preferred). Prompt with `### Git / diff output` and `### Changed file contents`. If no thermos type exists, say so and stop (Thermos plugin required).
   - **YAGNI** — heavy. Portable role `general-purpose` (readonly). Run the `/yagni` skill (read [`../yagni/SKILL.md`](../yagni/SKILL.md) if not already loaded); review the change set; return findings only.
   - **Slop report** — portable role `general-purpose` (readonly). Read [`../remove-slop/SKILL.md`](../remove-slop/SKILL.md); take the **Report** branch. Same review scope.
   Thermos and yagni return the **full** finding set. The [gate](references/REPORT.md) and [placement](references/REPORT.md) are merge jobs.
   **Done when**: all three have returned.

5. **Delta BPR.** Run `/best-practices-research` only when the diff adds a new domain/library/API surface not covered by an earlier recon artifact, **or** thermos/yagni flags uncertain conventions. Reuse prior recon; research only what's new. Otherwise skip with a one-line reason. **Done when**: skipped with reason, or delta findings are in the package.

6. **Fresh pass + merge.** One Task/Agent (portable role `general-purpose`, or a review/judge type if in the enum; readonly). Prompt must include the package, council brief, full thermos / yagni / BPR / slop-report outputs, and [`references/REPORT.md`](references/REPORT.md). Worker: (1) independent **fresh pass** over the package, (2) apply **every** rule in `CODING_STANDARDS.md` when that file is in the package (lens: `standards`), (3) merge — dedupe, calibrate onto the scale, attribute each finding's lens, apply the **gate** and **placement**. Model per the table above. **Done when**: a single report matching that file is ready, and every standards rule was applied or the file was omitted.

7. **Report.** Give the user the merged report ([shape](references/REPORT.md)). Do not fix. **Done when**: the report matches that file; or empty diff was already stated.

8. **Nominate.** After the report, check every **Findings** row against the membership preamble of `CODING_STANDARDS.md` (or [`../setup-work/coding-standards.md`](../setup-work/coding-standards.md) if the file is missing). At most 3 candidates. If none, say so.

End the report turn before the nomination MCQ. Put every candidate's accept / skip into **one** structured-MCQ call (`questions[]`). Each question includes the proposed rule. After the round: if `CODING_STANDARDS.md` is missing, copy that seed (recreate its heading, preamble, and empty `## Rules` if the seed path is missing), then append each accepted rule under `## Rules`. Leave skipped candidates unwritten.

**Done when**: each candidate is accepted or skipped, and accepted rules are in `CODING_STANDARDS.md` — or there were none.

9. **Run `/remove-slop`.** After nominate. Findings has any P0/P1, or Slop was omitted: stop. Else one structured MCQ, options in this order: Skip / Run `/remove-slop` — narration / Run `/remove-slop` — all code classes / Run `/remove-slop` — code + prose. Put the empty-gate fact and hit count in the question. On a Run pick: one write-capable Task/Agent (portable role `general-purpose`), same review scope, read [`../remove-slop/SKILL.md`](../remove-slop/SKILL.md) and take **Edit**: Scope through Scan, then load `edit.md`. Named classes from the pick. Prompt with scope and classes only.

**Done when**: stopped on blockers or empty slop, Skip, or the Edit Task has returned.

Do **not** nest council, BPR, yagni, or `/remove-slop` Edit inside the Sol Task. Do **not** run full BPR by default.
