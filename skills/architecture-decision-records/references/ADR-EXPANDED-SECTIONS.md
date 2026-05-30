# ADR Expanded Sections (optional)

Add these only when the default **Rationale** prose is not enough — for example, many alternatives, compliance-heavy consequences, or active supersession chains.

## Status

```markdown
**Status**: proposed | accepted | deprecated | superseded by ADR-NNNN
```

Or in frontmatter: `status: accepted`

## Deciders

Who participated in or owns the decision (roles or names).

```markdown
**Deciders**: [team, role, or person]
```

## Considered Options

Use when rejected paths are worth preserving in structured form.

```markdown
## Considered Options

### Option A: [Name]
- **Pros**: …
- **Cons**: …
- **Why not**: …

### Option B: [Name]
- **Pros**: …
- **Cons**: …
- **Why not**: …
```

## Consequences

Use when downstream effects are non-obvious.

```markdown
## Consequences

### Positive
- …

### Negative
- …
```

## Risks

```markdown
## Risks
- [risk] — mitigation: …
```

## Supersedes / Superseded by

When replacing or replaced by another ADR:

```markdown
**Supersedes**: [ADR-0003](0003-old-choice.md)
**Superseded by**: [ADR-0012](0012-new-choice.md)
```

Always update both ADRs and set status to `superseded` on the old record.
