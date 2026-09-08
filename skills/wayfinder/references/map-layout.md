# Map layout

Load when creating `work/<feature-slug>/map.md` or a new `issues/` child. If `.scratch/` still has tracker files, migrate into `work/` (same layout) before writing a new map.

## Map body

```markdown
## Destination

<what reaching the end of this map looks like - the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index - one line per resolved ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->
<!-- when an ADR was accepted for that answer, keep the ticket link and add the ADR path - dual links, not replacement -->

- [<resolved ticket title>](link) - <one-line gist of the answer>
- [<resolved ticket title>](link) - <gist> · [ADR-NNNN](docs/adr/NNNN-slug.md)

## Not yet specified

<!-- in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- work ruled beyond the destination; resolved, never graduates -->
```

## Ticket fence

Each ticket is `issues/NN-<slug>.md` (numbered from `01`). `Type:` is `research` / `prototype` / `grilling` / `task`. Add `Blocked by: NN, NN` under `Type:` in the wiring pass when it has blockers.

```markdown
Type: grilling

## Question

<the decision or investigation this ticket resolves>
```
