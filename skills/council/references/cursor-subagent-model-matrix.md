# Cursor Task `model` matrix (Composer 2 family)

Use this when spawning the **Task** tool from Cursor. Set `model` explicitly on every Task call.

**Scope:** This table is for the Task tool’s **`model`** field (`composer-2` / `composer-2-fast`). It does **not** change plugin agent markdown under `plugins/**/agents/*.md` (`inherit`, `sonnet`, `haiku`, `fast`); those frontmatter values target other harnesses. In Cursor, you still pass Task `model` yourself.

## Verified slugs (Cursor Task)

Supported Composer 2 slugs for Task in current Cursor sessions: **`composer-2`** and **`composer-2-fast`**.

If a Task invocation fails validation on `model`, use only slugs accepted by that session’s Task schema (product updates may narrow the list).

## Decision rule

| Model | Use when |
|--------|----------|
| **`composer-2-fast`** | Partitionable, read-mostly, tool-heavy, or cheap to retry; parallel batch work. |
| **`composer-2`** | Multi-hop reasoning, high-stakes correctness, subtle judgment, or outputs that gate merges / security / data. |

## Non-`ce-*` Task types (built-in / other plugins)

| `subagent_type` (examples) | Default `model` | Notes |
|----------------------------|-----------------|--------|
| `explore` | `composer-2-fast` | Pair with `readonly: true` when read-only. |
| `shell` | `composer-2-fast` | If debugging unknown failures or ambiguous logs, use `composer-2`. |
| `generalPurpose` | `composer-2` | Use `composer-2-fast` only for tight prompts, tiny scope, trivial edits. |
| `cursor-guide` | `composer-2-fast` | Product / how-to; low blast radius. |
| `ci-watcher` | `composer-2-fast` | CLI / log workflow; synthesis of “next step” is light. |
| `docs-researcher` | `composer-2-fast` | Single-library Context7 pulls. Multi-lib / version ambiguity → `composer-2`. |
| `code-reviewer`, `typescript-reviewer`, `python-reviewer` | `composer-2` | Match user agents under `~/.cursor/agents/`. |
| `best-of-n-runner` | `composer-2` | If cost-sensitive: `n-1` × `composer-2-fast` + one `composer-2` final pass. |
| `agents-memory-updater` | `composer-2` | Durable memory edits; avoid `fast` unless input is heavily pre-filtered. |

## Compound Engineering (`ce-*`) — default Task `model`

### Tier A — default `composer-2-fast`

| Agent | Notes |
|-------|--------|
| `ce-coherence-reviewer` | Mechanical doc consistency; plugin uses `haiku` elsewhere — in Cursor Task use `fast`. |
| `ce-code-simplicity-reviewer` | Quick YAGNI-style pass. |
| `ce-schema-drift-detector` | Often diff- / schema-mechanical. |
| `ce-git-history-analyzer` | Log- and history-oriented survey. |
| `ce-issue-intelligence-analyst` | Structured issue patterns when scope is narrow. |
| `ce-learnings-researcher` | Grep-heavy institutional search. |
| `ce-session-historian` | Transcript search / correlation when scoped. |
| `ce-repo-research-analyst` | **`composer-2-fast`** when input uses `Scope:` with one or two phases; **`composer-2`** when no `Scope:` (full phases) or heavy onboarding. |

### Tier B — default `composer-2`

| Agent |
|-------|
| `ce-adversarial-document-reviewer` |
| `ce-adversarial-reviewer` |
| `ce-agent-native-reviewer` |
| `ce-api-contract-reviewer` |
| `ce-architecture-strategist` |
| `ce-best-practices-researcher` |
| `ce-cli-agent-readiness-reviewer` |
| `ce-cli-readiness-reviewer` |
| `ce-correctness-reviewer` |
| `ce-data-integrity-guardian` |
| `ce-data-migration-expert` |
| `ce-data-migrations-reviewer` |
| `ce-deployment-verification-agent` |
| `ce-design-implementation-reviewer` |
| `ce-design-iterator` |
| `ce-design-lens-reviewer` |
| `ce-dhh-rails-reviewer` |
| `ce-feasibility-reviewer` |
| `ce-framework-docs-researcher` |
| `ce-julik-frontend-races-reviewer` |
| `ce-kieran-python-reviewer` |
| `ce-kieran-rails-reviewer` |
| `ce-kieran-typescript-reviewer` |
| `ce-maintainability-reviewer` |
| `ce-performance-oracle` |
| `ce-performance-reviewer` |
| `ce-pr-comment-resolver` |
| `ce-previous-comments-reviewer` |
| `ce-product-lens-reviewer` |
| `ce-project-standards-reviewer` |
| `ce-reliability-reviewer` |
| `ce-scope-guardian-reviewer` |
| `ce-security-lens-reviewer` |
| `ce-security-reviewer` |
| `ce-security-sentinel` |
| `ce-slack-researcher` |
| `ce-spec-flow-analyzer` |
| `ce-swift-ios-reviewer` |
| `ce-testing-reviewer` |
| `ce-web-researcher` |

### Tier C — shape-dependent

| Agent | `composer-2-fast` | `composer-2` |
|-------|-------------------|--------------|
| `ce-ankane-readme-writer` | Small README edits | New gem-style README from scratch |
| `ce-pattern-recognition-specialist` | Duplication / naming drift scan | Architectural refactor proposals |
| `ce-figma-design-sync` | Single obvious token/class mismatch | Pixel workflow / multi-screen sync |

## Plugin `model:` vs Task `model`

| Location | Meaning |
|----------|---------|
| `*.agent.md` `model: inherit` | Parent or product default — **still set Task `model` in Cursor**. |
| `model: sonnet` / `haiku` / `fast` | Other products’ tiers — **map to** `composer-2` or `composer-2-fast` when calling Task from Cursor. |

Rough mapping: `haiku` / `fast` → prefer `composer-2-fast` when task is narrow; `sonnet`-pinned personas (e.g. web / lens / slack) → prefer `composer-2` for cross-source synthesis unless the prompt is a single fetch.
