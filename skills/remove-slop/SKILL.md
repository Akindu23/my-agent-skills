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

Chisel only slop this change introduced.

**Done when**: every path has a tag, or the diff is empty and you stop.

## 2. Grain

For each **code** path, read the file and a neighbor. Note comment density, error handling, typing, and naming in one line.

For each **prose** path, name the intended tone in one line (doc, chat, commit, skill).

**Done when**: every tagged path has that line.

## 3. Scan

On **code** paths, every class below is a hit or an explicit miss:

1. **Narration -** Comments that restate the next line; keep only the non-obvious *why*.
2. **Over-defense -** Checks, try/catch, retries, logs that trusted callers in this area do not use; match that thinness.
3. **Hatches -** Bypasses used only to silence the checker (`any`, `as unknown as`, `@ts-ignore`, unchecked unwrap, `as!`, blanket `except`). Use the types and errors the file already uses.
4. **Nesting -** Pyramids the file would flatten with early returns / guard clauses.

On **prose** paths, read [`references/prose.md`](references/prose.md) and apply every class, every hard tell, and **voice**.

**Done when**: every applicable class (and, for prose, every hard tell) is a hit or a miss.

## 4. Chisel

Smallest edit that restores grain. Code keeps behavior unless a clear bug. Prose keeps meaning. Leave neighbors and older slop.

**Done when**: every hit is edited, or skipped because it *is* this file's grain.

## 5. Audit

Ask: *what still makes this obviously generated?* Fix remaining slop. Then 1-3 sentences to the user.

**Done when**: that question has an answer, remaining slop is gone, and the summary is 1-3 sentences.