# Skills CLI

Glossary for the custom skill installer (independent of Vercel’s `npx skills`).

## Language

**Skill installer**:
The command-line tool that installs, updates, and resolves dependencies for skills from this collection (and declared external packs).
_Avoid_: skills CLI (ambiguous with Vercel’s package name), package manager (too generic).

**Upstream skills CLI**:
Vercel’s `npx skills` / [vercel-labs/skills](https://github.com/vercel-labs/skills) — the open-ecosystem installer this project does not depend on for v1.
_Avoid_: the skills command (unclear which tool).

**Install scope**:
Where a skill tree is written on disk: **project** (`.agents/skills/` in the repo) or **global** (`~/.agents/skills/` in the user home).
The interactive scope picker label is **Select scope** (UI copy); domain docs and errors still say “scope” without the “Install” prefix.
_Avoid_: local/global (ambiguous with git), user/project (conflicts with “project” as skill pack).

**Agents skills directory**:
The folder Cursor (and other agents in the universal set) load skills from — `.agents/skills/` at project root or `~/.agents/skills/` for global installs.
_Avoid_: skills folder (which agent?), `.cursor/skills` (not the chosen layout for this installer).

**Skill dependency**:
Another installable skill (or skill pack) that must be present alongside the dependent skill; installed as its own directory under the same install scope, not merged into the dependent’s tree.
_Avoid_: reference file, bundled asset (those are implementation details inside a single skill).

**Skill lockfile**:
Machine-readable record of which skills (and dependency skills) are installed for a given install scope; stored as **`cursor-skills-lock.json`** (not bare `skills-lock.json` or `skills.lock`) so it does not collide with Vercel’s project **`skills-lock.json`** or `~/.agents/.skill-lock.json`.
_Avoid_: lock (ambiguous with git), manifest (use for the package’s declarative `skills.json` only), `cursor-skills.lock` (retired basename).

**cursor-skills-lock.json**:
The lockfile path: **`.agents/cursor-skills-lock.json`** (project) or **`~/.agents/cursor-skills-lock.json`** (global). Schema mirrors Vercel’s project lock shape (`version` + `skills` map with `computedHash`, `source`, `sourceType`, timestamps) adapted for **remote** installs (`sourceType: github`, pack `source` like `owner/repo`, **pinned commit** on the lock root). Lock skill keys are validated on read (kebab-case identifiers only); writes are atomic (temp + rename). **`check`** compares installed content to the resolved remote tree at the pinned commit — copy-mode on-disk edits without remote changes are not detected as drift.
_Avoid_: skills-lock.json (Vercel project lock), skill-lock.json (Vercel global lock), cursor-skills.lock (retired basename).

**Project lock commit policy**:
Teams commit **`.agents/cursor-skills-lock.json`** to git and **gitignore** `.agents/skills/` (installed trees) plus the **pack fetch cache**; after clone, run `cursor-agent-skills sync` to repair links, then **`update`** when **`check`** reports the default branch has moved ahead of the pinned commit.
_Avoid_: vendoring skills in git (optional pattern, not the default).

**Package manifest**:
Root `skills.json` in this repository declaring the skill pack name, version, exported skill paths, and optional dependency entries (git URL + ref).
_Avoid_: SKILL.md frontmatter (agent-facing only, not distribution).

**Pack fetch cache**:
Persistent on-disk store for an extracted remote pack at a **pinned commit** (e.g. `~/.cache/cursor-agent-skills/<owner>/<repo>/<sha>/skills/`). Symlinks from `.agents/skills/<name>` target skill folders inside this cache, not OS temp or npx extract dirs.
_Avoid_: skill cache (ambiguous with Vercel naming), `/tmp` (ephemeral; breaks symlinks).

**Cache-direct symlink**:
Default install mode: `.agents/skills/<name>` is a symlink to `<skill>/` inside the **pack fetch cache** for the lock’s pinned commit.
_Avoid_: bundle-direct symlink (v1 npm-bundled layout), symlinking into npx temp.

**Remote skill pack**:
The skill collection served from the public GitHub repository (`skills/` tree + root `skills.json`); the npm **`cursor-agent-skills`** package ships the CLI only and fetches pack content at install/update time.
_Avoid_: bundled pack (v1 npm mirror), live pull without a pinned commit (unreproducible locks).

**Pinned commit**:
The full Git commit SHA recorded in **cursor-skills-lock.json** for the remote pack. All materialization and **computedHash** values refer to the tree at this SHA; **`update`** resolves the repo default branch to a newer SHA when the user chooses to refresh.
_Avoid_: floating `main` in the lock without a SHA, npm package version as the only pin (CLI releases decoupled from skill content).

**GitHub pack source**:
The canonical remote identity of the pack (e.g. `Akindu23/my-agent-skills`), used for tarball fetch and lock `source` fields.
_Avoid_: raw GitHub URL in user docs (prefer owner/repo shorthand), skills.sh (upstream CDN; not required for this installer).

**Unauthenticated GitHub fetch**:
v2 remote pack downloads use **no** `GITHUB_TOKEN`, `gh auth token`, or other credentials. Public-repo tarball/archive URLs only; optional authenticated fetch is deferred.
_Avoid_: requiring `gh` on PATH, prompting users to log in for normal installs on a public pack.

**CLI package directory**:
The Node/TypeScript implementation lives in repo-root **`cli/`** (`package.json`, `src/`), publishing as npm package **`cursor-agent-skills`**; skill content remains in repo-root **`skills/`**.
_Avoid_: packages/ (not chosen), embedding skills only inside cli/ (duplicates root tree).

**Manifest generator**:
A CLI-maintained script scans repo-root `skills/` and regenerates the `skills` list in `skills.json`; the **`dependsOn`** map is hand-edited and validated against known skill names.
_Avoid_: fully manual skills list (error-prone at 36+ skills).

**cursor-agent-skills**:
The npm CLI binary users invoke as `npx cursor-agent-skills …` to install and manage this skill collection.
_Avoid_: skills, my-skills (collides with Vercel’s package name).

**Interactive hub**:
TTY launcher when `cursor-agent-skills` runs with no subcommand: a Clack `select` menu (↑↓ and Enter; hint shown under the prompt). **Default:** one action per launch, then the CLI exits on success. **`--menu`:** returns to the menu after each action until Quit. On command failure, the hub menu is shown again for recovery. **Check** from the hub may offer “Update drifted skills now?” when drift is found, then exit (no hub loop). Scripts use explicit subcommands or flag-only `add`.
_Avoid_: default `add` command (removed; bare non-TTY exits with a hint instead); treating bare TTY as an infinite admin REPL without `--menu`.

**Local dev source override**:
When developing the CLI from a git clone, **`CURSOR_AGENT_SKILLS_ROOT`** or **`--source`** may point at repo-root `skills/` instead of fetching GitHub (monorepo auto-detect). Production installs use **remote skill pack** fetch unless overridden.
_Avoid_: treating the npm package as the skill content source (CLI-only publish).

**Transitive install**:
Installing a selected skill also installs its declared sibling dependencies into the same install scope, without a separate user confirmation step in v1 (logged for transparency).
_Avoid_: optional dependency, peer skill (npm terms; use “skill dependency” instead).

**Skills source root**:
Directory tree the CLI reads skill folders from when hashing or materializing: the `skills/` subtree inside the **pack fetch cache** for the lock’s **pinned commit**, or a **local dev source override** path.
_Avoid_: install path (destination under `.agents/skills/`), confusing with **GitHub pack source** (remote identity, not a directory).

**Monorepo dev auto-detect**:
When the `cursor-agent-skills` package directory is `cli/` inside a clone whose parent has both `skills/` and `skills.json`, the CLI may resolve **skills source root** to that parent’s `skills/` for local development. Explicit `CURSOR_AGENT_SKILLS_ROOT` or `--source` wins over auto-detect and over remote fetch.
_Avoid_: `cli/skills/` as the edit surface (publish mirror removed when remote-first ships).

**Add reinstall policy**:
On `add`, if a skill is already on disk (healthy symlink or copy) and the lock **computedHash** matches the source tree at the **pinned commit**, the CLI **skips** it. If the hash differs, interactive sessions **prompt** to overwrite; `-y` or non-TTY **overwrites** without prompting.
_Avoid_: prompting on every repeat `add` when nothing changed (noisy); silently skipping when the remote tree changed without user awareness (use hash-drift / **update** instead).

**dependsOn map**:
The `dependsOn` object in root `skills.json` keyed by skill name, whose values are arrays of sibling skill names to auto-install into the same scope when the key skill is selected.
_Avoid_: dependencies block (reserved for future external git packs per Agent Skills RFC), requires in SKILL.md (agent-facing hints only, not install truth).

**Source hash drift**:
A skill folder’s content at the **pinned commit** no longer matches what the lockfile recorded: recomputed hash from **skills source root** ≠ `computedHash` on that lock entry. Usually means the lock’s commit is stale relative to a refreshed cache or a partial failed fetch—not that the user edited files under `.agents/skills/` directly.
_Avoid_: bundle hash drift (v1 term), “skills changed” without naming source vs install tree.

**Remote commit drift**:
The default branch on **GitHub pack source** points to a commit newer than the lock’s **pinned commit**. **`check`** reports this; **`update`** fetches the tarball at the new SHA, refreshes the **pack fetch cache**, re-materializes, and rewrites the lock.
_Avoid_: expecting **`sync`** alone to pull new upstream skills (sync only repairs broken/missing links for the current pin).

**Update command**:
Fetches the remote pack at the latest default-branch commit (or reapplies the current pin when only **source hash drift** exists), then refreshes skills already listed in **cursor-skills-lock.json** for a scope. Does not install new skills that were never in the lock—use **add** for that. Interactive TTY: installation summary + **Proceed?**; non-TTY: refresh when scope flags are set. Re-materializes using each lock entry’s existing **linkType** (symlink or copy).
_Avoid_: `sync` as a substitute for upstream refresh, `npx skills update` (upstream Vercel CLI).

**Check command**:
Read-only drift report for a scope: lists **remote commit drift**, per-skill **source hash drift**, and broken install paths. Exits non-zero if anything is out of date; no lock or install writes.
_Avoid_: `update --dry-run` as the only surface (**`check`** remains the dedicated read-only command).

**Orphan lock entry**:
A skill recorded in **cursor-skills-lock.json** that no longer exists in the remote pack manifest at the resolved commit. **Update** warns and skips in non-TTY; in interactive TTY, prompts whether to **remove** the install path and lock entry.
_Avoid_: silent auto-delete without confirmation in interactive mode.
