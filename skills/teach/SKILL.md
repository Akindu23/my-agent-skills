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
  reference/glossary.html
```

The state of learning is captured in these files:

- `MISSION.md`: The reason the user is learning the topic. Ground every teaching decision in it. Use [MISSION-FORMAT.md](references/MISSION-FORMAT.md).
- `GLOSSARY.md`: The canonical terminology for the topic. All lessons, exercises, and records should follow it. Use [GLOSSARY-FORMAT.md](references/GLOSSARY-FORMAT.md).
- `RESOURCES.md`: A curated set of verified sources and communities. Use [RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md).
- `learning-records/*.md`: Short records of demonstrated understanding, prior knowledge, corrected misconceptions, or mission shifts. Use [LEARNING-RECORD-FORMAT.md](references/LEARNING-RECORD-FORMAT.md).
- `lessons/*.html`: Self-contained HTML lessons and exercises — the primary teaching unit. Use [LESSON-FORMAT.md](references/LESSON-FORMAT.md).
- `reference/*.html`: Compressed quick-reference sheets (syntax, poses, algorithms, glossary render) designed for repeat lookup. Create when a topic benefits from durable cheat-sheets beyond glossary terms.
- `NOTES.md`: A scratchpad for user preferences and working notes.

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant interactive lessons devised by you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before `RESOURCES.md` is well-populated, focus on finding high-quality resources that will help the user acquire knowledge. Never teach factual content from memory alone.

Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.

### Fluency vs storage strength

Split between two types of learning:

- **Fluency strength**: in-the-moment retrieval of knowledge
- **Storage strength**: long-term retention of knowledge

Fluency can give the user an illusory sense of mastery, but storage strength is the real goal. Design lessons that build long-term retention through desirable difficulty:

- **Retrieval practice** (recall from memory)
- **Spacing** (distributing practice over time)
- **Interleaving** (mixing related topics in practice — for skills practice only)

## Gathering knowledge

Never cite sources or teach factual material from memory alone.

Before populating `RESOURCES.md`, finding communities, or grounding factual claims in lessons, read [RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md) and follow its Exa discover-then-verify workflow. Lesson and reference-sheet links may only cite URLs already listed in `RESOURCES.md`; add new sources via that workflow before first use.

## Lessons

A lesson is the main thing you produce — the unit in which knowledge and skills reach the user. Each lesson is one self-contained HTML file in `lessons/`, teaching one tightly-scoped thing tied to the mission.

Pedagogical rules:

- **Beautiful** — clean, readable typography and layout; think Tufte. Vary visual design to fit the topic; do not default to the same palette or layout every time.
- **Short** — completable very quickly. Learners' working memory is small; each lesson should deliver a single tangible win they can build on.
- **Scoped** — directly tied to the mission and the user's zone of proximal development.
- **Linked** — use HTML anchors to other lessons and reference documents in the same topic folder.
- **Sourced** — recommend a primary source from `RESOURCES.md` for the user to read or watch.
- **Open** — if possible, open the lesson for the user via CLI (see [LESSON-FORMAT.md](references/LESSON-FORMAT.md)).
- **Follow-up** — remind the user they can ask the agent when something is unclear.

HTML implementation, preview commands, and code-block rules: [LESSON-FORMAT.md](references/LESSON-FORMAT.md).

## Reference documents

While creating lessons, also create `reference/*.html` when the topic benefits from durable cheat-sheets. Lessons are mission-scoped and taught once; reference documents are compressed essence for repeat lookup — the raw units of learning the user returns to.

Lessons will rarely be revisited later; reference documents will. They should be beautiful, print-friendly, and quick to scan. No exercises. Same design freedom as lessons — see [LESSON-FORMAT.md](references/LESSON-FORMAT.md).

Some topics lend themselves to reference sheets:

- Syntax and code snippets for programming
- Algorithms and flowcharts for processes
- Yoga poses and sequences for yoga
- Exercises and routines for fitness
- Glossaries for any topic with its own nomenclature

`GLOSSARY.md` is the canonical terminology source. Once it has **3+ defined terms** or a lesson adds or amends terms, generate or refresh `reference/glossary.html` as a quick-reference render. Adhere to glossary terminology in every lesson and reference document.

## The Mission

Every lesson should be tied into the mission — the reason the user is interested in learning about the topic.

If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.

Missions may change as the user develops more skills and knowledge. This is normal — update `MISSION.md`, add a learning record to capture the shift, and **confirm with the user before changing the mission**.

When narrowing discrete choices (topic slug, topic split, exercise style, community preferences), prefer **`AskQuestion`** when available; otherwise ask the same choices in chat.

## Zone of proximal development

Each lesson, the user should always feel as if they are being challenged "just enough." Keep the scope tight and directly tied to their mission.

The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:

- Reading their `learning-records/`
- Reading their `MISSION.md`
- Teaching the most relevant thing that fits their current understanding

A user may tell you that they already know about a topic. If so, record the depth of that prior knowledge in `learning-records/`.

## Glossary

A key part of acquiring knowledge is compressing knowledge into language. Once a term is known and understood, it can be used and combined in new ways to make more complex terms easier to understand.

Building the glossary should be done once you feel confident that the user understands the term. Use [GLOSSARY-FORMAT.md](references/GLOSSARY-FORMAT.md).

## Knowledge

Lessons should be designed around a skill the user is going to learn. The knowledge in the lesson should be only what's required to acquire that skill. Teach the knowledge first, then get the user to practice via an interactive feedback loop.

Knowledge should first be gathered from verified resources in `RESOURCES.md`, then taught via HTML lessons. Litter lessons with citations — link only to entries in `RESOURCES.md`.

For acquiring knowledge, difficulty is the enemy. It eats working memory you need for understanding.

At this point, you can amend the glossary if it appears clear they understand a term.

## Skills

If knowledge is all about acquisition, skills are about durability and flexibility. Make the knowledge stick.

For skill acquisition, difficulty is the tool. Effortful retrieval is what builds storage strength. Skills should be taught through interactive lessons:

- Interactive lessons with quizzes and light in-browser tasks
- Lessons that guide the user through real-world steps (for instance, yoga poses)
- In-agent scenario quizzes when HTML isn't warranted

Each approach should use a **feedback loop** — feedback as tight as possible, immediately and ideally automatically.

For quizzes, each answer option should be exactly the same number of words (and characters, if possible). Do not give the user clues about the answer through formatting.

## Acquiring wisdom

Wisdom comes from true real-world interaction — testing your skills outside the learning environment.

When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer — but to ultimately delegate to a **community**.

A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.

You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.

## `NOTES.md`

The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. Record those here so you can refer back when designing lessons or working with the user.
