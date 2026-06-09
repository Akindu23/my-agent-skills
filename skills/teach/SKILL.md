---
name: teach
description: >-
  Teaches the user a topic over multiple sessions using a grounded learning workspace under docs/learning/, with Exa-verified resources. Use when the user invokes /teach, asks to learn a concept, wants structured lessons, or needs curated resources, glossary terms, learning records, exercises, and HTML lessons.
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
  NOTES.md
  learning-records/0001-<slug>.md
  lessons/0001-<slug>.html
  reference/<slug>.html
```

The state of learning is captured in these files:

- `MISSION.md`: The reason the user is learning the topic. Ground every teaching decision in it. Use [MISSION-FORMAT.md](references/MISSION-FORMAT.md).
- `GLOSSARY.md`: The canonical terminology for the topic. All lessons, exercises, and records should follow it. Use [GLOSSARY-FORMAT.md](references/GLOSSARY-FORMAT.md).
- `RESOURCES.md`: A curated set of verified sources and communities. Use [RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md).
- `learning-records/*.md`: Short records of demonstrated understanding, prior knowledge, corrected misconceptions, or mission shifts. Use [LEARNING-RECORD-FORMAT.md](references/LEARNING-RECORD-FORMAT.md).
- `lessons/*.html`: Self-contained HTML lessons and exercises — the primary teaching unit. Use [LESSON-FORMAT.md](references/LESSON-FORMAT.md).
- `reference/*.html`: Compressed quick-reference sheets (syntax, poses, algorithms) designed for repeat lookup. Create when a topic benefits from durable cheat-sheets beyond glossary terms.
- `NOTES.md`: A scratchpad for user preferences and working notes.

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant exercises devised by you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before `RESOURCES.md` is well-populated, focus on finding high-quality resources that will help the user acquire knowledge. Never teach factual content from memory alone.

Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.

## Gathering knowledge

Never cite sources or teach factual material from memory alone.

Before populating `RESOURCES.md`, finding communities, or grounding factual claims in lessons, read [RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md) and follow its Exa discover-then-verify workflow. Lesson and reference-sheet links may only cite URLs already listed in `RESOURCES.md`; add new sources via that workflow before first use.

## Lessons

A lesson is the main thing you produce — one self-contained HTML file in `lessons/`, teaching one tightly-scoped thing tied to the mission. Each lesson should be **beautiful** — clean, readable typography and layout — since the user will return to these later to review. Vary visual design to fit the topic; do not default to the same palette or layout every time.

Write lessons per [LESSON-FORMAT.md](references/LESSON-FORMAT.md).

## Reference sheets

While creating lessons, also create `reference/*.html` when the topic benefits from durable cheat-sheets (syntax snippets, pose cards, algorithms). Lessons are mission-scoped and taught once; reference sheets are compressed essence for repeat lookup. Glossaries in `GLOSSARY.md` are the essential reference for terminology — adhere to them in every lesson and reference sheet.

Reference HTML should be beautiful, print-friendly, and quick to scan. No exercises. Same design freedom as lessons — see [LESSON-FORMAT.md](references/LESSON-FORMAT.md).

## The Mission

Every teaching session should be tied into the mission — the reason the user is interested in learning about the topic.

If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.

When narrowing discrete choices (topic slug, topic split, exercise style, community preferences), prefer **`AskQuestion`** when available; otherwise ask the same choices in chat.

## Zone of proximal development

The user should always feel as if they are being challenged "just enough." Keep the scope tight and directly tied to their mission.

The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:

- Reading their `learning-records/`
- Reading their `MISSION.md`
- Teaching the most relevant thing that fits their current understanding

A user may tell you that they already know about a topic. If so, record the depth of that prior knowledge in `learning-records/`.

## Glossary

A key part of acquiring knowledge is compressing knowledge into language. Once a term is known and understood, it can be used and combined in new ways to make more complex terms easier to understand.

Building the glossary should be done once you feel confident that the user understands the term. Use [GLOSSARY-FORMAT.md](references/GLOSSARY-FORMAT.md).

## Acquiring knowledge and skills

Knowledge and skills usually need to be taught as a 1-2 punch. Teach the knowledge first, then get the user to practice the skill via exercises. Prefer retrieval practice and spaced review over passive rereading.

Knowledge should first be gathered from verified resources in `RESOURCES.md`, then taught via HTML lessons. Prefer interactive HTML lessons with quizzes and in-browser exercises; use in-agent scenario quizzes when HTML isn't warranted.

At this point, you can amend the glossary if it appears clear they understand a term.

## Acquiring wisdom

Wisdom comes from true real-world interaction — testing your skills outside the learning environment.

When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer — but to ultimately delegate to a **community**.

A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.

You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.

## `NOTES.md`

The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. Record those here so you can refer back when designing lessons or working with the user.
