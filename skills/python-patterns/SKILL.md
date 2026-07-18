---
name: python-patterns
description: >-
  Applies Python idioms, PEP 8 norms, typing, packaging, concurrency, tooling, and
  performance discipline to everyday Python code. Use when writing, reviewing,
  refactoring, or packaging Python; when the user names type hints, dataclasses, pytest,
  ruff/black/mypy, asyncio, concurrency, EAFP vs LBYL, or Python idioms; or asks for a
  Python-specific code-quality pass.
paths:
  - "**/*.py"
  - "**/pyproject.toml"
  - "**/requirements*.txt"
---

# Python development patterns

Idiomatic Python guidance for readability, correctness, tooling, and performance.
Examples target **Python 3.12+** (minimum baseline **3.10+**).

## When to activate

- Writing new Python modules, scripts, packages, or services
- Reviewing or refactoring Python code
- Choosing structure for tests, tooling, imports, errors, concurrency, or data classes

## Core principles (summary)

- **Readability** — obvious names and flow over cleverness; see [patterns-misc](references/patterns-misc.md#core-principles).
- **Explicit over implicit** — clear configuration and imports; minimize hidden side effects.
- **EAFP** — prefer `try` / specific exceptions when failure is exceptional; use `dict.get` for expected missing keys — see [patterns-misc](references/patterns-misc.md#core-principles).

## Reference index

| Topic | Open |
|--------|------|
| Type hints, `Protocol`, modern vs legacy typing | [references/typing.md](references/typing.md) |
| Threading, multiprocessing, async I/O | [references/async-concurrency.md](references/async-concurrency.md) |
| Layout, imports, formatters/linters, `pyproject.toml` | [references/packaging-tooling.md](references/packaging-tooling.md) |
| Memory, generators, hot-path micro-optimizations | [references/performance.md](references/performance.md) |
| Errors, context managers, comprehensions, dataclasses, decorators, idioms, anti-patterns | [references/patterns-misc.md](references/patterns-misc.md) |

Follow each reference for full examples and edge cases.
