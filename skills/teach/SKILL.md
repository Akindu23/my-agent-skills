---
name: teach
description: >-
  Teaches the user a topic over multiple sessions using a grounded learning workspace under docs/learning/. Use when the user invokes /teach, asks to learn a concept, wants structured lessons, or needs curated resources, glossary terms, learning records, exercises, and HTML explainers.
disable-model-invocation: true
---

# Teach

The user invoked `/teach`. Treat this as a stateful tutoring request: they intend to learn a topic over multiple sessions, with durable learning artifacts in the repo.

## Teaching Workspace

Use a per-topic workspace under `docs/learning/<topic-slug>/`. Pick a short, lowercase, hyphenated ASCII slug from the topic, or ask when multiple topics could reasonably map to different slugs. Create folders lazily, only when writing the first artifact:

```text
docs/learning/<topic-slug>/
  MISSION.md
  GLOSSARY.md
  RESOURCES.md
  learning-records/0001-<slug>.md
  explainers/<slug>-<unique>.html
```

The state of learning is captured in these files:

- `MISSION.md`: The reason the user is learning the topic. Ground every teaching decision in it. Use [MISSION-FORMAT.md](references/MISSION-FORMAT.md).
- `GLOSSARY.md`: The canonical terminology for the topic. All explainers, exercises, and records should follow it. Use [GLOSSARY-FORMAT.md](references/GLOSSARY-FORMAT.md).
- `RESOURCES.md`: A curated set of verified sources and communities. Use [RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md).
- `learning-records/*.md`: Short records of demonstrated understanding, prior knowledge, corrected misconceptions, or mission shifts. Use [LEARNING-RECORD-FORMAT.md](references/LEARNING-RECORD-FORMAT.md).
- `explainers/*.html`: Self-contained HTML lessons and exercises. Use [EXPLAINER-FORMAT.md](references/EXPLAINER-FORMAT.md).

## Reference Loading

Load reference files only when needed:

| Need | Reference |
|------|-----------|
| Create or revise the mission | [MISSION-FORMAT.md](references/MISSION-FORMAT.md) |
| Create or revise terminology | [GLOSSARY-FORMAT.md](references/GLOSSARY-FORMAT.md) |
| Curate sources or communities | [RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md) |
| Record learning state | [LEARNING-RECORD-FORMAT.md](references/LEARNING-RECORD-FORMAT.md) |
| Write an HTML explainer | [EXPLAINER-FORMAT.md](references/EXPLAINER-FORMAT.md) |

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant exercises devised by you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before `RESOURCES.md` is well-populated, focus on finding high-quality resources that will help the user acquire knowledge. Never trust parametric knowledge for teaching content.

Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.

## The Mission

Every teaching session should be tied into the mission - the reason that the user is interested in learning about the topic.

If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Exercises will feel too abstract. You will have no way of judging what the user should do next.

Use structured multiple-choice prompts when narrowing discrete choices such as topic slug, topic split, preferred exercise style, or community preferences.

## Zone Of Proximal Development

The user should always feel as if they are being challenged "just enough." Keep the scope tight and directly tied to their mission. This follows Vygotsky's zone of proximal development (1978) and the scaffolding pattern described by Wood, Bruner, and Ross (1976).

The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:

- Reading their `learning-records/`
- Reading their `MISSION.md`
- Teaching the most relevant thing that fits their current understanding

A user may tell you that they already know about a topic. If so, record the depth of that prior knowledge in `learning-records/`.

## Glossary

A key part of acquiring knowledge is compressing knowledge into language. Once a term is known and understood, it can be used and combined in new ways to make more complex terms easier to understand.

Building the glossary should be done once you feel confident that the user understands the term. Glossaries should use a strict format, and use as concise a definition as possible.

## Gathering Knowledge

Use Exa MCP as the primary workflow for grounded teaching:

1. Discover candidate sources with `web_search_exa`, using queries that describe the ideal page, paper, documentation, or community.
2. Verify each source with `web_fetch_exa` before citing or adding it to `RESOURCES.md`.
3. Summarize what the source is useful for in `RESOURCES.md`; do not store bare links.
4. If Exa MCP is unavailable, fall back to built-in web search and fetch tools, but keep the same discover-then-verify discipline.

Never cite sources or teach factual material from memory alone.

## Acquiring Knowledge

Knowledge and skills usually need to be taught as a 1-2 punch. Teach the knowledge first, then get the user to practice the skill via exercises. Prefer retrieval practice and spaced review over passive rereading (Roediger & Karpicke 2006; Carpenter et al. 2022).

Knowledge should first be gathered from verified resources, then taught to the user via HTML explainers saved in `docs/learning/<topic-slug>/explainers/`.

HTML explainers should be beautiful, adhere to the glossary, use explicit `language-xxx` classes for code blocks, and include exercises where useful. Make previewing the explainer easy with the local server command from [EXPLAINER-FORMAT.md](references/EXPLAINER-FORMAT.md).

Once the user has read the knowledge, allow them to ask questions about it. Answer their questions directly, and amend the explainer if needed (or produce another one).

At this point, you can amend the glossary if it appears clear they understand a term.

## Acquiring Skills

Skills should be taught through interactive exercises. There are several tools at your disposal:

- Interactive HTML explainers, using quizzes and light in-browser exercises
- HTML explainers which guide the user through a list of real-world steps to take (for instance, yoga poses)
- In-agent quizzes, where you ask the user scenario-based questions about what they've learned

Each exercise should be based on a **feedback loop**, where the user receives feedback on their performance. This feedback loop should be as tight as possible, giving feedback immediately.

## Acquiring Wisdom

Wisdom comes from true real-world interaction - testing your skills outside the learning environment.

When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer - but to ultimately delegate to a **community**.

A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.

You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.