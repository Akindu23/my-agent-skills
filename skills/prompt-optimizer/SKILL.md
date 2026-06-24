---
name: prompt-optimizer
description: >-
  Analyzes raw prompts, surfaces intent and gaps, maps them to Cursor context
  (AGENTS.md, Rules, Agent Skills via /name, Plan vs Agent mode, Task subagents), and outputs a
  ready-to-paste optimized prompt. Advisory only — never executes the task itself.
  Triggers on "optimize prompt", "improve my prompt", "rewrite this prompt",
  "help me prompt", and Chinese equivalents; does not trigger on "optimize code"
  or direct execution requests ("just do it" / 直接做).
---

# Prompt Optimizer

Analyze a draft prompt, critique it, align it with **Cursor** workflows (project rules, skills, modes), and output a complete optimized prompt the user can paste and run.

## When to Use

- User says "optimize this prompt", "improve my prompt", "rewrite this prompt"
- User says "help me write a better prompt for..."
- User says "what's the best way to ask Cursor to..."
- User says "优化prompt", "改进prompt", "怎么写prompt", "帮我优化这个指令"
- User pastes a draft prompt and asks for feedback or enhancement
- User says "I don't know how to prompt for this"
- User asks how to combine **Plan mode**, **Agent Skills** (invoke with `/skill-name` in Agent chat), or **Task** subagents for a goal
- User explicitly invokes a custom slash command for prompt optimization (e.g. `/prompt-optimize`) if they defined one

### Do Not Use When

- User wants the task done directly (just execute it)
- User says "优化代码", "优化性能", "optimize this code", "optimize performance" — these are refactoring tasks, not prompt optimization
- User wants only a list of installed skills with no prompt rewrite (handle as a direct inventory request)
- User says "just do it" or "直接做"

## How It Works

**Advisory only — do not execute the user's task.**

Do NOT write code, create files, run commands, or take any implementation
action. Your ONLY output is an analysis plus an optimized prompt.

If the user says "just do it", "直接做", or "don't optimize, just execute",
do not switch into implementation mode inside this skill. Tell the user this
skill only produces optimized prompts, and instruct them to make a normal
task request if they want execution instead.

### Cursor: invoking Agent Skills

