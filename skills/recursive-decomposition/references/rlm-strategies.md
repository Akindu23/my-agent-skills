# RLM Decomposition Strategies - Detailed Reference

Sub-delegate routing (roles, `model`, parallelism): [`../../council/references/task-workflow.md`](../../council/references/task-workflow.md).

This reference contains detailed strategies derived from the Recursive Language Models paper (Zhang, Kraska, Khattab, 2025).

## The Context Rot Problem

As context length increases, model performance degrades ("context rot"). This manifests as:

- Decreased accuracy on information retrieval
- Missed details in long documents
- Hallucinated connections between distant content
- Degraded reasoning over large evidence sets

RLM strategies bypass context rot by keeping the active context window small while accessing larger datasets programmatically.

## Emergent Decomposition Behaviors

The RLM research identified these naturally emerging strategies in capable models:

### 1. Code-Based Filtering

Models use programmatic filtering to narrow search spaces:

```python
# Example: Finding relevant config files
import re

# Use regex to filter before deep analysis
config_pattern = r"(database|connection|auth)"
relevant_files = [f for f in all_files if re.search(config_pattern, f.content)]
```

**Application in the agent (Cursor):**

- Use **Grep** with regex before reading full files; use **Glob** to scope file sets.
- Chain filters: file type → keyword → deeper **Read** with `offset` / `limit` on narrow ranges.

### 2. Divide-and-Conquer Chunking

Observed chunking strategies:

**Uniform chunking:**

```text
Split 1000-line file into 10 chunks of 100 lines
Process each chunk independently
Merge results with overlap handling
```

**Semantic chunking:**

```text
Identify natural boundaries (functions, classes, sections)
Each chunk = one logical unit
Preserve unit integrity over size uniformity
```

**Keyword-based partitioning:**

```text
Group items by shared characteristics
All error-related code → Chunk A
All API definitions → Chunk B
Process each category with a focused sub-task
```

### 3. Recursive Self-Invocation Patterns

**Single-level recursion (most common):**

```text
Main agent
├── Subtask 1 (Chunk A) - e.g. Task/Agent (portable role: explore)
├── Subtask 2 (Chunk B)
└── Subtask 3 (Chunk C)
    └── Synthesize results
```

**Multi-level recursion (complex tasks):**

```text
Main agent
├── Subtask 1
│   ├── Deeper subtask 1a
│   └── Deeper subtask 1b
└── Synthesize hierarchically
```

(Use **Task** or **Agent** with a portable role from task-workflow.md above; when only reading, use read-only semantics - and cap recursion depth.)

### 4. Verification Through Re-Query

Mitigate context rot in verification:

```text
Step 1: Generate answer from large context
Step 2: Extract claimed evidence locations
Step 3: Re-read only those specific locations (Read with tight offset/limit)
Step 4: Verify answer against fresh, focused context
Step 5: If mismatch, investigate the discrepancy
```

### 5. Variable-Based Output Construction

For outputs exceeding comfortable generation limits:

```text
# Instead of generating 10,000 words at once:
section_1 = generate("Write introduction...")
section_2 = generate("Write methodology...")
# Stitch with coherence
full_output = stitch_with_transitions([section_1, section_2, ...])
```

## Cursor / agent constraints

To keep work reliable in a typical agent environment (chunked **Read**, **Grep** / **Glob**-first, **Task** for subagents):

- **Code processing limit**: On the order of ~2,000 lines. Files larger than this should not be read in one go; use **Grep** and **Read** with `offset` and `limit`.
- **PDF size limit**: Very large PDFs (e.g. ~30MB+ or 100+ pages) should not be loaded as a single wall of text; use page-range or metadata strategies or dedicated tools.
- **Text file per read**: **Read** in bounded chunks; ~50KB in one `limit` is a practical ceiling before chunking further.
- **Effective reasoning width**: Decomposition often helps when the *working* set would exceed a comfortable "reasoning band" (often thought of in the low tens of thousands of tokens) even if a larger window is technically available.

## Task Complexity Classification

### Constant Complexity (O(1))

- Single needle in haystack
- Finding one specific item
- Strategy: Binary search filtering

### Linear Complexity (O(n))

- Must examine all items once
- Aggregation, counting, summarization
- Strategy: Map-reduce with chunking

### Quadratic Complexity (O(n²))

- Pairwise comparisons needed
- Finding relationships between items
- Strategy: Blocked pairwise with sampling

### Logarithmic Complexity (O(log n))

- Hierarchical search
- Finding in sorted/structured data
- Strategy: Divide and conquer

## Model-Specific Observations

From the RLM paper:

**Conservative models (e.g., some frontier models under conservative settings):**

- Fewer, more targeted sub-calls
- Better cost efficiency
- May miss edge cases

**More aggressive or tool-heavy settings:**

- More sub-calls, sometimes redundant
- More thorough coverage
- Higher variance in cost

**Optimization:** Adjust decomposition granularity. More conservative chunking for aggressive over-calling; more coverage passes for under-exploring settings.

## Failure Modes and Mitigations

### Infinite Recursion

**Problem:** Sub-tasks keep spawning more sub-tasks.  
**Mitigation:** Set explicit depth limits; verify chunk sizes actually shrink.

### Redundant Processing

**Problem:** Same content processed multiple times.  
**Mitigation:** Track processed segments; deduplicate before synthesis.

### Context Loss

**Problem:** A subagent lacks the context for its piece of work.  
**Mitigation:** Pass minimal but sufficient path lists, module names, and success criteria in each **Task** prompt.

### Synthesis Errors

**Problem:** Aggregated results contain contradictions or gaps.  
**Mitigation:** Verification pass; spot-check against source.

## Performance Benchmarks (from paper)

| Task Type | Direct model | RLM approach | Improvement |
| --------- | ------------ | ------------ | ----------- |
| Multi-hop QA (6-11M tokens) | 70% | 91% | +21% |
| Linear aggregation | Baseline | +28-33% | Significant |
| Quadratic reasoning | <0.1% | 58% | Large |
| Context scaling | 2^14 tokens | 2^18 tokens | 16x |

## When NOT to Use Recursive Decomposition

- Tasks with <10k tokens of input
- Single-file operations
- Questions answerable from one location
- Time-critical operations where latency matters more than completeness
- Tasks where coordination overhead exceeds the benefit

## Credits

See the main **Credits** in `../SKILL.md` for the upstream repository and the RLM paper link.
