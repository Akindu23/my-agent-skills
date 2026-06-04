# cursor-agent-skills

**cursor-agent-skills** is a Node CLI that installs and maintains this repository’s [Cursor Agent Skills](https://github.com/Akindu23/my-agent-skills) pack under `.agents/skills/` (project or global). It downloads skill content from GitHub at a pinned commit, records installs in **`cursor-skills-lock.json`**, and provides commands to add skills, repair links after clone, and check or update when the pack moves forward. The npm package ships the **installer only**—not the skill trees themselves.

This tool is **not** [Vercel’s `npx skills`](https://github.com/vercel-labs/skills) installer; lockfile and paths are separate so they do not collide with `skills-lock.json`.

**Requires Node ≥ 20.** Binary name: **`cursor-agent-skills`**.

---

## Quick start

```bash
npx cursor-agent-skills@latest
```

![Interactive hub menu](../cli.png)

Use the menu to add, update, remove, list, sync, or check skills. The CLI prompts for project vs global scope and which skills to install.

**After clone** (lockfile in git, `.agents/skills/` gitignored): run the CLI again and choose **Sync/Restore Skills from Lockfile**.

**`--menu`** keeps the hub open between actions instead of exiting after one. For **CI and scripts** (non-interactive), use explicit subcommands and flags—see [Commands](#commands) below.

**Developing from this repo:**

```bash
cd cli && npm install && npm run build
node dist/cli.js
```

When the CLI lives inside a clone of this repo, it automatically uses the parent **`skills/`** folder instead of fetching GitHub.

---

## Install scope

Pass **exactly one** of **`-p` / `--project`** or **`-g` / `--global`** in scripts and CI. In an interactive terminal, the CLI can prompt if you omit both.

| Scope | Skills directory | Lockfile |
|-------|------------------|----------|
| **Project** (`-p`) | `<cwd>/.agents/skills/` | `<cwd>/.agents/cursor-skills-lock.json` |
| **Global** (`-g`) | `~/.agents/skills/` | `~/.agents/cursor-skills-lock.json` |

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

**Script / CI flags:** `-p` / `-g` (scope; required when not a TTY), `-y` (skip confirms), `--json`, `--skill <name>` (repeatable). Example: `cursor-agent-skills check -p --json`.

Full flag lists: **`cursor-agent-skills --help`** and **`cursor-agent-skills <command> --help`**.

---

## Team workflow

1. **Commit** `.agents/cursor-skills-lock.json` to git.
2. **Gitignore** `.agents/skills/` (materialized skill trees).
3. After clone: **`cursor-agent-skills sync -p -y`**.
4. When **`check`** reports the pack moved on GitHub: **`cursor-agent-skills update -p -y`**.

Selecting a skill may auto-install **`dependsOn`** entries from root [`skills.json`](../skills.json) (for example `review` pulls in `council` and `setup-matt-pocock-skills`).

**CI example** (no TTY—flags required):

```bash
cursor-agent-skills sync -p -y && cursor-agent-skills check -p --json
```

---

## More detail

- Repo glossary and terminology: [`CONTEXT.md`](../CONTEXT.md)
- Contributor internals, tests, and publish: work in **`cli/`** (`npm test`, `npm run build`)
