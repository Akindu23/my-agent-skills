---
name: wayfinder
description: Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets on your issue tracker, and resolve them one pass at a time until the way is clear. After each ticket close in Work through the map, may Continue / Handoff / Stop (soft context bias). On ticket close, may offer ADRs (promotion into docs/adr/) when ADR-POLICY criteria hold.
---

A loose idea has arrived — too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **shared map** on the repo's issue tracker, then works its **decision tickets** — questions whose resolution is a decision, not slices of a build to execute — one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting — it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic — engineering work, course content, whatever fits the shape.

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session — field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

Ask **one decision at a time** when this skill already sequences questions that way.

## Plan, don't do

Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear — nothing left to decide before someone goes and does the thing. The pull to just do the work is usually the signal you've reached the edge of the map and it's time to hand off. An effort can override this in its **Notes** — carrying execution into the map itself — but absent that, produce decisions, not deliverables.

**ADRs are promotion, not deliverables.** Closing a ticket records the answer on the tracker (resolution comment + Decisions-so-far gist). When that answer meets ADR-POLICY criteria, **offer** an ADR so durable project law lives in `docs/adr/` — the map stays the effort index, not a second copy of the ruling. Never delete or rewrite away a ticket because an ADR was written; tickets remain the debate trail.

## Refer by name

Every map and ticket is an issue, so it has a **name** — its title. In everything the human reads — narration, the map's Decisions-so-far — refer to it by that name, never by a bare id, number, or slug. A wall of `#42, #43, #44` is illegible; names read at a glance. The id and URL don't vanish — a name wraps its link — but they ride *inside* the name, never stand in for it.

## The Map

The map is a single issue on this repo's issue tracker, labelled `wayfinder:map` — the canonical artifact. Its tickets are child issues of the map.

The map is an **index**, not a store. It lists the decisions made and points at the tickets that hold their detail; the effort answer lives on the ticket — so the map never restates it, only gists it and links. When an answer is promoted to an ADR, `docs/adr/` holds durable project law; the map dual-links that ADR without becoming a second copy of the ruling.

