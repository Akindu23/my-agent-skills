# my-agent-skills

Install and sync [Cursor Agent Skills](https://cursor.com/docs/skills) from the [my-agent-skills](https://github.com/Akindu23/my-agent-skills) GitHub pack into Cursor (`.agents/skills/`) and/or Claude Code (`.claude/skills/`), project or global. The npm package ships the **installer only**—not the skill trees.

[npm version](https://www.npmjs.com/package/my-agent-skills)
[license](https://github.com/Akindu23/my-agent-skills/blob/main/LICENSE)

**Requires Node ≥ 20.** Binary: `**my-agent-skills`**.

---

## Quick start

```bash
npx my-agent-skills@latest
```

Interactive hub: add, update, remove, list, sync, or check skills. The CLI prompts for project vs global scope, then (on `add`) install target. The hub loops back to the menu after each action — leave with **Quit** or **Esc** (clean exit), or **Ctrl+C** (exit 130).

**After clone** (lockfile in git, skill trees gitignored): run again and choose **Sync/Restore Skills from Lockfile**, or use `sync` in scripts—see [Examples](#examples).

---

## Install (optional)

```bash
npm install -g my-agent-skills
my-agent-skills
```

---

## Commands


| Command      | What it does                                                                             |
| ------------ | ---------------------------------------------------------------------------------------- |
| `**add**`    | Install selected skills and update the lockfile.                                         |
| `**sync**`   | Repair missing or broken links for skills already in the lock (does not add new skills). |
| `**check**`  | Report lock vs pack drift; exits **1** when stale (use in CI).                           |
| `**update`** | Apply drift fixes and advance the pack pin when needed.                                  |
| `**list**`   | Show locked skills and on-disk health.                                                   |
| `**remove**` | Remove skills from disk and the lockfile.                                                |


Interactive `update` prompts to remove orphaned skills with a pre-selected multiselect; `update -y` prunes all orphans automatically.

Full flags: `**my-agent-skills --help**` and `**my-agent-skills <command> --help**`.

---

## Scope

Pass **exactly one** of `**-p` / `--project`** or `**-g` / `--global**` in scripts and CI. In an interactive terminal, the CLI can prompt if you omit both.


| Scope              | Cursor skills           | Claude Code skills     | Lockfile                                |
| ------------------ | ----------------------- | ---------------------- | --------------------------------------- |
| **Project** (`-p`) | `<cwd>/.agents/skills/` | `<cwd>/.claude/skills/` | `<cwd>/.agents/cursor-skills-lock.json` |
| **Global** (`-g`)  | `~/.agents/skills/`     | `~/.claude/skills/`    | `~/.agents/cursor-skills-lock.json`     |

## Install target

Use `**--target cursor|claude|both**` on `add` / `remove` (scripts). Interactive `add` asks after scope. `sync` / `update` / `check` use recorded lock `targets` (omit ⇒ Cursor only). One lock under `.agents/` covers all targets.

---

## Examples

**Interactive (default)**

```bash
npx my-agent-skills@latest
```

**After clone** (repair links from committed lockfile)

```bash
my-agent-skills sync -p -y
```

**CI** (no TTY—scope and flags required; `check` exits 1 when the pack moved)

```bash
my-agent-skills sync -p -y && my-agent-skills check -p --json
```

**Add one skill non-interactively**

```bash
my-agent-skills add --skill wayfinder -p -y
```

**Add to Cursor and Claude Code**

```bash
my-agent-skills add --skill wayfinder -p --target both -y
```

---

## Team workflow

1. **Commit** `.agents/cursor-skills-lock.json` to git.
2. **Gitignore** `.agents/skills/` and `.claude/skills/` (materialized skill trees).
3. After clone: `**my-agent-skills sync -p -y`** (repairs all recorded targets).
4. When `**check**` reports the pack moved on GitHub: `**my-agent-skills update -p -y**`.

Selecting a skill may auto-install `dependsOn` entries from the pack [skills.json](https://github.com/Akindu23/my-agent-skills/blob/main/skills.json) (for example `grill-with-docs` pulls in `grilling` and `domain-modeling`).

---

## Skill catalog

Browse skills and descriptions on GitHub: **[Skill catalog](https://github.com/Akindu23/my-agent-skills#skill-catalog)**.

---

## More detail

- Terminology and glossary: [CONTEXT.md](https://github.com/Akindu23/my-agent-skills/blob/main/CONTEXT.md)
- Full CLI flags: `my-agent-skills --help`

---

## Contributing

```bash
cd cli && npm install && npm test
```

Source and tests: [github.com/Akindu23/my-agent-skills/tree/main/cli](https://github.com/Akindu23/my-agent-skills/tree/main/cli). When developing inside a clone of this repo, the CLI uses the parent `**skills/**` folder instead of fetching GitHub.

---

## License

MIT