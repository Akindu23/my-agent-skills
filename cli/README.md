# cursor-agent-skills

Node CLI (npm package **`cursor-agent-skills`**) that installs and maintains the [my-agent-skills](https://github.com/Akindu23/my-agent-skills) bundled skill pack under Cursor’s **`.agents/skills/`** layout, with a per-scope **`cursor-skills.lock`** for reproducibility and drift detection.

**Audience:** contributors working in `cli/`, operators scripting installs in CI, and agents automating skill lifecycle commands.

Requires **Node ≥ 20**.

## Quick start

```bash
# From this repo (development)
cd cli && npm install && npm run build

# Install one skill into the current project (non-interactive)
node dist/cli.js add --skill caveman -p -y

# After clone: restore symlinks from lock (project scope)
node dist/cli.js sync -p -y

# CI: fail when lock is stale vs bundle
node dist/cli.js check -p --json
```

Published binary name: **`cursor-agent-skills`** (`package.json` → `bin`).

---

## What it does

| Concern | Behavior |
|--------|----------|
| **Install** | Materialize selected skills as **symlinks** (default) or **copies** into `.agents/skills/<name>/` |
| **Lock** | Record installed skills, content hashes, link type, and bundle package version in `cursor-skills.lock` |
| **Dependencies** | Auto-install `dependsOn` skills from `skills.json` when a dependent is selected |
| **Drift** | Compare lock hashes to the current bundle; `check` / `update` refresh or report |
| **Repair** | `sync` re-creates missing or broken links without changing the skill set |
| **Safety** | Kebab-case skill names only; paths confined under scope dirs; atomic lock writes |

This tool is **not** Vercel’s `npx skills` ecosystem installer. Lock path and schema are chosen to avoid colliding with `skills-lock.json` / `~/.agents/.skill-lock.json`.

---

## Entry point and invocation

Routing lives in `src/cli.ts` (Commander).

### Interactive hub (TTY, no subcommand)

When **stdin and stdout are TTYs** and argv has no subcommand (after stripping `--menu`):

- Shows a **hub menu** (`src/commands/hub.ts`): Add, Update, Remove, List, Sync, Check, Quit.
- **Default:** run **one** action, then exit.
- **`--menu`:** return to the hub after each action until **Quit**.
- On **`CliError`**, hub mode logs the error and reopens the menu; single-shot mode rethrows.
- User cancel (`CliCancel`) exits **0**.

### Non-TTY, no subcommand

Prints a short hint (`failBareNoSubcommand`) and exits **1**. Pass an explicit subcommand, e.g. `add --skill caveman -p -y`.

### Flags without subcommand → `add`

If the first positional arg is not a known subcommand, argv is rewritten to insert `add` before flags:

```bash
cursor-agent-skills --skill caveman -p -y --json
# equivalent to: cursor-agent-skills add --skill caveman -p -y --json
```

Known subcommands: `add`, `list`, `remove`, `sync`, `check`, `update`, `help`.

---

## Install scope

Two scopes; pass **exactly one** of `-p` / `--project` or `-g` / `--global` in scripts and CI.

| Scope | Skills directory | Lockfile |
|-------|------------------|----------|
| **Project** (`-p`) | `<cwd>/.agents/skills/` | `<cwd>/.agents/cursor-skills.lock` |
| **Global** (`-g`) | `~/.agents/skills/` | `~/.agents/cursor-skills.lock` |

**Interactive:** if neither flag is set, a **Select scope** prompt runs (`resolveScopeInteractive` in `src/lib/scope.ts`).

**Non-interactive:** missing scope → `CliError` with an example command.

`ensureAgentsDir` creates `.agents/` and `skills/` as needed.

### Recommended team workflow

- Commit **`.agents/cursor-skills.lock`** to git.
- Gitignore **`.agents/skills/`** (materialized trees).
- After clone: `cursor-agent-skills sync -p -y`.

---

## Skills bundle resolution

The **bundle** is the directory containing skill folders plus a sibling **`skills.json`** manifest (`src/lib/bundle.ts`).

Resolution order for bundle **root** (`skills/` tree):

1. **`--source <path>`** (CLI flag)
2. **`CURSOR_AGENT_SKILLS_ROOT`** (env)
3. **Monorepo dev layout:** if the CLI package lives in `cli/` inside a clone, use repo-root **`skills/`** when `../skills.json` validates
4. **Publish layout:** `cli/skills/` next to the installed package

`skills.json` must sit in the **parent** of the bundle root (repo root in dev, `cli/` when published). The CLI reads **`package.json`** beside that manifest for lock `package.name` / `package.version`.

Override example:

```bash
CURSOR_AGENT_SKILLS_ROOT=/path/to/my-agent-skills/skills \
  cursor-agent-skills add --skill caveman -p -y
```

### Manifest (`skills.json`)

| Field | Role |
|-------|------|
| `schema_version` | Manifest format version |
| `name`, `version` | Skill pack identity (stored in lock `package`) |
| `skills` | Paths like `skills/<folder>`; folder name must match `SKILL.md` `name:` |
| `dependsOn` | Map of skill → required skill names (hand-edited; generator preserves it) |

Validation: every listed skill must have `SKILL.md` under the repo root path implied by the manifest entry.

---

## Lockfile (`cursor-skills.lock`)

Written by `src/lib/lockfile.ts`.

- **`version`:** lock schema (`LOCK_VERSION = 1`)
- **`package`:** `{ name, version }` of the CLI / bundle package at install time
- **`skills`:** map of skill name → entry:
  - `source`, `sourceType` (`bundled`)
  - `computedHash` (SHA-256 over skill folder files; see Hashing)
  - `linkType`: `symlink` | `copy`
  - `installedAt`, `updatedAt` (ISO timestamps)

**Read safety:** every key in `skills` is validated as **kebab-case** (`assertValidSkillName`); paths like `../evil` are rejected before disk ops.

**Write safety:** JSON is written to a unique temp file in the same directory, synced, then **renamed** over the lock path.

**Failure on `add`:** if `applyInstallPlan` throws mid-run, the in-memory lock is reverted and destinations materialized in that run are removed best-effort; the on-disk lock is not updated until a successful full apply.

One CLI writer per scope is assumed (no file locking).

---

## Hashing and drift

**`computeSkillFolderHash`** (`src/lib/hash.ts`): SHA-256 over all files under the skill directory (sorted relative paths + contents). Skips `.git` and `node_modules`.

**Drift** (`src/lib/drift-plan.ts`) per locked skill:

| Status | Meaning |
|--------|---------|
| `ok` | Lock `computedHash` matches current bundle folder hash |
| `hashDrift` | Bundle content changed since lock was written |
| `orphan` | Skill in lock but not in current bundle manifest |

**Package drift:** `lock.package.version !== bundle.packageVersion` (e.g. after CLI/npm upgrade).

**Note:** `check` compares **bundle** hashes, not live edits inside a **copy** install. Editing files under a copied skill without changing the bundle does not surface as drift.

---

## Dependencies

`dependsOn` in `skills.json` is expanded in `src/lib/deps.ts`:

- Selecting a skill pulls in dependencies **not** already in the user’s selection (tracked as `dependencyOf` in the install plan).
- Topological visit detects **cycles** and unknown dependency names.
- **`remove`** warns in TTY when removing a skill that others still depend on (manifest-based), with optional **Continue removing?**

---

## Materialization: symlink vs copy

Default: **directory symlink** to the bundle source (`junction` on Windows).

- **`add --copy`** / **`sync --copy`:** recursive copy instead of symlink.
- Symlink failure (`EPERM` / `EACCES`): error suggests `--copy` or Windows Developer Mode.

**`sync`:** for each lock entry, if destination is missing or a **broken symlink**, re-materialize from bundle and refresh hash in lock.

**`update`:** re-materializes **hashDrift** skills using the **existing** `linkType` from the lock (`materializeFromLockEntry`).

---

## UI modes

Resolved in `src/lib/ui-mode.ts`:

| Mode | When | UX |
|------|------|-----|
| `json` | `--json` | Single JSON object on stdout; no Clack prompts |
| `interactive` | TTY stdin+stdout, no `--json` | Banner, notes, confirms, multiselect |
| `nonInteractive` | piped/CI | Plain log lines; scope and skill names must be on CLI |

`runScopedCommand` centralizes intro banner, scope resolution, and optional `afterIntro` hooks (used by `add` for skill picking).

---

## Commands (reference)

Global patterns:

- **Scope:** `-p` / `-g` (required in CI unless interactive picker).
- **`--json`:** machine-readable stdout; see schemas below.
- **`--source`:** bundle root override (`add`, `sync`, `check`, `update`).
- **`-y` / `--yes`:** skip confirmation prompts where applicable.

### `add`

Install skills into the chosen scope.

| Flag | Description |
|------|-------------|
| `--skill <name>` | Repeatable; skill id (kebab-case folder name) |
| `--all` | Install every skill in the manifest |
| `--copy` | Copy trees instead of symlinking |
| `-y` | Auto-confirm install summary in TTY; required for unattended confirm paths |

**Flow:** `createInstallPlan` → optional summary + `confirmInstallPlan` → `applyInstallPlan`.

**Install actions** (`install-policy.ts`):

| Action | When |
|--------|------|
| `new` | Not on disk, or not in lock |
| `skip` | On disk, healthy link, lock hash matches bundle |
| `update` | Missing/broken on disk but lock has entry |
| `confirm` | On disk and healthy, but lock hash ≠ bundle (TTY asks to overwrite) |

**JSON output:**

```json
{
  "scope": "project",
  "installed": ["caveman"],
  "reinstalled": [],
  "skipped": [],
  "lockPath": "/path/to/.agents/cursor-skills.lock"
}
```

Non-interactive script mode also prints per-skill lines for dependencies, skips, and reinstalls.

### `list`

Read-only view of lock entries plus on-disk health.

| Flag | Description |
|------|-------------|
| `--json` | Includes `exists`, `healthy`, `linkType`, `hashPrefix`, `path`; `deps` when bundle is available |

Empty lock: human message or `{ "scope", "skills": [] }`.

### `remove`

Remove skills from disk and lock.

| Flag | Description |
|------|-------------|
| `--skill <name>` | Repeatable; required in non-interactive mode |
| `-y` | Skip dependent warning confirm in TTY |

Interactive: multiselect from locked skills. Deletes `skillsDir/<name>` and updates lock.

**JSON:** `{ "scope", "removed": ["..."], "lockPath" }`.

### `sync`

Repair **existing** lock entries only (does not add new skills).

| Flag | Description |
|------|-------------|
| `--copy` | Use copies when re-materializing |
| `--source` | Bundle override |

Requires non-empty lock. Updates hashes for repaired skills and syncs `package` metadata.

**JSON:** `{ "scope", "synced": ["..."], "ok": ["..."], "lockPath" }` — `synced` = re-materialized; `ok` = already healthy.

### `check`

Report lock vs bundle drift. Does **not** mutate disk except in the hub shortcut below.

| Flag | Description |
|------|-------------|
| `--source` | Bundle override |

**Exit codes:**

- **0** — in sync (no hash/orphan drift, no package version drift).
- **1** — drift in **non-interactive** mode (for CI).
- Interactive **Check** from hub: shows summary; may offer **Update drifted skills now?** (`offerUpdateOnDrift`) then exits 0.

**JSON** (`buildDriftReport`):

```json
{
  "inSync": false,
  "scope": "project",
  "lockPath": "...",
  "package": {
    "name": "cursor-agent-skills",
    "lockVersion": "0.1.0",
    "bundleVersion": "0.1.0",
    "drift": true
  },
  "skills": [
    { "name": "caveman", "status": "ok", "linkType": "symlink" }
  ]
}
```

### `update`

Apply drift fixes: refresh **hashDrift** skills from bundle; handle **orphans** per policy.

| Flag | Description |
|------|-------------|
| `-y` | Skip **Proceed with update?** in TTY |
| `--source` | Bundle override |

**Orphans:** interactive **per-skill** confirm; non-interactive **skips** with a warning (does not remove). Hub **check** shortcut uses `orphanPolicy: 'skip'`.

Syncs lock `package.version` when package drift or skill updates occur.

**JSON:**

```json
{
  "scope": "project",
  "updated": ["caveman"],
  "orphansRemoved": [],
  "orphansSkipped": [],
  "lockPath": "..."
}
```

---

## Source layout (`cli/`)

```
cli/
├── package.json          # npm package cursor-agent-skills
├── skills.json           # publish-time manifest (generated)
├── skills/               # publish mirror of repo skills/ (sync-skills)
├── scripts/
│   ├── sync-skills-from-root.mjs   # cp ../skills → cli/skills
│   └── generate-skills-manifest.mjs  # regenerate skills[] from SKILL.md names
├── src/
│   ├── cli.ts            # Commander program, hub vs add default routing
│   ├── commands/         # One module per subcommand (+ hub)
│   │   ├── add.ts
│   │   ├── check.ts
│   │   ├── hub.ts
│   │   ├── list.ts
│   │   ├── remove.ts
│   │   ├── sync.ts
│   │   └── update.ts
│   └── lib/
│       ├── apply-drift-plan.ts   # update + hub check refresh
│       ├── apply-install-plan.ts   # add execution + rollback
│       ├── bundle.ts             # resolve bundle root + validate manifest
│       ├── deps.ts               # dependsOn expand + remove warnings
│       ├── drift-plan.ts         # check/update planning + JSON report
│       ├── drift-summary.ts      # human drift summaries
│       ├── hash.ts
│       ├── install.ts            # symlink/copy materialize, broken link detect
│       ├── install-plan.ts       # add planning
│       ├── install-policy.ts     # new | skip | update | confirm
│       ├── install-summary.ts    # add summary text
│       ├── lockfile.ts
│       ├── scope.ts
│       ├── skill-paths.ts        # name validation + path containment
│       ├── run-scoped-command.ts # TTY intro + scope for all commands
│       ├── run-command.ts        # hub → command dispatch
│       ├── prompts.ts            # Clack multiselect / confirm helpers
│       ├── ui-mode.ts
│       ├── output.ts             # JSON print, non-interactive errors
│       ├── errors.ts             # CliError, CliCancel
│       └── …                     # banner, theme, *-summary formatters
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/bundle-mini/
└── dist/                 # build output (tsdown); not committed
```

**Command layer** (`commands/*`): orchestration, Clack UX, `--json` emission.

**Library layer** (`lib/*`): pure planning (install/drift), filesystem ops, lock I/O — covered by unit tests.

**Hub** reuses commands via `runCommand` with `skipIntro: true` (and `offerUpdateOnDrift` on check).

---

## Development

```bash
cd cli
npm install

npm run sync-skills    # copy ../skills → cli/skills (publish mirror)
npm run manifest       # regenerate skills.json skills[] from SKILL.md
npm run build          # sync-skills + tsdown → dist/
npm test               # vitest unit + integration
npm run test:watch
```

When developing **inside the git clone**, `add` / `sync` / `list` / `remove` / `check` / `update` automatically prefer **repo-root `skills/`** and **`skills.json`** via `detectMonorepoSkillsRoot` — you usually do not need to sync before local runs.

### Tests

- **Unit:** lockfile, hash, deps, install/drift plans, summaries, scope, bundle detection.
- **Integration:** full CLI subprocess flows (`test/helpers/run-cli.ts`, `test/fixtures/bundle-mini/`).

Run before publishing: `prepublishOnly` = sync + manifest + build + tests + `npm pack --dry-run`.

---

## CI examples

```bash
# Install skills from lock after checkout
cursor-agent-skills sync -p -y

# Fail pipeline when bundle advanced but lock not updated
cursor-agent-skills check -p --json

# Non-interactive add
cursor-agent-skills add --skill document --skill handoff -p -y
```

Always pass **`-p` or `-g`** in CI. Use **`-y`** when the command would otherwise prompt in TTY-equivalent flows.

---

## Publish

npm package **`cursor-agent-skills`** ships `dist/`, `skills/`, `skills.json`, and this README (`package.json` `files`).

`prepare` runs `build` on install. Consumers get the bundled mirror under `cli/skills/`; monorepo detection does not apply unless they set `CURSOR_AGENT_SKILLS_ROOT`.

---