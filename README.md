# my-agent-skills

Personal [Cursor Agent Skills](https://cursor.com/docs/skills) tuned for day-to-day engineering work. Skills also work with other agents that load the same `.agents/skills/` layout. Credit for adapted and upstream skills is in **References** below.

---

## Install

**Requires Node ≥ 20.** From any directory, run:

```bash
npx cursor-agent-skills@latest
```

Confirm the `npx` install prompt if asked, then use the interactive menu:

![cursor-agent-skills hub menu: Add, Update, Remove, List, Sync/Restore, Check, Quit](./cli.png)

The CLI walks you through **project** (this repo’s `.agents/skills/`) vs **global** (`~/.agents/skills/`) and which skills to install.

Skills land under `.agents/skills/`; what you installed is recorded in `.agents/cursor-skills-lock.json`. Some skills pull in **`dependsOn`** siblings automatically (see [`skills.json`](./skills.json)).

**After cloning a team repo** that commits the lockfile: run the CLI again and choose **Sync/Restore Skills from Lockfile** (same project scope as before). Commit the lockfile to git; gitignore `.agents/skills/` (the installed trees).

Flags like `-p`, `-y`, and `--json` are for scripts and CI only. Full CLI docs: [npm](https://www.npmjs.com/package/cursor-agent-skills) · [source](./cli/README.md).


### Other installer (optional)

[Vercel’s open skills CLI](https://github.com/vercel-labs/skills) (`npx skills add …`) is a separate ecosystem with different lockfiles and paths. This collection uses **`cursor-agent-skills`** above.

---

## Using skills in Cursor

- Invoke with **`/skill-name`** (matches the `name` in each skill’s `SKILL.md`).
- Cursor discovers skills from **`.agents/skills/`** (project) and **`~/.agents/skills/`** (global), depending on what you installed.

---

## Recommended Cursor plugins

Cursor marketplace plugins that pair well with these skills:

- [Context7](https://cursor.com/marketplace/upstash)
- [Compound Engineering](https://cursor.com/marketplace/every/compound-engineering)
- [Exa](https://cursor.com/marketplace/exa)
- [Thermos](https://cursor.com/marketplace/cursor/thermos)
- [Docs Canvas](https://cursor.com/marketplace/cursor/docs-canvas)
- [Cursor Team Kit](https://cursor.com/marketplace/cursor/cursor-team-kit)
- [Continual Learning](https://cursor.com/marketplace/cursor/continual-learning)

---

## Skill catalog

**36** skills under [skills/](./skills/). Pack manifest: [skills.json](./skills.json).

| Folder | `name` | One-line intent |
| --- | --- | --- |
| [architecture-decision-records](./skills/architecture-decision-records/) | `architecture-decision-records` | Owns lightweight ADRs with detailed rationale, optional expanded sections, scaffolding, and `docs/adr/README.md` index maintenance (draft → approval → write). |
| [caveman](./skills/caveman/) | `caveman` | Ultra-compressed communication that trims token usage while keeping full technical accuracy. |
| [codebase-onboarding](./skills/codebase-onboarding/) | `codebase-onboarding` | Analyze an unfamiliar codebase and produce a structured onboarding guide, architecture map, conventions, and starter `AGENTS.md` for Cursor. |
| [code-simplifier](./skills/code-simplifier/) | `code-simplifier` | Simplify code for clarity and consistency using project standards from `AGENTS.md` when present, preserving exact behavior. |
| [council](./skills/council/) | `council` | Explore a codebase area, spawn **Task** subagents for parallel deep dives, then synthesize results (e.g. multi-area review, reconnaissance before planning). |
| [design-taste-frontend](./skills/design-taste-frontend/) | `design-taste-frontend` | Architect premium React/Next.js UIs with metric baselines, strict RSC/Tailwind patterns, Framer Motion rules, and anti-slop guardrails. |
| [diagnose](./skills/diagnose/) | `diagnose` | Disciplined diagnosis loop: reproduce → minimise → hypothesise → instrument → fix → regression-test. |
| [docker-patterns](./skills/docker-patterns/) | `docker-patterns` | Apply Dockerfile, Docker Compose, BuildKit, and container security patterns for local dev and hardened deployable images. |
| [document](./skills/document/) | `document` | Create or update durable repo docs (README, API, runbooks) verified against code; prune stale docs in the touched area. |
| [explain-code](./skills/explain-code/) | `explain-code` | Explain code in a short, scannable structure (TL;DR, sections, small examples) for walkthroughs or doc-style breakdowns. |
| [frontend-design](./skills/frontend-design/) | `frontend-design` | Build distinctive, production-grade frontend interfaces and polished code with strong visual intent while avoiding generic AI-default aesthetics. |
| [frontend-slides](./skills/frontend-slides/) | `frontend-slides` | Create animation-rich HTML presentations from scratch or by converting PowerPoint files. |
| [golang](./skills/golang/) | `golang` | Route Go work to the right reference guides and conventions for architecture, implementation, concurrency, errors, testing, performance, or review. |
| [gpt-taste](./skills/gpt-taste/) | `gpt-taste` | Elite marketing/React landing UX with GSAP ScrollTrigger discipline, AIDA structure, bento/editorial typography, and strict motion rules. |
| [grill-me](./skills/grill-me/) | `grill-me` | Interview the user relentlessly about a plan or design until shared understanding and a resolved decision tree. |
| [grill-with-docs](./skills/grill-with-docs/) | `grill-with-docs` | Stress-test a plan against the domain model and documented decisions; update `CONTEXT.md` inline; offer ADRs sparingly and use canonical ADR workflow on acceptance. |
| [handoff](./skills/handoff/) | `handoff` | Compact session handoff to a single `docs/handoffs/CURRENT.md`, to be used by another agent in a new session |
| [improve-codebase-architecture](./skills/improve-codebase-architecture/) | `improve-codebase-architecture` | Find architectural deepening opportunities using `CONTEXT.md` and ADRs (index-first via `docs/adr/README.md`); HTML report to `docs/architecture-reviews/`; offers ADRs on load-bearing rejections via canonical workflow. |
| [karpathy-guidelines](./skills/karpathy-guidelines/) | `karpathy-guidelines` | Behavioral guidelines to reduce common LLM coding mistakes when writing, reviewing, or refactoring code. |
| [mermaid](./skills/mermaid/) | `mermaid` | Author **[Mermaid](https://mermaid.js.org/)** diagrams for docs and design discussions-many diagram types, ADR/RFC/README-friendly; selection and tooling guides in `references/`. |
| [postgres-patterns](./skills/postgres-patterns/) | `postgres-patterns` | PostgreSQL patterns for query optimization, schema design, indexing, and security (Supabase-leaning practice). |
| [prompt-optimizer](./skills/prompt-optimizer/) | `prompt-optimizer` | Analyze raw prompts, map gaps to Cursor context, and output a ready-to-paste optimized prompt (advisory only - never executes the task). |
| [prototype](./skills/prototype/) | `prototype` | Build a throwaway prototype: terminal app for logic/state questions or multiple UI variations on one route. |
| [python-patterns](./skills/python-patterns/) | `python-patterns` | Apply Python idioms, PEP 8 norms, typing, packaging, concurrency, and tooling discipline to everyday Python code. |
| [recursive-decomposition](./skills/recursive-decomposition/) | `recursive-decomposition` | Handle oversized tasks via programmatic decomposition and recursive sub-inquiry (RLM-inspired; large docs, many files, huge token spans). |
| [review](./skills/review/) | `review` | Two-axis diff review (Standards vs Spec) since a user-chosen baseline; parallel **Task** runs with `generalPurpose` and explicit **model**. |
| [setup-matt-pocock-skills](./skills/setup-matt-pocock-skills/) | `setup-matt-pocock-skills` | Add an `## Agent skills` block in `AGENTS.md`/`CLAUDE.md` and `docs/agents/` so tracker, triage labels, and domain docs are discoverable. |
| [supabase-postgres-best-practices](./skills/supabase-postgres-best-practices/) | `supabase-postgres-best-practices` | Postgres performance and schema guidance from Supabase: queries, indexes, connection pooling, RLS, and monitoring. |
| [tdd](./skills/tdd/) | `tdd` | Test-driven development with the red–green–refactor loop and disciplined tests. |
| [teach](./skills/teach/) | `teach` | Teach a topic over multiple sessions with `docs/learning/<topic-slug>/` artifacts, Exa-verified resources, learning records, exercises, and HTML lessons. |
| [to-issues](./skills/to-issues/) | `to-issues` | Break a plan, spec, or PRD into tracer-bullet vertical slices as issues on the project tracker. |
| [to-prd](./skills/to-prd/) | `to-prd` | Turn the current conversation context into a PRD and publish it to the project issue tracker. |
| [triage](./skills/triage/) | `triage` | Triage issues through a state machine driven by triage roles (create, AFK handoff, workflow). |
| [vercel-react-best-practices](./skills/vercel-react-best-practices/) | `vercel-react-best-practices` | React and Next.js performance rules from Vercel Engineering (RSC, data fetching, bundle size, re-renders, waterfalls). |
| [web-design-guidelines](./skills/web-design-guidelines/) | `web-design-guidelines` | Review UI code for **Web Interface Guidelines** compliance (accessibility, UX, best-practice audits). |
| [zoom-out](./skills/zoom-out/) | `zoom-out` | Zoom out for broader context: map relevant modules, callers, and domain vocabulary at a higher level of abstraction. |

---

## Repository layout

| Path | Purpose |
| --- | --- |
| [skills/](./skills/) | Skill definitions (`SKILL.md`, optional `references/`, `scripts/`, `assets/`) |
| [skills.json](./skills.json) | Pack manifest, skill list, `dependsOn`, pinned `packCommit` |
| [cli/](./cli/) | **cursor-agent-skills** npm package source |
| [CONTEXT.md](./CONTEXT.md) | Terminology for the custom installer |

---

## References

### Cursor and the skills format

- **[Agent Skills (open ecosystem)](https://agentskills.io/)**
- **[Cursor — Agent Skills](https://cursor.com/docs/skills)**

### Major upstream packs

| Source | Notes |
| --- | --- |
| **[mattpocock/skills](https://github.com/mattpocock/skills)** | Productivity and engineering workflows (MIT) |
| **[hunvreus/skill-issue](https://github.com/hunvreus/skill-issue)** | [document](./skills/document/) skill |
| **[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)** | React best practices; **[web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)** |
| **[supabase/agent-skills](https://github.com/supabase/agent-skills)** | Postgres guidance |
| **[massimodeluisa/recursive-decomposition-skill](https://github.com/massimodeluisa/recursive-decomposition-skill)** | RLM-inspired decomposition; [paper](https://arxiv.org/abs/2512.24601) |
| **[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)** | Claude Code skills adapted for cursor. |
