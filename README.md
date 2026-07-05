# my-agent-skills

Personal [Cursor Agent Skills](https://cursor.com/docs/skills) tuned for day-to-day engineering work. Skills also work with other agents that load the same `.agents/skills/` layout. Credit for adapted and upstream skills is in **References** below.

---

## Install

**Requires Node ≥ 20.** From any directory, run:

```bash
npx cursor-agent-skills@latest
```

Confirm the `npx` install prompt if asked, then use the interactive menu:

cursor-agent-skills hub menu: Add, Update, Remove, List, Sync/Restore, Check, Quit

The CLI walks you through **project** (this repo’s `.agents/skills/`) vs **global** (`~/.agents/skills/`) and which skills to install.

Skills land under `.agents/skills/`; what you installed is recorded in `.agents/cursor-skills-lock.json`. Some skills pull in `dependsOn` siblings automatically (see [skills.json](./skills.json)).

**After cloning a team repo** that commits the lockfile: run the CLI again and choose **Sync/Restore Skills from Lockfile** (same project scope as before). Commit the lockfile to git; gitignore `.agents/skills/` (the installed trees).

Flags like `-p`, `-y`, and `--json` are for scripts and CI only. Full CLI docs: [npm](https://www.npmjs.com/package/cursor-agent-skills) · [source](./cli/README.md).

### Other installer (optional)

[Vercel’s open skills CLI](https://github.com/vercel-labs/skills) (`npx skills add …`) is a separate ecosystem with different lockfiles and paths. This collection uses `cursor-agent-skills` above.

---



## Using skills in Cursor

- Invoke with `/skill-name` (matches the `name` in each skill’s `SKILL.md`).
- Cursor discovers skills from `.agents/skills/` (project) and `~/.agents/skills/` (global), depending on what you installed.

---



## Recommended Cursor plugins

Cursor marketplace plugins that pair well with these skills:

- [Context7](https://cursor.com/marketplace/upstash)
- [Exa](https://cursor.com/marketplace/exa)
- [Thermos](https://cursor.com/marketplace/cursor/thermos)
- [Docs Canvas](https://cursor.com/marketplace/cursor/docs-canvas)
- [Cursor Team Kit](https://cursor.com/marketplace/cursor/cursor-team-kit)
- [Continual Learning](https://cursor.com/marketplace/cursor/continual-learning)

---



## Skill catalog

**36** skills under [skills/](./skills/). Pack manifest: [skills.json](./skills.json).


| Folder                                                                   | `name`                          | One-line intent                                                                                                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [architecture-decision-records](./skills/architecture-decision-records/) | `architecture-decision-records` | Owns lightweight ADRs with detailed rationale, optional expanded sections, scaffolding, and `docs/adr/README.md` index maintenance (draft → approval → write).                     |
| [best-practices-research](./skills/best-practices-research/)             | `best-practices-research`       | Recon current best practices per domain via live web search (Exa-first) before implementing; fans out one **Task** subagent per unrelated domain.                                  |
| [codebase-design](./skills/codebase-design/)                             | `codebase-design`               | Shared vocabulary for designing deep modules — interface, seam, depth, leverage, locality — and deepening or design-it-twice patterns.                                             |
| [codebase-onboarding](./skills/codebase-onboarding/)                     | `codebase-onboarding`           | Analyze an unfamiliar codebase and produce a structured onboarding guide, architecture map, conventions, and starter `AGENTS.md` for Cursor.                                       |
| [council](./skills/council/)                                             | `council`                       | Explore a codebase area, spawn **Task** subagents for parallel deep dives, then synthesize results (e.g. multi-area review, reconnaissance before planning).                       |
| [decision-mapping](./skills/decision-mapping/)                           | `decision-mapping`              | Turn a loose idea into a sequenced decision map of investigation tickets, then drive them to resolution one at a time.                                                             |
| [diagnosing-bugs](./skills/diagnosing-bugs/)                             | `diagnosing-bugs`               | Disciplined diagnosis loop: build a tight red-capable feedback loop, reproduce, minimise, hypothesise, instrument, fix, regression-test.                                           |
| [docker-patterns](./skills/docker-patterns/)                             | `docker-patterns`               | Apply Dockerfile, Docker Compose, BuildKit, and container security patterns for local dev and hardened deployable images.                                                          |
| [document](./skills/document/)                                           | `document`                      | Create or update durable repo docs (README, API, runbooks) verified against code; prune stale docs in the touched area.                                                            |
| [domain-modeling](./skills/domain-modeling/)                             | `domain-modeling`               | Build and sharpen the project's domain model — glossary in `CONTEXT.md`, ADR offers via canonical workflow.                                                                        |
| [explain-code](./skills/explain-code/)                                   | `explain-code`                  | Explain code in a short, scannable structure (TL;DR, sections, small examples) for walkthroughs or doc-style breakdowns.                                                           |
| [frontend-design](./skills/frontend-design/)                             | `frontend-design`               | Distinctive, intentional visual design when building or reshaping UI — aesthetic direction, typography, and choices that don't read as templated defaults.                         |
| [frontend-slides](./skills/frontend-slides/)                             | `frontend-slides`               | Create animation-rich HTML presentations from scratch or by converting PowerPoint files.                                                                                           |
| [golang](./skills/golang/)                                               | `golang`                        | Route Go work to the right reference guides and conventions for architecture, implementation, concurrency, errors, testing, performance, or review.                                |
| [gpt-taste](./skills/gpt-taste/)                                         | `gpt-taste`                     | Elite marketing/React landing UX with GSAP ScrollTrigger discipline, AIDA structure, bento/editorial typography, and strict motion rules.                                          |
| [grill-me](./skills/grill-me/)                                           | `grill-me`                      | User-invoked router to a relentless interview (`/grilling`) to sharpen a plan or design.                                                                                           |
| [grill-with-docs](./skills/grill-with-docs/)                             | `grill-with-docs`               | User-invoked router: `/grilling` plus `/domain-modeling` to sharpen a plan and update `CONTEXT.md` / ADRs inline.                                                                  |
| [grilling](./skills/grilling/)                                           | `grilling`                      | Model-invoked relentless interview leaf — stress-test plans and designs one question at a time.                                                                                    |
| [handoff](./skills/handoff/)                                             | `handoff`                       | Compact session handoff to a single `docs/handoffs/CURRENT.md`, to be used by another agent in a new session                                                                       |
| [implement-plan](./skills/implement-plan/)                               | `implement-plan`                | User-invoked router: `/council` on the plan, implement following `karpathy-guidelines` and `best-practices-research`, then a `/yagni` pass to simplify.                            |
| [improve-codebase-architecture](./skills/improve-codebase-architecture/) | `improve-codebase-architecture` | User-invoked architecture review: explore via Task/council, HTML report to `docs/architecture-reviews/`, then `/grilling` + `/domain-modeling` on a chosen candidate.              |
| [karpathy-guidelines](./skills/karpathy-guidelines/)                     | `karpathy-guidelines`           | Behavioral guidelines to reduce common LLM coding mistakes when writing, reviewing, or refactoring code.                                                                           |
| [mermaid](./skills/mermaid/)                                             | `mermaid`                       | Author **[Mermaid](https://mermaid.js.org/)** diagrams for docs and design discussions-many diagram types, ADR/RFC/README-friendly; selection and tooling guides in `references/`. |
| [pitstop](./skills/pitstop/)                                             | `pitstop`                       | Pit-crew response mode for coding work: action-first, numbered steps, state restated every turn, compressed grammar by default with escalation for safety/multi-step clarity.      |
| [postgres-patterns](./skills/postgres-patterns/)                         | `postgres-patterns`             | PostgreSQL patterns for query optimization, schema design, indexing, and security (Supabase-leaning practice).                                                                     |
| [prototype](./skills/prototype/)                                         | `prototype`                     | User-invoked throwaway prototype: terminal app for logic/state questions or multiple UI variations on one route.                                                                   |
| [python-patterns](./skills/python-patterns/)                             | `python-patterns`               | Apply Python idioms, PEP 8 norms, typing, packaging, concurrency, and tooling discipline to everyday Python code.                                                                  |
| [recursive-decomposition](./skills/recursive-decomposition/)             | `recursive-decomposition`       | Handle oversized tasks via programmatic decomposition and recursive sub-inquiry (RLM-inspired; large docs, many files, huge token spans).                                          |
| [setup-matt-pocock-skills](./skills/setup-matt-pocock-skills/)           | `setup-matt-pocock-skills`      | Add an `## Agent skills` block in `AGENTS.md`/`CLAUDE.md` and `docs/agents/` so tracker, triage labels, and domain docs are discoverable.                                          |
| [tdd](./skills/tdd/)                                                     | `tdd`                           | Test-driven development with the red–green–refactor loop; planning delegates deepening vocabulary to `/codebase-design`.                                                           |
| [teach](./skills/teach/)                                                 | `teach`                         | User-invoked multi-session tutoring with `docs/learning/<topic-slug>/` artifacts, Exa-verified resources, and HTML lessons.                                                        |
| [to-issues](./skills/to-issues/)                                         | `to-issues`                     | Break a plan, spec, or PRD into tracer-bullet vertical slices as issues on the project tracker.                                                                                    |
| [to-prd](./skills/to-prd/)                                               | `to-prd`                        | Turn the current conversation context into a PRD and publish it to the project issue tracker.                                                                                      |
| [triage](./skills/triage/)                                               | `triage`                        | Triage issues through a state machine driven by triage roles (create, AFK handoff, workflow).                                                                                      |
| [web-design-guidelines](./skills/web-design-guidelines/)                 | `web-design-guidelines`         | Review UI code for **Web Interface Guidelines** compliance (accessibility, UX, best-practice audits).                                                                              |
| [yagni](./skills/yagni/)                                                 | `yagni`                         | Forces the laziest working solution: YAGNI, stdlib-first, shortest diff; full (default) flags speculative scope but ships, ultra may skip it on greenfield.                        |




---



## Repository layout


| Path                         | Purpose                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| [skills/](./skills/)         | Skill definitions (`SKILL.md`, optional `references/`, `scripts/`, `assets/`) |
| [skills.json](./skills.json) | Pack manifest, skill list, `dependsOn`, pinned `packCommit`                   |
| [cli/](./cli/)               | **cursor-agent-skills** npm package source                                    |
| [CONTEXT.md](./CONTEXT.md)   | Terminology for the custom installer                                          |


---



## References



### Cursor and the skills format

- **[Agent Skills (open ecosystem)](https://agentskills.io/)**
- **[Cursor - Agent Skills](https://cursor.com/docs/skills)**



### Major upstream packs

The skills in this repo were referenced and adapted from the sources listed below


| Source                                                                                                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[mattpocock/skills](https://github.com/mattpocock/skills)**                                                       | Productivity and engineering workflows (MIT): [setup-matt-pocock-skills](./skills/setup-matt-pocock-skills/), [tdd](./skills/tdd/), [triage](./skills/triage/), [to-prd](./skills/to-prd/), [to-issues](./skills/to-issues/), [diagnosing-bugs](./skills/diagnosing-bugs/), [prototype](./skills/prototype/), [improve-codebase-architecture](./skills/improve-codebase-architecture/), [grill-with-docs](./skills/grill-with-docs/), [grill-me](./skills/grill-me/), [grilling](./skills/grilling/), [domain-modeling](./skills/domain-modeling/), [codebase-design](./skills/codebase-design/), [teach](./skills/teach/), [handoff](./skills/handoff/), [decision-mapping](./skills/decision-mapping/) |
| **[hunvreus/skill-issue](https://github.com/hunvreus/skill-issue)**                                                 | [document](./skills/document/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **[vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)**                 | [web-design-guidelines](./skills/web-design-guidelines/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **[anthropics/skills](https://github.com/anthropics/skills)**                                                       | [frontend-design](./skills/frontend-design/) (Apache 2.0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **[JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)**                                               | [pitstop](./skills/pitstop/) - compression rules merged in; caveman skill retired (MIT)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)**                                                     | [pitstop](./skills/pitstop/) - structure rules (action-first, numbered steps, state restate, time estimates) merged in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)**                                                 | [gpt-taste](./skills/gpt-taste/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **[cxuu/golang-skills](https://github.com/cxuu/golang-skills)**                                                     | [golang](./skills/golang/) - references distilled from Google, Uber, and Go community guides                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **[WH-2099/mermaid-skill](https://github.com/WH-2099/mermaid-skill)**                                               | [mermaid](./skills/mermaid/) (MIT)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **[supabase/agent-skills](https://github.com/supabase/agent-skills)**                                               | [postgres-patterns](./skills/postgres-patterns/) (MIT)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **[massimodeluisa/recursive-decomposition-skill](https://github.com/massimodeluisa/recursive-decomposition-skill)** | [recursive-decomposition](./skills/recursive-decomposition/) - RLM-inspired; [paper](https://arxiv.org/abs/2512.24601)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)**                                           | [yagni](./skills/yagni/) - adapted from upstream [ponytail](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md), renamed in this pack (MIT)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)**                                    | [docker-patterns](./skills/docker-patterns/), [python-patterns](./skills/python-patterns/), [frontend-slides](./skills/frontend-slides/) (visual-exploration credit: @zarazhangrui)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills/tree/main)**             | [karpathy-guidelines](./skills/karpathy-guidelines/) - Karpathy-inspired behavioral guidelines (MIT)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |


