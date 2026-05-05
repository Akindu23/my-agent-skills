# Example: Codebase-Wide Error Handling Analysis

This example shows recursive decomposition for analyzing error handling patterns across a large codebase.

## Task

"Analyze all error handling patterns in this codebase and provide a comprehensive report on consistency, gaps, and recommendations."

## Decomposition strategy

### Phase 1: Filter and identify (low structural complexity)

```text
Step 1: Relevant file types
- Glob("**/*.ts") → 450 files
- Glob("**/*.tsx") → 120 files
- Total: 570 files

Step 2: Error-related code
- Grep("catch|throw|Error|exception", type="ts") → 89 files
- Grep for try/catch and .catch( patterns
- Union: 102 unique files with error handling
```

### Phase 2: Partition for parallel processing

```text
By module, for example:
- src/api/* → Batch A
- src/services/* → Batch B
- src/components/* → Batch C
- src/utils/* → Batch D
- other → Batch E
```

### Phase 3: Launch parallel **Task** subagents

```text
Task(
  subagent_type="explore",
  readonly=true,
  prompt="Analyze error handling under src/api/* ... return structured findings."
)
# Repeat for B–E; issue Task calls in parallel in one user message when the runner supports it.
```

Use `subagent_type: explore` and `readonly: true` for read-only surveys; use `generalPurpose` if a subagent must edit or run multi-step local automation.

### Phase 4: Aggregate results

```text
Merge findings from all batches: patterns, error types, propagation, gaps
```

### Phase 5: Synthesize report

```text
Unify taxonomies, list inconsistencies, and recommendations
```

### Phase 6: Verify with spot checks

```text
- **Read** a few key files in narrow ranges to confirm claims
- **Grep** to confirm a representative pattern is really widespread
```

## Expected output structure

```markdown
# Error Handling Analysis Report

## Executive Summary
- 102 files contain error handling logic
- N main error categories
- Gaps and recommendations

## Error Type Taxonomy
### API (src/api/)
…

## Pattern analysis
…

## Recommendations
…
```

## Metrics (illustrative)

- **Files targeted:** 102
- **Sub-agents (Task):** 5 in parallel, read-only
- **Tokens** spread across sub-runs instead of one 150k window
- **Quality:** Higher than one overloaded pass with the same file count