Per the [Agent Skills documentation](https://cursor.com/docs/skills):

- **Manual invoke:** In **Agent** chat, type **`/`** and search for the skill name. It must match the skill’s folder and YAML `name` (lowercase letters, numbers, hyphens only).
- **Automatic use:** Cursor discovers skills from skill directories on startup; the agent may apply them when relevant, unless the skill sets **`disable-model-invocation: true`**, in which case only explicit **`/skill-name`** includes it in context.
- **Where to see them:** **Cursor Settings → Rules** (skills appear under the Agent flow as described in the docs).

In this skill, optimized prompts should tell the user to invoke skills with **`/skill-name`** (for example `` `/tdd` ``, `` `/tdd-workflow` ``). Do not use `@` for Cursor Agent Skills (that is a different context-attachment pattern from npm `package@scope` and other unrelated uses).

Run this 6-phase pipeline sequentially. Present results using the Output Format below.

### Analysis Pipeline

### Phase 0: Project Detection

Before analyzing the prompt, detect the current project context:

1. Check for **`AGENTS.md`** at the repo root (primary agent instructions in Cursor) and read it for project conventions; if only **`CLAUDE.md`** exists (legacy / cross-tool teams), read that instead
2. Detect tech stack from project files:
   - `package.json` → Node.js / TypeScript / React / Next.js
   - `go.mod` → Go
   - `pyproject.toml` / `requirements.txt` → Python
   - `Cargo.toml` → Rust
   - `build.gradle` / `pom.xml` → Java / Kotlin / Spring Boot
   - `Package.swift` → Swift
   - `Gemfile` → Ruby
   - `composer.json` → PHP
   - `*.csproj` / `*.sln` → .NET
   - `Makefile` / `CMakeLists.txt` → C / C++
   - `cpanfile` / `Makefile.PL` → Perl
3. Note detected tech stack for use in Phase 3 and Phase 4

If no project files are found (e.g., the prompt is abstract or for a new project),
skip detection and flag "tech stack unknown" in Phase 4.

### Phase 1: Intent Detection

Classify the user's task into one or more categories:

| Category | Signal Words | Example |
|----------|-------------|---------|
| New Feature | build, create, add, implement, 创建, 实现, 添加 | "Build a login page" |
| Bug Fix | fix, broken, not working, error, 修复, 报错 | "Fix the auth flow" |
| Refactor | refactor, clean up, restructure, 重构, 整理 | "Refactor the API layer" |
| Research | how to, what is, explore, investigate, 怎么, 如何 | "How to add SSO" |
| Testing | test, coverage, verify, 测试, 覆盖率 | "Add tests for the cart" |
| Review | review, audit, check, 审查, 检查 | "Review my PR" |
| Documentation | document, update docs, 文档 | "Update the API docs" |
| Infrastructure | deploy, CI, docker, database, 部署, 数据库 | "Set up CI/CD pipeline" |
| Design | design, architecture, plan, 设计, 架构 | "Design the data model" |

### Phase 2: Scope Assessment

If Phase 0 detected a project, use codebase size as a signal. Otherwise, estimate
from the prompt description alone and mark the estimate as uncertain.

| Scope | Heuristic | Orchestration (Cursor) |
|-------|-----------|-------------------------|
| TRIVIAL | Single file, < 50 lines | Agent mode, single pass, no subagents |
| LOW | Single component or module | Agent mode + one relevant Agent Skill (invoke with `/skill-name`) |
| MEDIUM | Multiple components, same domain | **Plan mode** brief plan, then Agent; invoke 1–2 skills via `/name`; verify with tests/lint |
| HIGH | Cross-domain, 5+ files | Plan mode for architecture + phased Agent tasks; optional **Task** `explore` readonly sweeps |
| EPIC | Multi-session, multi-PR, architectural shift | Plan mode + milestone prompts; optional **Task** `generalPurpose` per workstream; keep **AGENTS.md** / Rules updated |

### Phase 3: Cursor context matching

Map intent + scope + tech stack (from Phase 0) to **Cursor-native** levers: **Rules** (always-on), **AGENTS.md** (repo conventions), **Agent Skills** (invoke with `/skill-name`), **Plan vs Agent mode**, and **Task** subagents (`explore`, `generalPurpose`, reviewers) when parallel or isolated work helps.

#### By intent type

| Intent | Modes & tools | Typical skills (examples — pick what exists; user invokes with `/name` in Agent) |
|--------|---------------|------------------------------------------------------------------|
| New Feature | Plan → Agent; `/tdd` / `/tdd-workflow`; review pass | `tdd`, `tdd-workflow`, `coding-standards`, stack-specific skills |
| Bug Fix | Agent; failing test first | `tdd`, `triage` or `to-issues` (when turning findings into tracker work) |
| Refactor | Plan if seam unclear; Agent | `coding-standards`, `improve-codebase-architecture` |
| Research | Agent + **Task** `explore` readonly | `recursive-decomposition` or `council` for broad codebase scans |
| Testing | Agent | `tdd`, `tdd-workflow` |
| Review | Agent | Cursor's built-in `/review` skill when available; otherwise `web-design-guidelines` for UI audits and security-focused skills if installed |
| Documentation | Agent | Project conventions from AGENTS.md |
| Infrastructure | Plan for blast radius; Agent | `docker-patterns`, `postgres-patterns` |
| Design (UI) | Plan for IA; Agent | `frontend-design` |

#### By tech stack (suggest skills by name; user invokes with `/name`)

| Tech Stack | Skills to consider (slash-invoke in Agent) | Task subagent |
|------------|---------------------------------------------|---------------|
| Python / Django | `python-patterns`, `coding-standards`, domain skills if present | `code-reviewer` |
| Go | `golang`, `golang-pro`, `coding-standards` | `code-reviewer` |
| Spring Boot / Java | `coding-standards` | `code-reviewer` |
| Kotlin / Android | `coding-standards` | `code-reviewer` |
| TypeScript / React | `frontend-design`, `coding-standards` | `code-reviewer` |
| Swift / iOS | `coding-standards` | `code-reviewer` |
| PostgreSQL | `postgres-patterns` | `code-reviewer` |
| Other / Unlisted | `coding-standards` | `code-reviewer` |

### Phase 4: Missing Context Detection

Scan the prompt for missing critical information. Check each item and mark
whether Phase 0 auto-detected it or the user must supply it:

- [ ] **Tech stack** — Detected in Phase 0, or must user specify?
- [ ] **Target scope** — Files, directories, or modules mentioned?
- [ ] **Acceptance criteria** — How to know the task is done?
- [ ] **Error handling** — Edge cases and failure modes addressed?
- [ ] **Security requirements** — Auth, input validation, secrets?
- [ ] **Testing expectations** — Unit, integration, E2E?
- [ ] **Performance constraints** — Load, latency, resource limits?
- [ ] **UI/UX requirements** — Design specs, responsive, a11y? (if frontend)
- [ ] **Database changes** — Schema, migrations, indexes? (if data layer)
- [ ] **Existing patterns** — Reference files or conventions to follow?
- [ ] **Scope boundaries** — What NOT to do?

## User clarifications (Cursor)

When you need a **discrete decision** with a small set of clear options (about 2–6), prefer the **`AskQuestion`** tool so the user gets structured choices. Ask **one decision at a time** when this skill already sequences questions that way.

If **`AskQuestion`** is unavailable in the current environment, ask the same choices in ordinary chat (same options, same ordering).

Use **plain chat** (not forced multiple-choice) when the answer is inherently free-form—for example pasted logs, a paragraph describing a custom tracker workflow, or an open-ended design explanation.

**If 3+ critical items are missing**, ask the user up to 3 clarification
questions before generating the optimized prompt. Then incorporate the
answers into the optimized prompt.

### Phase 5: Workflow & model recommendation

Lifecycle framing (adapt labels to the user’s workflow):

```
Research → Plan → Implement (TDD) → Review → Verify → Commit
```

For **MEDIUM+** tasks, start in **Plan mode** (or an explicit planning subsection in the prompt) before large edits. For **EPIC** tasks, split across multiple chat sessions with clear handoff notes in **AGENTS.md** or the repo wiki.

**Model recommendation** (include in output — user picks in Cursor UI):

| Scope | Guidance |
|-------|----------|
| TRIVIAL–LOW | Default agent model; minimal planning |
| MEDIUM | Default or stronger coding model; Plan mode for ambiguous scope |
| HIGH | Stronger model for planning/architecture; default or fast model for mechanical edits if the user splits work |
| EPIC | Reserve strongest model for design/architecture prompts; use Task subagents or parallel chats for partitions |

**Multi-prompt splitting** (HIGH/EPIC):

- Prompt 1: Research + Plan (invoke relevant skills with `/name`; optional **Task** `explore` readonly)
- Prompt 2–N: One vertical slice per prompt; each ends with tests/lint/CI green
- Final prompt: integration checks + review against **Rules** / **AGENTS.md**
- Between sessions, rely on committed code + AGENTS.md updates rather than product-specific “save session” commands unless the user uses them

---

## Output Format

Present your analysis in this exact structure. Respond in the same language
as the user's input.

### Section 1: Prompt Diagnosis

**Strengths:** List what the original prompt does well.

**Issues:**

| Issue | Impact | Suggested Fix |
|-------|--------|---------------|
| (problem) | (consequence) | (how to fix) |

**Needs Clarification:** Numbered list of questions the user should answer.
If Phase 0 auto-detected the answer, state it instead of asking.

### Section 2: Recommended Cursor setup

| Type | Component | Purpose |
|------|-----------|---------|
| Mode | Plan mode | Architecture and sequencing before large edits |
| Skill | `/tdd` or `/tdd-workflow` | TDD methodology (invoke what exists) |
| Tool | Task (e.g. explore, readonly) | Parallel codebase investigation |
| Rules | Project + user Rules | Always-on constraints and stack defaults |
| File | AGENTS.md | Repo-specific agent instructions |
| Model | (user choice) | Match model tier to scope per Phase 5 |

### Section 3: Optimized Prompt — Full Version

Present the complete optimized prompt inside a single fenced code block.
The prompt must be self-contained and ready to copy-paste. Include:
- Clear task description with context
- Tech stack (detected or specified)
- When to use **Plan mode** vs **Agent mode**, and which Agent Skills to invoke with **`/skill-name`**
- When to spawn **Task** subagents (role + readonly + optional model)
- Acceptance criteria
- Verification steps (tests, lint, CI)
- Scope boundaries (what NOT to do)

For multi-session work, write: "Break into N prompts with handoff: …" and name the skills (`/name`) and files to re-read each time.

### Section 4: Optimized Prompt — Quick Version

A compact version for experienced Cursor users. Vary by intent type:

| Intent | Quick Pattern |
|--------|--------------|
| New Feature | `Plan: [feature]. /tdd → implement slice. Run tests/lint.` |
| Bug Fix | `/tdd — failing test for [bug] → fix → verify.` |
| Refactor | `Plan if needed. Refactor [scope]. Tests green.` |
| Research | `Task explore: [areas]. Summarize → Plan.` |
| Testing | `/tdd [module]. E2E for critical flows if configured.` |
| Review | `Reread Rules + AGENTS.md. Review diff against constraints.` |
| Docs | `Update docs paths […]. Match repo tone.` |
| EPIC | `Plan milestones M1…Mn. One PR per milestone; /skill-name per workstream as needed.` |

### Section 5: Enhancement Rationale

| Enhancement | Reason |
|-------------|--------|
| (what was added) | (why it matters) |

### Footer

> Not what you need? Tell me what to adjust, or make a normal task request
> if you want execution instead of prompt optimization.

---

## Examples

See [references/examples.md](references/examples.md) for trigger phrases and full before/after optimization examples.

---

## Related Cursor concepts

| Concept | When to reference |
|---------|-------------------|
| **Cursor Settings → Rules** | User lacks always-on constraints; suggest moving repeated guidance there |
| **AGENTS.md** | Repo-specific conventions missing from prompts |
| **Agent Skills (`/name`)** | User invokes installed skills from `~/.cursor/skills` or `.cursor/skills` by typing `/` in Agent; see [docs](https://cursor.com/docs/skills) |
| **Task tool** | Parallel readonly exploration (`subagent_type: explore`) or partitioned implementation |
| **find-skills** | User wants to discover or install new skills from the ecosystem |
