# my-agent-skills

A curated collection of **[Agent Skills](https://agentskills.io/)** (each folder contains a `SKILL.md` plus optional scripts, references, and assets). This repo is tailored for **[Cursor Agent](https://cursor.com/docs/skills)** and compatible with other agents that honor the same “folder + SKILL.md” layout.

Skills are synthesized from widely used public catalogs and authors; **your copies may intentionally diverge**. Check each skill’s YAML frontmatter, `LICENSE.txt`, and Supporting sources below before redistributing or publishing a fork—especially skills that bundle **non-open** license terms or extra restrictions beyond MIT/Apache-style grants.

---

## Installing

Skills are authored under `skills/<skill-name>/`. Cursor discovers skills from `.cursor/skills/`, `.agents/skills/`, `~/.cursor/skills/`, `~/.agents/skills/`, and related paths described in **[Cursor Skills documentation](https://cursor.com/docs/skills)**.

Typical setups:

| Goal | Approach |
|------|----------|
| One repo | Copy or symlink `skills/*` into that project’s `.cursor/skills/`. |
| Everything you use globally | Merge these folders into `~/.cursor/skills/` (each skill stays in its own directory). |

Invoke a skill via **`/skill-name`** in Agent chat when your client supports slash commands.

---

## List of Skills

Alphabetical. **Upstream** summarizes the strongest public lineage named in-repo (frontmatter, `LICENSE.txt`, or body); “—” means no explicit upstream link inside the skill.

| Folder | `name` | One-line intent | Notes / upstream |
|--------|--------|-----------------|------------------|
| [`architecture-decision-records`](./skills/architecture-decision-records/) | `architecture-decision-records` | Capture architecture decisions as ADRs and maintain an index. | ADR style after [Michael Nygard’s documenting architecture decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions). |
| [`caveman`](./skills/caveman/) | `caveman` | Ultra-compressed replies for lower token usage. | [Matt Pocock — Skills for Real Engineers](https://github.com/mattpocock/skills) lineage. |
| [`codebase-onboarding`](./skills/codebase-onboarding/) | `codebase-onboarding` | Produce a structured onboarding guide and starter `AGENTS.md`. | — |
| [`code-simplifier`](./skills/code-simplifier/) | `code-simplifier` | Simplify code toward clarity and project standards (`AGENTS.md`). | Implicit-only tooling; (`disable-model-invocation`) |
| [`coding-standards`](./skills/coding-standards/) | `coding-standards` | Baseline naming, readability, immutability, review norms. | `origin: ECC` — see **[ECC / Everything Claude Code](#ecc-origin-ecc-skills)**. |
| [`council`](./skills/council/) | `council` | Parallel `Task`/sub-agent reconnaissance plus synthesis workflow. | Custom; complements Cursor **Task** and local [`references/cursor-subagent-model-matrix.md`](./skills/council/references/cursor-subagent-model-matrix.md). |
| [`design-taste-frontend`](./skills/design-taste-frontend/) | `design-taste-frontend` | High-agency React/Next UX with anti-default guardrails (RSC, Tailwind, motion). | Composite style guide skill; verify local edits against any third-party excerpts you merged in. |
| [`diagnose`](./skills/diagnose/) | `diagnose` | Reproduce → minimize → hypothesize → instrument → fix loop. | [Matt Pocock — Skills for Real Engineers](https://github.com/mattpocock/skills). |
| [`docker-patterns`](./skills/docker-patterns/) | `docker-patterns` | Compose, volumes, networking, security for local stacks. | `origin: ECC` — **[ECC](#ecc-origin-ecc-skills)**. |
| [`domain-model`](./skills/domain-model/) | `domain-model` | Stress-test plans against domain language (`CONTEXT.md`, ADRs), one question at a time. | Same interaction pattern as `grill-with-docs`; companion for domain-aligned grilling. |
| [`explain-code`](./skills/explain-code/) | `explain-code` | TL;DR + structured explanations with minimal examples. | — |
| [`frontend-design`](./skills/frontend-design/) | `frontend-design` | Distinctive frontend builds (avoid generic “AI” aesthetics). | [Apache License 2.0](./skills/frontend-design/LICENSE.txt); commonly distributed with Claude/Anthropic Compound-style material — respect license text in-tree. |
| [`frontend-slides`](./skills/frontend-slides/) | `frontend-slides` | Zero-deps HTML decks; optional PPTX→HTML path. | `origin: ECC`; inspiration credit **`@zarazhangrui`** in body. **[ECC](#ecc-origin-ecc-skills)**. |
| [`golang`](./skills/golang/) | `golang` | Router into Go references (style, concurrency, grpc, perf). | Some references carry `origin: ECC`. **[ECC](#ecc-origin-ecc-skills)**. |
| [`golang-pro`](./skills/golang-pro/) | `golang-pro` | Opinionated senior-Go workflows (microservices, gRPC). | Maintainer metadata: **[Jeffallan](https://github.com/Jeffallan)** (`license: MIT`). |
| [`gpt-taste`](./skills/gpt-taste/) | `gpt-taste` | Editorial layouts + GSAP-heavy motion prescriptions. | — |
| [`grill-me`](./skills/grill-me/) | `grill-me` | Relentless Q&A grilling until the design tree is resolved. | [Matt Pocock — Skills](https://github.com/mattpocock/skills). |
| [`grill-with-docs`](./skills/grill-with-docs/) | `grill-with-docs` | Grill against domain docs; update `CONTEXT.md` / ADRs inline. | [Matt Pocock — Skills](https://github.com/mattpocock/skills). |
| [`humanizer`](./skills/humanizer/) | `humanizer` | Strip “AI-ish” prose; add specificity and voice. | `license: MIT`; `based_on`: [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). |
| [`improve-codebase-architecture`](./skills/improve-codebase-architecture/) | `improve-codebase-architecture` | Find architectural deepening opportunities vs `CONTEXT.md` + ADRs. | [Matt Pocock — Skills](https://github.com/mattpocock/skills). |
| [`karpathy-guidelines`](./skills/karpathy-guidelines/) | `karpathy-guidelines` | Reduce common LLM coding failure modes via explicit habits. | [Andrej Karpathy’s notes](https://x.com/karpathy/status/2015883857489522876); `license: MIT`. |
| [`mermaid-diagrams`](./skills/mermaid-diagrams/) | `mermaid-diagrams` | Diagram authoring with **[Mermaid](https://mermaid.js.org/)** syntax and tooling cues. | Ecosystem refs: docs, CLI, editors (see SKILL body). |
| [`postgres-patterns`](./skills/postgres-patterns/) | `postgres-patterns` | Postgres schema, indexing, query, security habits. | `origin: ECC`; footer cites **[Supabase Agent Skills](https://github.com/supabase/agent-skills)** (MIT). **[ECC](#ecc-origin-ecc-skills)** + Supabase team. |
| [`prompt-optimizer`](./skills/prompt-optimizer/) | `prompt-optimizer` | Rewrite drafts into Cursor-aware prompts (skills, modes, Task). | Maps to Cursor product behavior per [Cursor Skills](https://cursor.com/docs/skills). |
| [`python-patterns`](./skills/python-patterns/) | `python-patterns` | PEP 8–aligned idioms, typing, packaging habits. | `origin: ECC` — **[ECC](#ecc-origin-ecc-skills)**. |
| [`recursive-decomposition`](./skills/recursive-decomposition/) | `recursive-decomposition` | Divide huge tasks inspired by Recursive Language Models. | Credits **[massimodeluisa/recursive-decomposition-skill](https://github.com/massimodeluisa/recursive-decomposition-skill)** (MIT); paper [arXiv:2512.24601](https://arxiv.org/abs/2512.24601); pairs with **`council`**. |
| [`redesign-existing-projects`](./skills/redesign-existing-projects/) | `redesign-existing-projects` | Upgrade mature UIs without a full rewrite. | Composite pattern skill; aligns with workflows that often accompany Matt Pocock–style setups. |
| [`setup-matt-pocock-skills`](./skills/setup-matt-pocock-skills/) | `setup-matt-pocock-skills` | Scaffold issue tracker / triage label / domain doc wiring for downstream skills. | [Matt Pocock — Skills](https://github.com/mattpocock/skills) (`disable-model-invocation`). |
| [`supabase-postgres-best-practices`](./skills/supabase-postgres-best-practices/) | `supabase-postgres-best-practices` | Postgres + Supabase performance and RLS playbook. | Upstream **[supabase/agent-skills](https://github.com/supabase/agent-skills)** (MIT pack version noted in SKILL). |
| [`tdd`](./skills/tdd/) | `tdd` | Red–green–refactor and disciplined tests. | [Matt Pocock — Skills](https://github.com/mattpocock/skills). |
| [`to-issues`](./skills/to-issues/) | `to-issues` | Slice plans/specs into tracker-sized issues (“tracer bullets”). | [Matt Pocock — Skills](https://github.com/mattpocock/skills); run **`/setup-matt-pocock-skills`** first. |
| [`to-prd`](./skills/to-prd/) | `to-prd` | Turn conversation context into a PRD on your tracker. | [Matt Pocock — Skills](https://github.com/mattpocock/skills); run **`/setup-matt-pocock-skills`** first. |
| [`triage`](./skills/triage/) | `triage` | Triage-role state machine (AFK-ready, needs-info, wontfix paths). | [Matt Pocock — Skills](https://github.com/mattpocock/skills). |
| [`ui-ux-pro-max`](./skills/ui-ux-pro-max/) | `ui-ux-pro-max` | Large searchable guideline DB (styles, palettes, UX rules, stacks). | Public catalog skill (often mirrored under **`~/.cursor/skills/`** layout); cite maintainers noted in SKILL if you upstream changes. |
| [`vercel-react-best-practices`](./skills/vercel-react-best-practices/) | `vercel-react-best-practices` | React/Next performance rules (RSC, waterfalls, bundles, rerenders). | **[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)** (“react-best-practices” pack; MIT); see also Shu Ding’s **[Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)**. |
| [`web-design-guidelines`](./skills/web-design-guidelines/) | `web-design-guidelines` | Audit UI vs **Web Interface Guidelines** fetch target. | Upstream guideline file in **[vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)** (see SKILL frontmatter metadata). |
| [`zoom-out`](./skills/zoom-out/) | `zoom-out` | Force broader-system framing when staring at local code. | [Matt Pocock — Skills](https://github.com/mattpocock/skills) (`disable-model-invocation`). |

---

## Attribution clusters

### Cursor & the skills format

- **[Agent Skills (open ecosystem)](https://agentskills.io/)** — interoperability baseline.
- **[Cursor — Agent Skills](https://cursor.com/docs/skills)** — discovery paths, `SKILL.md` frontmatter (`name`, `description`, `disable-model-invocation`, etc.).

### Matt Pocock — “Skills for Real Engineers”

Shared workflow scaffolding (grilling, TDD-style guidance, tracker plumbing, caveman shorthand, zoom-out framing, diagnose loop, architecture passes, slice-to-issues, PRD authoring).

- Canonical repo: **[github.com/mattpocock/skills](https://github.com/mattpocock/skills)** (`npx skills@latest add mattpocock/skills`).

### Vercel Labs — official packs

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

### ECC (`origin: ECC`)

Several skills expose `origin: ECC` — shorthand for bundles commonly synced from **Everything Claude Code** material into Cursor-compatible layouts using tools such as **[ecc2cursor](https://github.com/cminn10/ecc2cursor)**.

- Treat **`origin: ECC`** as provenance tagging; individual skills may remix Supabase fragments, Compose-style guidance, etc. Always read the SKILL + LICENSE in this repo.

### Frontend deck inspiration

[`frontend-slides`](./skills/frontend-slides/) cites inspiration from **`@zarazhangrui`** (named in SKILL body).

---

## Legal & redistribution

**Do not assume everything is uniformly MIT or Apache.**

- Respect each folder’s **`LICENSE.txt`** / frontmatter **`license`** before republishing merged or copied skills.
- When you remix skills, preserve upstream copyright notices already present.

---

## Maintainer note — research method

Upstream links were grounded with **repository frontmatter**, **bundled licenses**, **[Exa](https://exa.ai/) web search**, and supplementary web lookups (Exa MCP hit a transient free-tier rate limit while batching lookups; remaining URLs were corroborated with direct documentation and authoritative repositories listed above).

If you add a skill, extend this README with its canonical source URL so future forks keep credit obvious.