**Where the map, its child tickets, blocking, and frontier queries physically live is tracker-specific.** If `docs/agents/issue-tracker.md` exists, consult its "Wayfinding operations" section. Otherwise default to the local-markdown tracker under `work/<feature-slug>/` (see `/setup-work`'s `issue-tracker-local.md`). Run `/setup-work` only when you need a non-default tracker recorded.

### The map body

The whole map at low resolution, loaded once per session. Open tickets are **not** listed — they are open child issues, found by query.

```markdown
## Destination

<what reaching the end of this map looks like — the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->
<!-- when an ADR was accepted for that answer, keep the ticket link and add the ADR path — dual links, not replacement -->

- [<closed ticket title>](link) — <one-line gist of the answer>
- [<closed ticket title>](link) — <gist> · [ADR-NNNN](docs/adr/NNNN-slug.md)

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
```

### Tickets

Each ticket is a **child issue** of the map; the tracker's issue id is its identity. Its body is the question, sized to one 100K token agent session:

```markdown
## Question

<the decision or investigation this ticket resolves>
```

Each ticket carries a `wayfinder:<type>` label — one of `research`, `prototype`, `grilling`, `task` (see [Ticket Types](#ticket-types)).

A session **claims** a ticket by assigning it to the dev driving the map, **first**, before any work, so concurrent sessions skip it. That assignee _is_ the claim: an open, unassigned ticket is unclaimed.

Blocking uses the tracker's **native** dependency relationship — essential because it renders the frontier _visually_ in the tracker's own UI, so the human sees what's takeable without opening the map. Only a tracker that lacks native blocking falls back to a body convention. A ticket is **unblocked** when every ticket blocking it is closed; the **frontier** is the open, unblocked, unclaimed children — the edge of the known.

The answer isn't part of the body — it's recorded on resolution (see [Work through the map](#work-through-the-map)). Assets created while resolving a ticket are linked from the issue, not pasted in.

## Ticket Types

Every ticket is either **HITL** — human in the loop, worked *with* a human who speaks for themselves — or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).

- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by `/research` (background Task). Use when knowledge outside the current working directory is required.
- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to — an outline, a rough take, a stub, or UI/logic code via the /prototype skill. Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
- **Grilling** (HITL): Conversation via the /grilling and /domain-modeling skills (frontier rounds per `/grilling`). The default case. While resolving a wayfinder ticket, `/domain-modeling` still updates `CONTEXT.md` live, but **defer ADR offers** to ticket close under this skill (`Captured via: wayfinder`). Standalone `/grill-with-docs` or `/domain-modeling` sessions are unchanged.
- **Task** (HITL or AFK): Manual work that must happen before a *decision* can be made — nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that *does* rather than decides — and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.

## Fog of war

The map is _deliberately_ incomplete: don't chart what you can't yet see. Beyond the live tickets lies the **fog of war** — the dim view of decisions and investigations you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's now specifiable into fresh tickets — one at a time, until the way to the destination is clear and no tickets remain.

The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later. It's the undiscovered frontier _toward_ the destination — everything here is in scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows; it doubles as a signpost for collaborators reading where the effort is headed.

**Fog or ticket?** The test is whether you can state the question precisely now — _not_ whether you can answer it now.

- **Ticket when** the question is already sharp — even if it's blocked and you can't act on it yet.
- **Not yet specified when** you can't yet phrase it that sharply. Don't pre-slice the fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.

**Not yet specified** excludes what's already decided (Decisions so far), what's already a live ticket, and what's out of scope (the next section).

## Out of scope

Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope** — it isn't fog, and it doesn't belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you've consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.

Out-of-scope work never graduates — the frontier stops at the destination — so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.

Ruling something out of scope is a scoping act, not a step on the route. When a ticket that already exists turns out to sit past the destination — mis-scoped in while charting, or exposed by a resolution — **close it** (a closed ticket is unambiguously off the frontier) and leave one line in the **Out of scope** section: the gist plus why it's out of scope, linking the closed ticket. It stays out of **Decisions so far**, which records the route actually walked — a scope boundary isn't a step on it.

## Invocation

Two modes. **Chart the map** stops after creating the map (and firing any parallel research). **Work through the map** resolves **one ticket per pass**, then may chain another pass in the same session only via the post-resolve structured MCQ (see step 7) — never silently. Charting's parallel `/research` Tasks remain the exception for batching research without that prompt.

### Chart the map

**Entry**

- **Fresh** — user invokes with a loose idea; start at step 1.
- **Mid-session from `/grill-with-docs`** — user accepted a fog offer; destination already named. Skip step 1 (restate the destination once in the map body). Continue from step 2.

1. **Name the destination.** Run a `/grilling` and `/domain-modeling` session to pin down what this map is finding its way to — the spec, decision, or change. The destination fixes the scope, so it's settled first. Glossary updates may land; **do not offer ADRs** in this pass (see step 6).
2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** — the way to the destination is already clear, the whole journey small enough for one session — you don't need a map. Stop and use structured MCQ (or plain chat if neither tool is present) with these options:
   - **`/to-spec`** — Matt path: spec + council/BPR (hard-stop) → `/to-tickets` → `/implement` (one ticket per session)
   - **`/to-plan`** — escape hatch: one-session plan → `/implement-plan`
   - **Implement now** — start building in this session (skip durable artifacts)
   - **Stop** — end here

   When recommending, prefer a short **context-risk** check: would clearing context mid-build force re-deriving seams/contracts? If yes → `/to-spec`; if no → `/to-plan` is fine; if unsure → `/to-spec` first.
3. **Create the map** (label `wayfinder:map`): Destination and Notes filled in; Decisions-so-far empty for now; fog sketched into **Not yet specified**.
4. **Import locked decisions** when mid-session (or any charting that inherits prior accepts) — follow [Import locked decisions](references/import-locked-decisions.md); otherwise skip. Then **create the tickets you can specify now** as child issues of the map — then wire blocking edges in a **second pass** (issues need ids before they can reference each other). Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog — the **Not yet specified** section.
5. **Fire research.** For each `research` ticket you just created, invoke `/research` in parallel (background Tasks). The findings **Markdown file** is the SSOT — add a context pointer from the ticket to that file. Only ask `/research` for a throwaway `research/<name>` branch when isolation is needed; otherwise leave the branch alone.
6. Stop — charting is one session's work; it hand-resolves nothing. **Do not offer ADRs while charting** — destination grilling orients the map; durable promotion happens on ticket close in Work through the map. (Manual “ADR this” / `/architecture-decision-records` remains available if the user asks.)

**Done when (chart):** either the no-fog exit was offered and the user chose a path, or the map exists with wired tickets (plus any imported closes), any research Tasks launched, and this session has stopped without hand-resolving HITL tickets.

### Work through the map

User invokes with a map (URL or number). A ticket is **optional** — without one, you pick the next decision, not the user.

1. Load the **map** — the low-res view, not every ticket body.
2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it**: assign it to yourself before any work.
3. Resolve it — **zoom as needed**: fetch the full body of any related or closed ticket on demand; invoke the skills the `## Notes` block names. If in doubt, use `/grilling` and `/domain-modeling`. While on this ticket, defer ADR offers from `/domain-modeling` to step 5 (glossary updates still happen live).
4. Record the resolution: post the answer as a **resolution comment**, **close** the issue, and **append a context pointer** to the map's Decisions-so-far (ticket link + one-line gist). Do **not** delete the ticket.
5. **Offer an ADR when criteria hold** — After the answer is recorded, apply the three [ADR-POLICY](../architecture-decision-records/references/ADR-POLICY.md) criteria (any ticket type; research/task answers usually fail the bar). If all three are true, **offer** to record an ADR. On acceptance, follow `/architecture-decision-records` with **`Captured via: wayfinder`**, then **dual-link** the ADR on that Decisions-so-far line (keep the ticket link; add the ADR path). If the user declines, move on — no park, no re-offer for that ticket unless they ask later.
6. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals a ticket — this one or another — sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or delete those tickets.
7. **Continue, handoff, or stop** — Only after steps 4–6 are done (frontier is current). Use structured MCQ (or plain chat if neither tool is present). This applies to every ticket type closed in work-through, including research.

   **Soft context bias** (heuristic, not a meter — agents have no live context-% API; ~120k tokens / ~60% of a large window is the empirical dumb-zone):
   - **Under 45%** → recommend **Continue next**
   - **45–60%** → slight lean to **Continue next**
   - **≥60% / ~120k** → recommend **Handoff to new session**

   **Frontier still has takeable tickets** — options (always all three; only the recommendation flips):
   - **Continue next** — claim the next unclaimed frontier ticket and start immediately (back to step 2). If that ticket is already claimed by another session, skip it with a one-line note and take the next unclaimed; if none remain, treat as map-clear below.
   - **Handoff to new session** — run `/handoff` → `docs/handoffs/CURRENT.md`. **For next session** must say: open as **`/wayfinder` Work through the map** on this map (link it); ticket optional — take the next frontier. Then stop this session.
   - **Stop** — end here; user re-invokes later.

   **Map clear** (no open decision tickets left) — do **not** offer Continue. Use the [When the map is clear](#when-the-map-is-clear) options instead, and still include **Handoff to new session** when the soft bias is ≥60% / ~120k (same `/handoff` wording, pointing at the clear map / next build skill).

The user may run unblocked tickets in parallel, so expect other sessions to be editing the tracker concurrently.

**Done when (one pass):** exactly one ticket was claimed, resolved, and closed (or ruled out of scope), any ADR offer for that answer was handled (accepted → written and dual-linked, declined → discarded, or criteria not met → no offer), the map's Decisions-so-far / fog / out-of-scope sections reflect that outcome, any newly graduated tickets are created and wired, and the step-7 structured MCQ was answered — Continue starts another pass in this session; Handoff or Stop ends the session.

## When the map is clear

Wayfinder **decides**; it does not ship the build. When no open decision tickets remain and the destination is a change to implement, offer via structured MCQ (from work-through step 7, or whenever the map is found clear) using the same context-risk gate as the no-fog exit:

- **Multi-session / dumb-zone risk** → `/to-spec` → `/to-tickets` → `/implement` (one ticket per session, clear context between)
- **Fits one session** → `/to-plan` → `/implement-plan`
- **Unsure** → `/to-spec`, then choose tickets vs `/to-plan`
- **Stop** — end here
- **Handoff to new session** — include when soft bias is ≥60% / ~120k (or the thread already feels lossy); `/handoff` with next session opening the chosen build path from a fresh chat
