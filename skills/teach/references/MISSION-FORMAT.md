# MISSION.md Format

`MISSION.md` lives at `docs/learning/<topic-slug>/MISSION.md`. It captures the _reason_ the user is learning this topic. Every teaching decision - what to teach next, which resources to surface, which exercises to design - should trace back to this document.

## Template

```md
# Mission: {Topic}

## Why
{1-3 sentences. The concrete real-world goal the user is chasing. What changes in their life or work when they have this skill? Avoid abstract framings like "to understand X" - push for the underlying outcome.}

## Success looks like
- {A specific, observable thing the user will be able to do}
- {Another specific thing}
- {…}

## Constraints
- {Time, budget, prior commitments, learning preferences, anything that bounds the approach}

## Out of scope
- {Adjacent topics the user explicitly does not want to chase right now - protects the zone of proximal development}
```

## Rules

- **One mission per topic folder.** If the user wants to learn two unrelated things, that is two topic folders under `docs/learning/`.
- **Concrete over abstract.** "Run a half marathon by October" beats "get fitter." "Ship a Rust CLI to my team" beats "learn Rust."
- **Push back on vagueness.** If the user cannot articulate why, interview them before writing anything. A bad mission is worse than no mission.
- **Revise when reality shifts.** Missions change as the user develops more skills and knowledge. When the user's goal moves, update this file, add a learning record to capture the shift, and **confirm with the user before changing the mission**. Don't leave a stale mission steering future sessions.
- **Interview before writing.** If the user is unclear about the mission, or `MISSION.md` is not populated, question them on why they want to learn this before any lesson. A mission you cannot judge the next lesson against will make knowledge acquisition ungrounded.
- **Keep it short.** If `MISSION.md` runs past a screen, it has stopped being a compass and started being a plan.