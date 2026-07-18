---
name: golang
description: Routes Go work to the right reference guides and conventions for the task. Use when working on Go architecture, implementation, refactoring, concurrency, error handling, testing, performance, or code review.
paths:
  - "**/*.go"
  - "**/go.mod"
  - "**/go.sum"
disable-model-invocation: true
---

# Go Skill

Target **Go 1.24+** / current stable unless the repo pins older. Prefer
`log/slog` for services and `testing/synctest` for tricky concurrency/time tests.

## When to Use
Use this as the entry point for Go work in this skill package. It routes to the right reference guides for the task.

- Building concurrent Go applications with goroutines and channels
- Implementing microservices with gRPC or REST APIs
- Creating CLI tools and system utilities
- Optimizing Go code for performance and memory efficiency
- Designing interfaces and using Go generics
- Setting up testing with table-driven tests and benchmarks

## Instructions
- Identify the dominant Go task (implementation, review, testing, design, or optimization).
- Always apply foundational style guidance first.
- Load **top-level** files under `references/` from the index below — one hop from this skill. Only open a nested `references/<topic>/` file when the parent reference explicitly points you there for that subtopic.
- Add one or more specialized reference guides based on task scope.
- For multi-domain requests, combine relevant guides and use `go-style-core` as the tiebreaker.
- Keep outputs concise and idiomatic to Go conventions.

## Base Skill (Always Include)

- `go-style-core` - Core style and formatting baseline.

## Subskill Index

### Foundations

- `go-style-core`: Core Go style principles and formatting.  
  Reference: [go-style-core](references/go-style-core.md)
- `golang-patterns`: Idiomatic Go patterns and maintainable conventions.  
  Reference: [golang-patterns](references/golang-patterns.md)

### Language Constructs

- `go-control-flow`: Idiomatic `if`, `for`, `range`, and `switch` usage.  
  Reference: [go-control-flow](references/go-control-flow.md)
- `go-data-structures`: Arrays, slices, maps, allocation, and constants.  
  Reference: [go-data-structures](references/go-data-structures.md)
- `go-interfaces`: Interfaces, assertions, type switches, and embedding.  
  Reference: [go-interfaces](references/go-interfaces.md)
- `go-generics`: Type parameters, constraints, and when to use or avoid them.  
  Reference: [go-generics](references/go-generics.md)
- `go-context`: `context.Context` propagation and cancellation patterns.  
  Reference: [go-context](references/go-context.md)

### API and Package Design

- `go-packages`: Package layout, imports, dependency management, and `init()` usage.  
  Reference: [go-packages](references/go-packages.md)
- `go-functional-options`: Optional configuration via functional options.  
  Reference: [go-functional-options](references/go-functional-options.md)
- `go-naming`: Idiomatic names for packages, types, methods, vars, and constants.  
  Reference: [go-naming](references/go-naming.md)

### Reliability and Safety

- `go-error-handling`: Error creation, wrapping, propagation, and handling flow.  
  Reference: [go-error-handling](references/go-error-handling.md)
- `go-defensive`: Boundary safety, copy semantics, cleanup, and robust defaults.  
  Reference: [go-defensive](references/go-defensive.md)
- `go-concurrency`: Goroutine lifecycle, channels, mutexes, and sync primitives.  
  Reference: [go-concurrency](references/go-concurrency.md)

### Quality and Maintainability

- `go-testing`: Table-driven tests, subtests, helpers, and test doubles.  
  Reference: [go-testing](references/go-testing.md)
- `go-code-review`: Go-focused review checklist mapped to best practices.  
  Reference: [go-code-review](references/go-code-review.md)
- `go-documentation`: Package/type/function docs and runnable examples.  
  Reference: [go-documentation](references/go-documentation.md)
- `go-linting`: Linter selection and `golangci-lint` configuration guidance.  
  Reference: [go-linting](references/go-linting.md)

### Performance

- `go-performance`: Hot-path tuning, allocation hints, and profile-guided builds.  
  Reference: [go-performance](references/go-performance.md)

## Quick Task-to-Skill Mapping

- Concurrency bugs, worker pools, channel design -> `go-concurrency`, `go-context`, `go-error-handling`
- API constructor with many optional fields -> `go-functional-options`, `go-naming`, `go-packages`
- Refactor for readability and idioms -> `go-style-core`, `golang-patterns`, `go-control-flow`
- Generic algorithms or containers -> `go-generics`, `go-interfaces`, `go-style-core`
- Production hardening -> `go-defensive`, `go-error-handling`, `go-testing`
- Performance tuning -> `go-performance`, `go-data-structures`, `go-concurrency`
- Go PR review -> `go-code-review`, `go-testing`, `go-linting`, `go-documentation`

## Composition Rules

- Combine subskills when a request spans multiple concerns.
- Prefer explicit error handling and readable control flow over clever shortcuts.
- Keep public APIs stable and clearly documented.
- Validate recommendations against real constraints (latency, throughput, readability, safety).
