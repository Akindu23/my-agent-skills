# cursor-agent-skills

CLI to install and sync the [my-agent-skills](https://github.com/Akindu23/my-agent-skills) bundled pack into `.agents/skills/` with a per-scope `cursor-skills.lock`.

## Entry point

- **TTY, no subcommand:** interactive hub (↑↓, Enter). **Default:** one action, then exit. **`--menu`:** stay in the hub until Quit. On failure, the hub reopens for recovery.
- **Non-TTY, no subcommand:** prints a short subcommand hint and exits **1** — pass an explicit command (e.g. `add --skill caveman -p -y`).
- **Flags without subcommand:** treated as `add` (e.g. `--skill caveman -p -y --json`).

## Commands

| Command | Description |
|---------|-------------|
| `add` | Install skills (interactive or `--skill` / `--all`); skips unchanged skills; prompts on hash drift in TTY |
| `list` | Show lockfile entries (`--json` for machines) |
| `remove` | Remove skills from disk and lock |
| `sync` | Restore missing or broken symlinks from lock |
| `check` | Report lock vs bundle drift (interactive hub always returns to menu; **exit 1** on drift in non-TTY for CI) |
| `update` | Re-materialize drifted locked skills; sync lock `package.version` |

## Scope

- **Project:** `.agents/skills/` + `.agents/cursor-skills.lock`
- **Global:** `~/.agents/skills/` + `~/.agents/cursor-skills.lock`

Pass `-p` or `-g`. In **non-TTY** (CI, scripts), scope must be explicit — omitting both flags fails with a clear error.

**Lockfile safety:** `cursor-skills.lock` is written atomically (temp file + rename). Skill keys in the lock are validated on read (kebab-case only); tampered keys like `../evil` are rejected before any disk operation. One CLI writer per scope is assumed (no multi-process file locking).

**Failed `add`:** If install fails mid-run, the lock is not updated; partial installs are rolled back best-effort — run `sync` to repair if needed.

`check` exits **0** when the lock matches the bundle. In **non-interactive** mode it exits **1** on hash drift, orphans, or package version drift (for CI). Interactive hub **Check** shows drift in the summary but does not exit with an error.

### `--json` (selected fields)

- **`sync`:** `{ scope, synced, ok, lockPath }` — `synced` = re-materialized skills; `ok` = already healthy on disk.
- **`list`:** each skill may include `deps: string[]` when the bundle manifest is available.

## Development

```bash
cd cli
npm install
npm run sync-skills   # copy ../skills into cli/skills
npm run manifest      # regenerate skills.json from SKILL.md names
npm run build
npm test
```

When the CLI package lives in `cli/` inside this git clone, **`add` / `sync` / `list` / `remove` automatically read repo-root `skills/`** (and `skills.json`) instead of the publish mirror under `cli/skills/`. Override any time with `--source` or `CURSOR_AGENT_SKILLS_ROOT`:

```bash
CURSOR_AGENT_SKILLS_ROOT=/path/to/my-agent-skills/skills node dist/cli.js add --skill caveman -p -y
```

## Publish

`prepublishOnly` runs sync, manifest, build, tests, and `npm pack --dry-run`.
