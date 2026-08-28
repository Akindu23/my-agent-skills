---
name: go-generics
description: Go type parameters - when generics reduce duplication, when to prefer interfaces or code generation, and common constraints. Use when introducing or reviewing generic APIs, containers, or algorithms.
---

# Go Generics (Type Parameters)

Go 1.18+ adds **type parameters** so you can write functions and types that work
over many concrete types while staying type-safe. Official overview:
[Go Generics Tutorial](https://go.dev/doc/tutorial/generics) and language
changes in [Go 1.18 release notes](https://go.dev/doc/go1.18#generics).

---

## When Generics Help

- **Algorithms on many types** - `Min`, `Contains`, ordered maps keyed by
  comparable types, generic `Set[T]`, `Option[T]`-style helpers, without
  `interface{}` and type assertions everywhere.
- **Data structures** - a single `Tree[K,V]` or `List[T]` implementation where
  `T` or `K` varies but the structure is identical.
- **Safety at compile time** - callers get errors when they pass the wrong type,
  not failures at runtime.

## When to Avoid or Prefer Alternatives

- **Only one or two concrete types** - duplication is small; copy-paste or a
  tiny shared helper may be clearer.
- **Behavior varies by type** - an **interface** with different methods per
  implementation often reads better than type-parameter constraints that fight
  the type system.
- **Reflection or `unsafe` would be required** - generics do not replace those;
  keep the non-generic boundary explicit.

---

## Constraints

A **constraint** is an interface that limits which types can substitute a type
parameter.

- **`comparable`** - types that work with `==` and `!=` (maps keys, many generic
  containers). Built-in: only constraint that is not an ordinary interface.
- **`cmp.Ordered`** - ordered types (`<`, `>`, etc.) for sorting/min/max style
  APIs; from [`cmp`](https://pkg.go.dev/cmp).
- **Custom interfaces** - e.g. `type Stringer interface { String() string }` as
  a constraint when you need methods.

```go
func Min[T cmp.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

func Keys[K comparable, V any](m map[K]V) []K {
    out := make([]K, 0, len(m))
    for k := range m {
        out = append(out, k)
    }
    return out
}
```

Prefer **small constraints** - the smallest interface or union of capabilities
your code actually uses.

---

## See Also

- **golang-patterns** - API shape, including accept-interfaces / return-concrete
  defaults.
- **go-interfaces** - when behavior-based abstraction beats type parameters.
- **go-style-core** - naming and clarity for exported generic APIs.
