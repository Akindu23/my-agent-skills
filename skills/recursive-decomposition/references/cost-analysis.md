# Cost-Performance Analysis for Recursive Decomposition

Sub-delegate routing (roles, `model`, parallelism): [`../../council/references/task-workflow.md`](../../council/references/task-workflow.md).

This reference provides guidance on when recursive decomposition is cost-effective versus direct processing.

## Decision Framework

### Use direct processing when:

- Input < 30k tokens
- Task involves < 5 files
- Answer is localized to one section
- Latency is critical
- Simple lookup or single transformation

### Use recursive decomposition when:

- Input > 50k tokens
- Task spans 10+ files
- Information must be aggregated across sources
- Comprehensive analysis is required
- Quality matters more than speed

### Gray zone (30k-50k tokens):

- Consider task complexity
- Evaluate quality requirements
- Factor in time constraints
- Default to decomposition if unsure about completeness

## Cost Structure

### Direct processing

```text
Cost ≈ Input tokens × price per token
Latency = single turn / single broad read
Quality = Degrades with overloaded context
```

### Recursive decomposition

```text
Cost = (sum of sub-call tokens) + coordination overhead
Latency = max(sub-call latencies) + synthesis time
Quality = Maintains with proper chunking
```

## Break-Even Analysis

From RLM research:

**Token threshold:** ~50k tokens

- Below: direct processing is often cheaper
- Above: decomposition can maintain quality at comparable or lower total cost

**Quality threshold:** ~30k tokens

- Below: direct quality is often acceptable
- Above: context rot begins to hurt results

**Cost comparison (from paper):** RLM-style runs can be cost-competitive on hard multi-hop work versus naive long-window baselines; exact numbers depend on provider and model.

## Parallelization benefits

When sub-tasks are independent, parallel execution provides:

```text
Serial: T = t1 + t2 + t3 + ... + tn
Parallel: T = max(t1, t2, t3, ..., tn) + synthesis
```

Launching several Task/Agent subagents in one user message (when the work is parallelizable) approximates the parallel case; synthesis is still a separate merge step.

## Variance considerations

RLM approaches can show high variance in outlier cases:

**Median cost:** Often comparable to careful direct runs  
**Tail:** Can spike with redundant sub-calls or deep chains

Causes of high variance:

- Excessive sub-calling
- Redundant processing
- Deep recursion chains
- Inefficient chunking

Mitigations:

- Set sub-call budgets
- Track and deduplicate queries
- Limit recursion depth
- Monitor token usage

## Optimization strategies

### 1. Aggressive filtering

Filter most content before deep analysis:

```text
1000 files → Glob filter → 100 files
100 files → Grep filter → 20 files
20 files → detailed Read / analysis
```

### 2. Sampling for estimation

For aggregation, sample before exhaustive work:

```text
Sample 10% of items → estimate
If high confidence, extrapolate; else widen the sample
```

### 3. Early termination

For search: stop when the answer is found, verify, and avoid re-scanning the same scope.

### 4. Caching (within session)

For repeated questions over the same tree: reuse prior chunk summaries; invalidate on source change.

## Tool selection by cost-performance

| Scenario | Recommended approach |
| -------- | -------------------- |
| Find one file by name | **Glob** |
| Find a symbol / string | **Grep** |
| Understand one module | **Read** + follow imports |
| Analyze 5 related files | **Read** in batch with a plan |
| Pattern across codebase | **Grep** first; then Task/Agent with portable role `explore` for broad passes |
| Aggregate 50+ files | **Task** with partitions + synthesis |
| Multi-hop reasoning | Map-reduce with verification **Read** slices |

## Quality vs. cost tradeoff matrix

```text
                 Low cost              High cost
High quality  | Filtered decomp.  | Exhaustive decomp.
Low quality   | Direct (short)     | One giant read (context rot)
```

Aim for targeted decomposition: high quality without redundant breadth.
