---
name: document
description: Document. Use when creating or updating durable repo docs, or pruning stale docs in a touched area.
---

# Document

## User clarifications

For a discrete decision with about 2-6 clear options (audience, doc location, scope), use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session - field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

Ask **one decision at a time** when this skill sequences questions that way.

## Scope

- A feature, behavior, module, command, API, release, operational procedure, or existing doc scope to document.
- If the request is broad, infer the most relevant scope from context; use **User clarifications** when audience or location is still unclear.

## Workflow

1. **Identify audience**. Determine whether the docs are for users, contributors, operators, maintainers, or future agents. **Done when**: the audience is named (users, contributors, operators, maintainers, or future agents).
2. **Choose location**. Update the closest existing doc. If none exists, create the smallest obvious doc. **Done when**: the target path is named (an existing doc to update, or the smallest new path).
3. **Verify behavior**. Read relevant code, tests, config, scripts, and existing docs before writing. **Done when**: every claim the doc will make is checked against source, or marked as an assumption.
4. **Update cleanly**. Keep docs easy to scan and avoid parallel explanations that will drift. **Done when**: the chosen file is updated or created, with one explanation per fact.
5. **Use examples sparingly**. Prefer runnable commands, realistic config, and checked snippets; when an example is a diagram, follow `/mermaid-diagrams` (plain fence). **Done when**: every example in the change is a runnable command, realistic config, or checked snippet (or there are none).
6. **Prune stale content**. Remove or fix outdated docs discovered in the touched area. **Done when**: every stale statement found in the touched area is removed or fixed.
7. **Validate**. Check links, commands, snippets, paths, and generated output where practical. **Done when**: every link, command, snippet, and path in the change was checked, or marked unverified.

## Examples

- `README.md`: project purpose, setup, usage, common commands, contribution notes.
- `ARCHITECTURE.md`: stable system shape and tradeoffs when architecture is non-obvious.
- `docs/api.md`: simple external API contracts and examples.
- `docs/devops.md`: deploy path, environments, secrets, logs, monitoring, backups, and rollback.
- `docs/runbooks/`: step-by-step operational procedures when there is more than one to maintain.
- Colocated `README.md`: docs local to a package, module, or examples directory.

## Guardrails

- Do not document guessed behavior; verify against source or state the uncertainty.
- Keep docs concise, current, and task-oriented.
- Public modules and functions should document inputs, outputs, side effects, and failure modes when those are not obvious.
- Split docs only when audiences, lifetimes, or ownership differ.