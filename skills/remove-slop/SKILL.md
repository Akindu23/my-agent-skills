---
name: remove-slop
description: Remove generated slop from a change set so code matches the file and prose keeps a human voice.
disable-model-invocation: true
license: MIT
---
# Remove slop

## 1. Scope

User-named paths if given. Else the diff vs `main` including working-tree WIP.

Tag each path: **code** (program source; comments ride this tag), **prose** (markdown, docs, copy, skill text), or **skip** (lockfiles, generated, vendored). Mixed diffs take both tags.

Only slop this change introduced.

**Done when**: every path has a tag, or the diff is empty and you stop.

## 2. Grain

For each **code** path, read the file and a neighbor. Note comment density, error handling, typing, and naming in one line.

For each **prose** path, name the intended tone in one line (doc, chat, commit, skill).

**Done when**: every tagged path has that line.

## 3. Scan

On **code** paths, every class below is a hit or an explicit miss:

1. **Narration -** Every comment is a hit unless it is a license header, a one-line *why* the code cannot show, a gotcha forced by a dependency, platform, or protocol we cannot reshape, a doc comment defining a public API contract, or a public issue/RFC link or tracked ADR (`git ls-files` lists it) for a constraint code cannot express. Pointers to tickets, plans, untracked ADRs, or anything under `work/` are hits: those files stay uncommitted, so the pointer dangles. Unsure → hit. A multi-line justification of our own workaround is a **confession**: a hit, plus `MUST KILL <symbol>` naming the code that should change so the comment is unnecessary.
2. **Over-defense -** Checks, try/catch, retries, logs that trusted callers in this area do not use; match that thinness.
3. **Hatches -** Bypasses used only to silence the checker (`any`, `as unknown as`, `@ts-ignore`, unchecked unwrap, `as!`, blanket `except`). Use the types and errors the file already uses. For each lint or type suppression, look up its rule: style-only or wrong for this line → miss; guards correctness → hit, plus `MUST KILL <symbol>` when no local fix exists.
4. **Nesting -** Pyramids the file would flatten with early returns / guard clauses.

On **prose** paths, read [`references/prose.md`](references/prose.md) and apply every class, every hard tell, and **voice**.

**Done when**: every applicable class (and, for prose, every hard tell) is a hit or a miss.

## 4. Report or edit

**Report** - the caller asked for hits only: return every hit as `class | path:line | one line`, the line carrying any `MUST KILL <symbol>`. **Done when**: that table is returned (empty if every class missed).

**Edit** - the user invoked this skill, or the caller asked to Run `/remove-slop`: read [`references/edit.md`](references/edit.md) and run it. **Done when**: that file's sequence is done.
