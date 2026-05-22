---
name: recursive-decomposition
description: >-
  Based on Recursive Language Models (RLM) research (Zhang, Kraska, Khattab, 2025), this
  skill guides handling tasks that exceed comfortable context limits through programmatic
  decomposition and recursive sub-inquiry. Triggers on phrases like "analyze all files",
  "process this large document", "aggregate information from", "search across the
  codebase", or work spanning 10+ files or 50k+ tokens.
---

# Recursive Decomposition Guidelines

## References

Consult these resources as needed:

- ./references/rlm-strategies.md — Detailed decomposition patterns from the RLM paper
- ./references/cost-analysis.md — When to apply recursive vs. direct approaches
- ./references/codebase-analysis.md — Full walkthrough of codebase-wide analysis
- ./references/document-aggregation.md — Multi-document information extraction
- ./references/task-model-summary.md — Task `model` (enum probe + Composer priority) when using **Task** subagents
- ./references/cursor-task-workflow.md — full Task workflow (enum probe, parallelism, anti-patterns)

## Core Principles

**CRITICAL: Treat inputs as environmental variables, not immediate context.**

Most tasks fail when context is overloaded. Instead of loading entire contexts into the processing window, treat inputs as **environmental variables** accessible through tools. Decompose problems recursively, process segments independently, and aggregate results programmatically.

**Progressive disclosure**: Load information only when necessary. Start high-level to map the territory, then dive into specific areas.

### When Recursive Decomposition is Required

- Tasks involving 10+ files
- Input exceeding ~50k tokens where single-prompt context is insufficient
- Multi-hop questions requiring evidence from multiple scattered sources
- Codebase-wide pattern analysis or migration planning

### When Direct Processing Works

- Small contexts (<30k tokens)
- Single file analysis
- Linear complexity tasks with manageable inputs

## Operational Rules

- Always identify the search space size first.
- Always use **Grep** or **Glob** before **Read** when exploring directories or unknown scope.
- Always partition lists of more than 10 items into batches.
- Never read more than 5 files into context without a specific plan (batch reads with a plan first).
- Verify synthesized answers by spot-checking source material.
- Mitigate "context rot" by verifying answers on smaller windows.
- **Treat yourself as an autonomous agent, not just a passive responder.**

## Large File Handling Protocols

**CRITICAL**: Do not read large files fully into context in one call.

1. **Check size first**: Use **Shell** for `wc -l` (lines) or `ls -lh` (size) when size is unknown.
2. **Hard limits**:
   - **Text / code**: More than 2,000 lines or 50KB → **must** use **Read** with `offset` and `limit` (or chunk via Shell `head` / `tail` when appropriate).
   - **PDFs**: More than 30MB or 100 pages → must split, use metadata, or a dedicated pipeline (e.g. pdf skill / tooling), not a single full read.
3. **Strategy**:
   - For code: find definitions first (**Grep** for `function`, `class`, symbols) then read specific ranges with **Read** + `offset` / `limit`.
   - For long text: read the table of contents, abstract, or section headers first.

## Tool Preferences

- **Grep** and **Glob** (not ad-hoc `ls -R`) unless you are only mapping top-level structure.
- **Read** with `path`, `offset`, and `limit` for large files — not full-file reads of huge files.
- **Shell** for `wc -l` / `ls -lh` before reading unknown large files; prefer **Grep** / **Glob** for search over reading everything.
- For searching code or log content, prefer **Grep** over reading entire files.

## Sub-agents: **Task** in Cursor

Use the **Task** tool for independent segments (read-only sweeps, parallel batches, or work that should stay isolated).

- Set **`subagent_type`** explicitly: e.g. `explore` for read-only codebase survey passes; `generalPurpose` when edits or multi-step work is needed; other subagent types (e.g. `shell`, `code-reviewer`) when they match the job.
- Use **`readonly: true`** when the subagent must not write files; omit or set `false` when it should implement changes.
- Prefer **depth limits** and **non-overlapping partitions** to avoid redundant sub-calls.
- **Parallel work**: when launching multiple subagents, use **one message with several Task calls** (the usual pattern) so independent partitions run together when appropriate; then synthesize results.
- **Task `model`**: probe enum → pick per `./references/task-model-summary.md`; full workflow in `./references/cursor-task-workflow.md`.

## Empowering Agentic Behavior

To maximize effectiveness:

