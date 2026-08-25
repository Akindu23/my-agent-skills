# Import locked decisions

Preserve decisions the user **explicitly accepted** in the prior grill — not silent recommendations. Runs after the map exists, before open frontier tickets. Charting's ADR deferral still applies.

1. Propose a short **locked list** for confirm (structured MCQ or plain chat).
2. On confirm: for each item, create a child ticket, post the answer as a **resolution comment**, **close** it, and append it under **Decisions so far** (ticket link + one-line gist) — same shape as a normal close.
3. Still-open threads → **Not yet specified** or new open tickets once sharp enough to ticket.
4. `CONTEXT.md` updates already written stay.

**Done when:** every confirmed locked item is a closed child on Decisions so far, and every non-locked open thread is fog or an open ticket — nothing accepted was dropped into Notes-only prose.
