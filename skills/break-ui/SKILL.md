---
name: break-ui
description: Worst-case data pass on a component or screen - realistic bad values behind a dev-only toggle, then a Broken / Ugly / Fragile report. Fixes only the ones you name.
disable-model-invocation: true
license: MIT
---

# Break UI

The UI was built against **kind data**: "Jane Doe, jane@acme.com, 12 members", every optional field filled. Your job is the **worst case**: the most annoying real user this component will ever meet, fed in one field at a time, then a report of what broke.

Every worst-case value is one a real user could produce, or the longest value the backend actually accepts. `aaaaaaaa…` and 5,000-character names prove nothing and get ignored. Long text is only the first break; the ones that ship are the short name, the missing avatar, "1 members", the empty list.

This skill breaks and reports. Layout options belong to `/prototype`.

## Invocation

| Typed | Run |
|-------|-----|
| `/break-ui <component or screen>` | Steps 1-5, then stop |
| `/break-ui <component> + fix` | Steps 1-5, then step 6 on every row outside **Decisions for you** |
| `fix all` / `fix 1, 3` after a report | Step 6 on the named rows |

## 1. Map the surface

Read the component and list every value it renders:

| Field | Source | Type | Limit | Optional? |
|-------|--------|------|-------|-----------|
| `name` | `member.name` | string | 255 (`schema.ts:14`) | No |
| `email` | `member.email` | string | unbounded | No |

Include the values people forget: header counts, relative timestamps, badge and status text, data-driven button labels, tooltips, avatar images, and the list length itself.

Take limits from the validation schema, DB migrations, API types, and form `maxLength`. A frontend limit shorter than the backend column is a finding: longer values arrive through imports and the API. No limit found → write `unbounded`, which is a finding too.

**Done when**: every rendered value has a row with a source and a limit or `unbounded`.

## 2. Build the worst case

Read [`references/CATALOG.md`](references/CATALOG.md) and pick values for each field from the rows that apply.

Write one worst-case fixture beside the existing demo data, shaped exactly like it (same type, same file conventions). It enters through the same boundary the demo data does: fixture, mock, props, or API stub. The component's markup and CSS stay untouched, so the test measures the component.

Spread failures across the rows on screen: row 1 the long name, row 2 the long email, row 3 the one-letter name, as real data mixes them. Add the cases one dataset cannot hold:

- **Empty** - zero items, the no-results state.
- **One** - a single item, every count at exactly 1.
- **Huge** - the realistic upper bound for list length (1,000+ rows when unpaginated).

**Done when**: every catalog row that fits a mapped field is in a fixture, and Empty, One, and Huge each have one (or a one-line reason they cannot apply).

## 3. Wire the toggle

A segmented control, **Demo / Worst case / Empty / One / 1,000 rows**, swapping the fixture at the data boundary.

- **Dev server** - a `?data=worst` URL param read where the fixture is chosen, on the route that already hosts the component (same placement rule as `/prototype` UI sub-shape A). The URL keeps the state across reloads. Gate it to the dev environment.
- **No project** - one self-contained HTML file with the component and every dataset inline.

Fixed bottom-center, plain chrome (gray track, white pill on the active segment, system font), instant switch.

**Done when**: every fixture is one click away and the toggle is dev-only.

## 4. Break it

Flip to each state and check it:

- at the component's **real container width**, then **320px**, then the **widest** layout it supports;
- at **200% browser zoom**;
- in **dark mode** and **RTL** (`dir="rtl"` on a wrapper) when the product supports them.

Read [`references/FIXES.md`](references/FIXES.md) and match what you see against its signatures. Screenshot only when the user asked for browser checks; otherwise reason from the CSS and the fixture, and mark each finding **seen** or **inferred**.

**Done when**: every fixture has been checked at every width and environment above, and every break has a signature, a cause, a fix, and `path:line`.

## 5. Report and stop

```markdown
### What broke
| # | Severity | Field | Worst-case value | What happens | Fix (`path:line`) |
|---|----------|-------|------------------|--------------|-------------------|
| 1 | Broken | `email` | `bartholomew.fitzgerald@northwind-industries-holdings.example.com` | Pushes the ••• menu off the row at 400px | `min-width: 0` on text column, `overflow-wrap: anywhere` on email - `MemberRow.tsx:42` |

### Decisions for you
- <field>: <option A> or <option B>. Recommend <pick>, because <reason>.

### What held up
- <worst case the component already handles>

Toggle: <URL or file path>, states <list>. Say `fix all` or `fix 1, 3`.
```

Severity, worst first: **Broken** (content unreadable, action unreachable, wrong data shown), **Ugly** (readable but visibly wrong), **Fragile** (fine now, one realistic step from breaking: no limit, no fallback). **Decisions for you** holds every break with more than one right answer (truncate or wrap, what an empty role shows, paginate or virtualize). A short report on a sturdy component is a good result.

**Done when**: the report is in chat, the toggle is still running, and you have stopped.

## 6. Fix on request

Apply only the named rows, with the project's existing conventions and design tokens. Flip every state again, Demo included, and confirm each fixed break is gone with no regression on kind data.

Keep the worst-case fixture as the regression set for the next change; the toggle stays dev-only. The user commits.

**Done when**: every named row is fixed and re-checked in every state, or reported as still broken with the reason.
