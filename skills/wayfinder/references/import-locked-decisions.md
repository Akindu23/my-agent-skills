# Import locked decisions

Preserve decisions the user **explicitly accepted** in the prior grill - not silent recommendations. Runs after the map exists, before unclaimed frontier tickets. Charting's ADR deferral still applies.

1. Propose a short **locked list** for confirm (structured MCQ or plain chat).
2. On confirm: for each item, create a child from the [ticket fence](../SKILL.md#tickets), append `## Answer`, set `Status: resolved`, and append it under **Decisions so far** (ticket link + one-line gist) - same shape as a normal resolve.
3. Still-open threads → **Not yet specified** or new unclaimed tickets once sharp enough to ticket.
4. `CONTEXT.md` updates already written stay.

**Done when:** every confirmed locked item is a resolved child on Decisions so far, and every non-locked open thread is fog or an unclaimed ticket - nothing accepted was dropped into Notes-only prose.
