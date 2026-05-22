# Introduction

My personal collection skills that I use which are fine-tuned for **[Cursor](https://cursor.com/docs/skills)** (Compatible with other agents too). I've been using these skills for a while now and they have been a great help in my workflow. 

Due credit is given to the original authors of the skills under **References**.

---

## Installing Skills

Run the following command to install the skills you need either in a project-specific or global scope.

```bash
npx skills@latest add Akindu23/my-agent-skills
```

To update any existing skills, run the following command (select if global or project-specific).

```bash
npx skills check
```
---

## Recommended Cursor Plugins

- **Context7** - https://cursor.com/marketplace/upstash
- **Compound Engineering** - https://cursor.com/marketplace/every/compound-engineering
- **Superpowers** - https://cursor.com/marketplace/superpowers
- **Exa** - https://cursor.com/marketplace/exa

---

## List of Skills

**34** skills under `skills/` folder

| Folder | `name` | One-line intent | Notes |
|--------|--------|-----------------|------------------|
| [`architecture-decision-records`](./skills/architecture-decision-records/) | `architecture-decision-records` | Capture architectural decisions as structured ADRs (context, alternatives, rationale) and maintain an ADR index. | ADR style after [Michael Nygard's documenting architecture decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions). |
| [`caveman`](./skills/caveman/) | `caveman` | Ultra-compressed communication that trims token usage while keeping full technical accuracy. | Inspired by Matt Pocock's skills - **[caveman](https://github.com/mattpocock/skills/tree/main/skills/productivity/caveman)** |
| [`codebase-onboarding`](./skills/codebase-onboarding/) | `codebase-onboarding` | Analyze an unfamiliar codebase and produce a structured onboarding guide, architecture map, conventions, and starter `AGENTS.md` for Cursor. | N/A |
| [`code-simplifier`](./skills/code-simplifier/) | `code-simplifier` | Simplify code for clarity and consistency using project standards from `AGENTS.md` when present, preserving exact behavior. | Use `/code-simplifier`; |
| [`council`](./skills/council/) | `council` | Explore a codebase area, spawn **Task** subagents for parallel deep dives, then synthesize results (e.g. multi-area review, reconnaissance before planning). | Self-composed skill; **enum probe** + Composer-family priority for Task `model`; see [`references/cursor-task-workflow.md`](./skills/council/references/cursor-task-workflow.md). |
| [`design-taste-frontend`](./skills/design-taste-frontend/) | `design-taste-frontend` | Architect premium React/Next.js UIs with metric baselines, strict RSC/Tailwind patterns, Framer Motion rules, and anti-slop guardrails. | Composite style guide skill; verify local edits against any third-party excerpts you merged in. |
| [`diagnose`](./skills/diagnose/) | `diagnose` | Disciplined diagnosis loop: reproduce → minimise → hypothesise → instrument → fix → regression-test. | Inspired by Matt Pocock's skills - **[diagnose](https://github.com/mattpocock/skills/tree/main/skills/engineering/diagnose)** |
| [`docker-patterns`](./skills/docker-patterns/) | `docker-patterns` | Apply Dockerfile, Docker Compose, BuildKit, and container security patterns for local dev and hardened deployable images. | `origin: ECC` - **[ECC](https://github.com/affaan-m/everything-claude-code)**. |
| [`explain-code`](./skills/explain-code/) | `explain-code` | Explain code in a short, scannable structure (TL;DR, sections, small examples) for walkthroughs or doc-style breakdowns. | N/A |
| [`frontend-design`](./skills/frontend-design/) | `frontend-design` | Build distinctive, production-grade frontend interfaces and polished code with strong visual intent while avoiding generic AI-default aesthetics. | [Apache License 2.0](./skills/frontend-design/LICENSE.txt); commonly distributed with Claude/Anthropic Compound-style material - respect license text in-tree. |
| [`frontend-slides`](./skills/frontend-slides/) | `frontend-slides` | Create animation-rich HTML presentations from scratch or by converting PowerPoint files. | `origin: ECC`; inspiration credit **`@zarazhangrui`** in body. **[ECC](https://github.com/affaan-m/everything-claude-code)**. |
| [`golang`](./skills/golang/) | `golang` | Route Go work to the right reference guides and conventions for architecture, implementation, concurrency, errors, testing, performance, or review. | Some references carry `origin: ECC`. **[ECC](https://github.com/affaan-m/everything-claude-code)**.|
| [`gpt-taste`](./skills/gpt-taste/) | `gpt-taste` | Elite marketing/React landing UX with GSAP ScrollTrigger discipline, AIDA structure, bento/editorial typography, and strict motion rules. | N/A |
| [`grill-me`](./skills/grill-me/) | `grill-me` | Interview the user relentlessly about a plan or design until shared understanding and a resolved decision tree. | Inspired by Matt Pocock's skills - **[grill-me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me)** |
| [`grill-with-docs`](./skills/grill-with-docs/) | `grill-with-docs` | Stress-test a plan against the domain model and documented decisions; update `CONTEXT.md` and ADRs inline as decisions crystallise. | Inspired by Matt Pocock's skills - **[grill-with-docs](https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs)** |
| [`handoff`](./skills/handoff/) | `handoff` | Compact session handoff to `docs/handoffs/` (links—not copies—of plans/ADRs/issues; redacts secrets; env, session prefs, and dead ends folded into state/decisions; suggests `/skills` for remaining work). | Inspired by Matt Pocock's skills - **[handoff](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff)**; default path `docs/handoffs/`; OS temp only on request. |
| [`improve-codebase-architecture`](./skills/improve-codebase-architecture/) | `improve-codebase-architecture` | Find architectural deepening opportunities using `CONTEXT.md` and `docs/adr/`; HTML report to `docs/architecture-reviews/`. | Inspired by Matt Pocock's skills - **[improve-codebase-architecture](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture)**; **Task** with enum probe + Composer priority for explore/design passes. |
| [`karpathy-guidelines`](./skills/karpathy-guidelines/) | `karpathy-guidelines` | Behavioral guidelines to reduce common LLM coding mistakes when writing, reviewing, or refactoring code. | [Andrej Karpathy's notes](https://x.com/karpathy/status/2015883857489522876); `license: MIT`. |
| [`mermaid`](./skills/mermaid/) | `mermaid` | Author **[Mermaid](https://mermaid.js.org/)** diagrams for docs and design discussions-many diagram types, ADR/RFC/README-friendly; selection and tooling guides in `references/`. | Adapted from **[WH-2099/mermaid-skill](https://github.com/WH-2099/mermaid-skill)** (MIT) for Cursor `SKILL.md` layout; mirrors upstream syntax/config docs under `references/`. |
| [`postgres-patterns`](./skills/postgres-patterns/) | `postgres-patterns` | PostgreSQL patterns for query optimization, schema design, indexing, and security (Supabase-leaning practice). | `origin: ECC`; footer cites **[Supabase Agent Skills](https://github.com/supabase/agent-skills)** (MIT). **[ECC](https://github.com/affaan-m/everything-claude-code)** + Supabase team. |
| [`prompt-optimizer`](./skills/prompt-optimizer/) | `prompt-optimizer` | Analyze raw prompts, map gaps to Cursor context, and output a ready-to-paste optimized prompt (advisory only - never executes the task). | Maps to Cursor product behavior per [Cursor Skills](https://cursor.com/docs/skills). |
| [`prototype`](./skills/prototype/) | `prototype` | Build a throwaway prototype: terminal app for logic/state questions or multiple UI variations on one route. | Inspired by Matt Pocock's skills - **[prototype](https://github.com/mattpocock/skills/tree/main/skills/engineering/prototype)** |
| [`python-patterns`](./skills/python-patterns/) | `python-patterns` | Apply Python idioms, PEP 8 norms, typing, packaging, concurrency, and tooling discipline to everyday Python code. | `origin: ECC` - **[ECC](https://github.com/affaan-m/everything-claude-code)**. |
| [`recursive-decomposition`](./skills/recursive-decomposition/) | `recursive-decomposition` | Handle oversized tasks via programmatic decomposition and recursive sub-inquiry (RLM-inspired; large docs, many files, huge token spans). | Credits **[massimodeluisa/recursive-decomposition-skill](https://github.com/massimodeluisa/recursive-decomposition-skill)** (MIT); paper [arXiv:2512.24601](https://arxiv.org/abs/2512.24601); pairs with **`council`**. |
| [`review`](./skills/review/) | `review` | Two-axis diff review (Standards vs Spec) since a user-chosen baseline; parallel **`Task`** runs with `generalPurpose` and explicit **`model`**. | Inspired by Matt Pocock's skills - **[review](https://github.com/mattpocock/skills/tree/main/skills/in-progress/review)**. Use **`/review`**. Optional **`/setup-matt-pocock-skills`** for issue-linked specs. |
| [`setup-matt-pocock-skills`](./skills/setup-matt-pocock-skills/) | `setup-matt-pocock-skills` | Add an `## Agent skills` block in `AGENTS.md`/`CLAUDE.md` and `docs/agents/` so tracker, triage labels, and domain docs are discoverable. | Inspired by Matt Pocock's skills - **[setup-matt-pocock-skills](https://github.com/mattpocock/skills/tree/main/skills/engineering/setup-matt-pocock-skills)**. Run before **`/review`**, **`/to-issues`**, **`/to-prd`**, **`/triage`**, **`/diagnose`**, **`/tdd`**, etc. |
| [`supabase-postgres-best-practices`](./skills/supabase-postgres-best-practices/) | `supabase-postgres-best-practices` | Postgres performance and schema guidance from Supabase: queries, indexes, connection pooling, RLS, and monitoring. | Upstream **[supabase/agent-skills](https://github.com/supabase/agent-skills)** (MIT pack version noted in SKILL). |
| [`tdd`](./skills/tdd/) | `tdd` | Test-driven development with the red–green–refactor loop and disciplined tests. | Inspired by Matt Pocock's skills - **[tdd](https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd)** |
| [`to-issues`](./skills/to-issues/) | `to-issues` | Break a plan, spec, or PRD into tracer-bullet vertical slices as issues on the project tracker. | Inspired by Matt Pocock's skills - **[to-issues](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-issues)**. Run **`/setup-matt-pocock-skills`** first. |
| [`to-prd`](./skills/to-prd/) | `to-prd` | Turn the current conversation context into a PRD and publish it to the project issue tracker. | Inspired by Matt Pocock's skills - **[to-prd](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-prd)**. Run **`/setup-matt-pocock-skills`** first. |
| [`triage`](./skills/triage/) | `triage` | Triage issues through a state machine driven by triage roles (create, AFK handoff, workflow). | Inspired by Matt Pocock's skills - **[triage](https://github.com/mattpocock/skills/tree/main/skills/engineering/triage)** |
| [`vercel-react-best-practices`](./skills/vercel-react-best-practices/) | `vercel-react-best-practices` | React and Next.js performance rules from Vercel Engineering (RSC, data fetching, bundle size, re-renders, waterfalls). | **[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)** (“react-best-practices” pack; MIT); see also Shu Ding's **[Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)**. |
| [`web-design-guidelines`](./skills/web-design-guidelines/) | `web-design-guidelines` | Review UI code for **Web Interface Guidelines** compliance (accessibility, UX, best-practice audits). | Upstream guideline file in **[vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)** (see SKILL frontmatter metadata). |
| [`zoom-out`](./skills/zoom-out/) | `zoom-out` | Zoom out for broader context: map relevant modules, callers, and domain vocabulary at a higher level of abstraction. | Inspired by Matt Pocock's skills - **[zoom-out](https://github.com/mattpocock/skills/tree/main/skills/engineering/zoom-out)**. |

---

## References

### Cursor & the skills format

- **[Agent Skills (open ecosystem)](https://agentskills.io/)** - interoperability baseline.
- **[Cursor - Agent Skills](https://cursor.com/docs/skills)** - discovery paths, `SKILL.md` frontmatter (`name`, `description`, `disable-model-invocation`, etc.).

### Matt Pocock - “Skills for Real Engineers”

**[mattpocock/skills](https://github.com/mattpocock/skills)** (“Skills for Real Engineers”, MIT - `npx skills@latest add mattpocock/skills`).

### Vercel Labs - official packs

Performance and guideline skills maintained for agents.

- Repo: **[github.com/vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)** (MIT repo license; individual packs carry their own attribution lines inside `SKILL.md`).
- Announcement reference: **[Introducing: React Best Practices](https://vercel.com/blog/introducing-react-best-practices)**.
- Guidelines source tree: **[vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)**.

### Supabase

Postgres-facing skills distributed as **`supabase-postgres-best-practices`** plus related Postgres guidance echoed in ECC-flavored composites.

- **[github.com/supabase/agent-skills](https://github.com/supabase/agent-skills)**.

### Recursive Language Models lineage

Recursive chunking methodology and MIT reference implementation credited inside `recursive-decomposition/SKILL.md`.

- Skill: **[github.com/massimodeluisa/recursive-decomposition-skill](https://github.com/massimodeluisa/recursive-decomposition-skill)**.
- Paper: **[Recursive Language Models (arXiv:2512.24601)](https://arxiv.org/abs/2512.24601)** (Zhang, Kraska, Khattab).

### Everything Claude Code (ECC)

Several skills expose `origin: ECC` - shorthand for bundles commonly synced from **[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)** material into Cursor-compatible skill definitions.

---