- **Self-correction**: Always verify your own work. If a result seems empty or wrong, debug the approach (e.g. check Grep pattern or path) before giving up.
- **Aggressive context management**: Do not let the context window fill with dead ends; favor narrow reads after Glob/Grep.
- **Plan first**: For any task of more than 3 steps, write a short plan.
- **Safe "YOLO" mode**: For read-only searches, proceed with confidence without asking for permission on every small step; still stop for destructive or high-risk actions.

## Cost-Performance Tradeoffs

- **Smaller contexts**: Direct processing may be more efficient.
- **Larger contexts**: Recursive decomposition becomes necessary.
- **Threshold**: Consider decomposition when inputs exceed ~30k tokens or span 10+ files.

Balance thoroughness against computational cost. For time-sensitive tasks, apply aggressive filtering. For comprehensive analysis, prefer thorough decomposition with deduplication.

## Anti-Patterns to Avoid

- **Excessive sub-calling**: Avoid redundant subagents over the same content.
- **Premature decomposition**: Simple tasks do not need recursive strategies.
- **Lost context**: Ensure sub-tasks have enough local context; pass paths, module names, or file lists with each **Task** prompt.
- **Unverified synthesis**: Always spot-check aggregated results.

## Scalability (Chunking and filtering)

### 1. Filter Before Deep Analysis

Narrow the search space before detailed processing:

```text
Instead of reading all files into context:
1. Use Grep/Glob to list candidate files by pattern
2. Filter candidates with domain-specific keywords
3. Deeply analyze only the filtered subset
```

Apply domain terminology in filters. For code, filter by function names, imports, or error patterns before full file reads.

### 2. Strategic Chunking

Partition inputs for parallel or sequential sub-processing:

- **Uniform chunking**: By line count, character count, or natural boundaries (paragraphs, functions, files).
- **Semantic chunking**: By logical units (classes, sections, topics).
- **Keyword-based partitioning**: Group by shared characteristics.

Process each chunk independently, then synthesize.

### 3. Incremental Output Construction

For long outputs:

```text
1. Break output into logical sections
2. Generate each section independently
3. Store intermediate results in memory or files
4. Stitch sections together with coherence checks
```

## Agent Behavior

### Recursive Sub-Queries

Invoke subagents via **Task** for independent segments:

```text
For large analysis:
1. Partition the problem into independent sub-problems
2. Launch Task subagents per partition (parallel in one user turn when possible)
3. Collect and synthesize their results
4. Verify the synthesized answer if needed
```

### Answer Verification

Mitigate context degradation by checking answers on smaller windows:

```text
1. Generate candidate answer from the broad analysis
2. Extract the minimal evidence locations to verify
3. Re-read only those places with Read + tight limits
4. If mismatch, re-analyze the disputed slice only
```

# Implementation Patterns

## Pattern A: Codebase analysis

**Task:** "Find all error handling patterns in the codebase"

**Approach:**

1. Glob for relevant file types (`*.ts`, `*.py`, etc.).
2. Grep for error-related keywords (`catch`, `except`, `Error`, `throw`).
3. Partition matching files into batches of 5–10.
4. Launch parallel **Task** subagents with `subagent_type: explore` and `readonly: true` per batch.
5. Aggregate into a categorized summary; spot-check a few files.

## Pattern B: Multi-document QA

**Task:** "What features are mentioned across all PRD documents?"

**Approach:**

1. Glob document files (`*.md`, `*.txt` under `/docs`).
2. For each document or batch, extract feature mentions (subagent or focused Read).
3. Aggregate, deduplicate, categorize.
4. Verify completeness with spot checks.

## Pattern C: Information aggregation

**Task:** "Summarize all TODO comments in the project"

**Approach:**

1. Grep for `TODO` / `FIXME` / `HACK` patterns.
2. Group by file or module.
3. Process each group to extract context and implied priority.
4. Synthesize into a prioritized list; verify with samples.

## Credits

- **Upstream skill / plugin** (MIT): [massimodeluisa/recursive-decomposition-skill](https://github.com/massimodeluisa/recursive-decomposition-skill)
- **RLM paper** (Recursive Language Models): [arXiv:2512.24601](https://arxiv.org/abs/2512.24601) — Zhang, Kraska, Khattab (2025)
- Migrated and adapted for Cursor (Read / Grep / Glob / Shell / **Task** terminology) from the upstream `recursive-decomposition` plugin skill; references aligned to agent-environment constraints.
