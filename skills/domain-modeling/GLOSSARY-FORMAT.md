# GLOSSARY.md Format

Legacy `CONTEXT.md` / `CONTEXT-MAP.md` take the same format; [SKILL.md](./SKILL.md) (File structure) says which name to write.

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only include terms specific to this project's context.** General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.
- **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.

## Single vs multi-context repos

**Single context (most repos):** One `GLOSSARY.md` at the repo root.

```
/
├── GLOSSARY.md
├── docs/adr/
└── src/
```

**Multiple contexts:** A `GLOSSARY-MAP.md` at the repo root lists the contexts, where they live, and how they relate. That file is the layout.

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                 ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/         ← context-specific decisions
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

Map shape:

```md
# Glossary Map

## Contexts

- [Ordering](./src/ordering/GLOSSARY.md) - receives and tracks customer orders
- [Billing](./src/billing/GLOSSARY.md) - generates invoices and processes payments
- [Fulfillment](./src/fulfillment/GLOSSARY.md) - manages warehouse picking and shipping

## Relationships

- **Ordering → Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment → Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering ↔ Billing**: Shared types for `CustomerId` and `Money`
```

Paths in the map follow the repo: `src/<context>/` or `packages/<name>/`, whichever is the package root.

### Which layout

- If `GLOSSARY-MAP.md` exists, read it and write that context's `GLOSSARY.md`. If which context is unclear, ask (structured MCQ if the session has `AskQuestion` / `AskUserQuestion`).
- If only a root `GLOSSARY.md` exists, single context.
- If neither exists, create a root `GLOSSARY.md` when the first term is resolved.

**Monorepo first write.** Offer a per-package glossary only when exploration found real multi-package signals (`pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or populated `packages/*` with its own `src/`). Their absence is single-context - do not ask. When signals are present, ask once: whole repo vs this package. This package → write `GLOSSARY-MAP.md` plus `<package-root>/GLOSSARY.md`. Whole repo → root `GLOSSARY.md`.

**Promote.** When a resolved term belongs to a second bounded context, ask. On yes: write `GLOSSARY-MAP.md`, place this term in that context's `GLOSSARY.md`, and move the existing root glossary onto its context path (ask which context it belongs to). Leave system-wide ADRs in `docs/adr/`.