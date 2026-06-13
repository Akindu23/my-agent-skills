# cursor-agent-skills

Install and sync [Cursor Agent Skills](https://cursor.com/docs/skills) from the [my-agent-skills](https://github.com/Akindu23/my-agent-skills) GitHub pack into `.agents/skills/` (project or global). The npm package ships the **installer only**—not the skill trees.

[![npm version](https://img.shields.io/npm/v/cursor-agent-skills.svg)](https://www.npmjs.com/package/cursor-agent-skills)
[![license](https://img.shields.io/npm/l/cursor-agent-skills.svg)](https://github.com/Akindu23/my-agent-skills/blob/main/LICENSE)

**Requires Node ≥ 20.** Binary: **`cursor-agent-skills`**.

---

## Quick start

```bash
npx cursor-agent-skills@latest
```

Interactive hub: add, update, remove, list, sync, or check skills. The CLI prompts for project vs global scope. Use **`--menu`** to stay in the hub between actions.

**After clone** (lockfile in git, `.agents/skills/` gitignored): run again and choose **Sync/Restore Skills from Lockfile**, or use `sync` in scripts—see [Examples](#examples).

---

## Install (optional)

```bash
npm install -g cursor-agent-skills
cursor-agent-skills
```

---

## Commands

| Command | What it does |
|---------|----------------|
| **`add`** | Install selected skills and update the lockfile. |
| **`sync`** | Repair missing or broken links for skills already in the lock (does not add new skills). |
| **`check`** | Report lock vs pack drift; exits **1** when stale (use in CI). |
| **`update`** | Apply drift fixes and advance the pack pin when needed. |
| **`list`** | Show locked skills and on-disk health. |
| **`remove`** | Remove skills from disk and the lockfile. |

Full flags: **`cursor-agent-skills --help`** and **`cursor-agent-skills <command> --help`**.

---

## Scope

Pass **exactly one** of **`-p` / `--project`** or **`-g` / `--global`** in scripts and CI. In an interactive terminal, the CLI can prompt if you omit both.

| Scope | Skills directory | Lockfile |
|-------|------------------|----------|
| **Project** (`-p`) | `<cwd>/.agents/skills/` | `<cwd>/.agents/cursor-skills-lock.json` |
| **Global** (`-g`) | `~/.agents/skills/` | `~/.agents/cursor-skills-lock.json` |

---

## Examples

**Interactive (default)**

```bash
npx cursor-agent-skills@latest
```

**After clone** (repair links from committed lockfile)

```bash
cursor-agent-skills sync -p -y
```

**CI** (no TTY—scope and flags required; `check` exits 1 when the pack moved)

```bash
cursor-agent-skills sync -p -y && cursor-agent-skills check -p --json
```

**Add one skill non-interactively**

```bash
cursor-agent-skills add --skill triage -p -y
```

---

## Team workflow

1. **Commit** `.agents/cursor-skills-lock.json` to git.
2. **Gitignore** `.agents/skills/` (materialized skill trees).
3. After clone: **`cursor-agent-skills sync -p -y`**.
4. When **`check`** reports the pack moved on GitHub: **`cursor-agent-skills update -p -y`**.

Selecting a skill may auto-install **`dependsOn`** entries from the pack [`skills.json`](https://github.com/Akindu23/my-agent-skills/blob/main/skills.json) (for example `triage` pulls in `grill-with-docs` and `setup-matt-pocock-skills`).

---

## Skill catalog

Browse skills and descriptions on GitHub: **[Skill catalog](https://github.com/Akindu23/my-agent-skills#skill-catalog)**.

---

## More detail

- Terminology and glossary: [CONTEXT.md](https://github.com/Akindu23/my-agent-skills/blob/main/CONTEXT.md)
- Full CLI flags: `cursor-agent-skills --help`

---

## Contributing

```bash
cd cli && npm install && npm test
```

Source and tests: [github.com/Akindu23/my-agent-skills/tree/main/cli](https://github.com/Akindu23/my-agent-skills/tree/main/cli). When developing inside a clone of this repo, the CLI uses the parent **`skills/`** folder instead of fetching GitHub.

---

## License

MIT
