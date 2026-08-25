# Example: Multi-Document Feature Aggregation

Sub-delegate routing (roles, `model`, parallelism): [`../../council/references/task-workflow.md`](../../council/references/task-workflow.md).

This example shows recursive decomposition for extracting and aggregating information across many documents.

## Task

"What features are planned across all our PRD documents? Create a consolidated feature roadmap."

## Decomposition strategy

### Phase 1: Discover documents

```text
Glob for PRD paths (e.g. **/PRD*.md, **/prd-*.md, docs/product/*.md)
Deduplicate → N unique files

Assess total size (line counts, rough token estimate)
If large → decompose; do not load all at once
```

### Phase 2: Categorize documents

```text
Quick pass on titles / first sections: quarter, area, archived or not
Exclude archived if intended
```

### Phase 3: Define extraction schema

```text
Per document, extract: product area, features, priority, status, quarter, dependencies, …
(Keep schema consistent so synthesis is machine-friendly.)
```

### Phase 4: Parallel extraction

```text
Partition by time bucket, product line, or folder so chunks are independent.

For each batch:
Task(  # or Agent — per task-workflow.md
  role="explore",
  readonly=true,  # Claude: Explore / Plan / permissionMode plan
  prompt="Read these files [list]. Extract to schema: … Return JSON per doc."
)
```

### Phase 5: Aggregate and deduplicate

```text
Merge feature lists, merge near-duplicates across PRDs, preserve provenance
```

### Phase 6: Build dependency graph (if needed)

```text
From extracted dependencies, build edges; identify critical path
```

### Phase 7: Generate consolidated roadmap

```text
Stitch a human-readable roadmap with quarters, priorities, and cross-links
```

### Phase 8: Verification

```text
- **Read** a few **Read**+limit slices in cited PRDs to spot-check
- Re-run **Grep** on distinctive phrase if a claim is surprising
```

## Expected output (shape)

```markdown
# Consolidated feature roadmap

## Summary
- N PRDs analyzed, M unique features, …

## Feature matrix
| Feature | … |

## By product area
…

## Risks
…
```

## Metrics (illustrative)

- **Documents processed:** 16
- **Features after dedup:** 38
- **Parallel Task batches:** 4
- **Pattern:** map-reduce + verification on focused **Read** ranges
