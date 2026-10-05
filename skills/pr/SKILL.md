---
name: pr
description: PR description for this branch, written to work/<feature-slug>/pr/ for copy-paste into GitHub or Bitbucket.
disable-model-invocation: true
---

# PR

Write the PR description for the current branch to a markdown file the user pastes into the host's PR form. This skill writes the file only; the user opens the PR.

## 1. Diff

Base: the branch the user names, else the remote default branch (`git symbolic-ref refs/remotes/origin/HEAD`). The **change** is the commits a PR would carry: read `git log <base>..HEAD` and `git diff <base>...HEAD`, then the changed files where the diff alone hides intent. No commits ahead of base → stop and tell the user to commit first. Uncommitted changes outside `work/` in `git status --short` → name them to the user as not in this PR. Read `GLOSSARY.md` (or legacy `CONTEXT.md`) if it exists; name domain concepts with its terms.

Host: `git remote get-url origin`. `bitbucket.org` or a self-hosted Bitbucket → **text views**: pseudocode, call tree, component tree, file tree, `diff`. Other hosts may also use Mermaid.

**Done when**: you can say in one sentence what the change does and why.

## 2. Feature folder

The PR belongs to one `work/<feature-slug>/` folder. `work/` is untracked, so the diff never shows it. Match the folder from, in order: a ticket or plan under `work/**/` whose status is `implemented / awaiting review` and whose acceptance the changed files implement, the branch name, ticket or spec titles the commits name. One match → use it. Several or none → one structured-MCQ question (`AskQuestion` in Cursor, `AskUserQuestion` in Claude Code, else chat) listing the candidates plus "new folder `work/<slug>/`".

Output path: `work/<feature-slug>/pr/<slug>.md`. `<slug>` is the branch name with `/` replaced by `-`; on the base branch, a 2-4 word kebab-case name for the change instead. A rerun with the same slug overwrites that file.

**Done when**: the output path is fixed.

## 3. Write

Fill this template. Keep prose brief, with no preamble.

```markdown
**Title:** <imperative, under 70 characters>

## Summary

<one or two sentences>

<one view: the smallest that makes the change clear>

## Evidence

- **Before:** <failing test run, output, or screenshot>
  **After:** <passing test run, output, or screenshot>

## Merge Danger

**Door:** <one-way or two-way>

<optional: why>

**Blast Radius:** <one word>

<optional: what could break on merge>
```

**Summary view.** Pick from the views in [`../show-me/SKILL.md`](../show-me/SKILL.md): **This turn** for new shape, **Fork** for a `diff` of shape that already exists. Use a text view on Bitbucket. Keep only the calls, files, and boundaries a reviewer needs. One view; two only when one hides the point.

**Evidence** is observed in this session. Use test runs and output from the session, or run the test command for the changed area now. Show the exact test that went from failing to passing, as pseudocode. For a visual change, write the screenshot path as `[attach: path]` for the user to upload. When nothing was observed, write `**Before / After:** not captured` and the command that would capture it.

**Door.** Two-way: cheap to roll back. One-way: destructive actions, data migrations, published contracts, anything a revert does not undo. **Blast Radius** names the widest thing a bad merge breaks: consumers, layout, auth, data, CI.

**Done when**: every required slot is filled from the diff or from observed evidence, each optional slot is filled or removed, and no `<...>` placeholder is left.

## 4. Hand off

Leave the file uncommitted. Tell the user the path, and that the **Title** line goes in the title field and everything below it goes in the description.

**Done when**: the user has the path.
