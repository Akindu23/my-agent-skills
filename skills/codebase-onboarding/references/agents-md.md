# Starter AGENTS.md template

Write or enhance **`AGENTS.md`** at the repo root. If it already exists, read it first: preserve project-specific instructions and call out what was added or changed.

If the repository already uses **`CLAUDE.md`** for another tool or team convention, add a short pointer in `AGENTS.md` or maintain `CLAUDE.md` in parallel. Do not delete team-owned `CLAUDE.md` without explicit user direction.

Keep it focused (under ~100 lines): stack that shapes how you write code, detected conventions, commands from the repo. Highlight only dependencies that shape how you write code, not every package.

```markdown
# Project Instructions

## Tech Stack
[Detected stack summary]

## Code Style
- [Detected naming conventions]
- [Detected patterns to follow]

## Testing
- Run tests: `[detected test command]`
- Test pattern: [detected test file convention]
- Coverage: [if configured, the coverage command]

## Build & Run
- Dev: `[detected dev command]`
- Build: `[detected build command]`
- Lint: `[detected lint command]`

## Project Structure
[Key directory → purpose map]

## Conventions
- [Commit style if detectable]
- [PR workflow if detectable]
- [Error handling patterns]
```
