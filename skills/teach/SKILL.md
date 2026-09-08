---
name: teach
description: Multi-session tutoring with a grounded learning workspace under docs/learning/.
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
  assets/<name>.<ext>
  reference/<slug>.html
  reference/glossary.html
```

Per-file rules live in the format file for that artifact. Teaching preferences the user states go in `NOTES.md`.

## User clarifications

For a discrete decision with about 2-6 clear options, use the session's structured MCQ tool.

1. Probe the tool list for `AskQuestion` (Cursor) or `AskUserQuestion` (Claude Code).
2. Call the one that exists, using that tool's schema from the session - field names are not interchangeable.
3. If neither exists, ask the same choices in ordinary chat, same options and order.

Put every fact the user needs to choose inside the question and option text. Some clients hide assistant preamble in the same turn as the tool call.

Free-form answers stay in plain chat.

Ask **one decision at a time** when narrowing topic slug, topic split, exercise style, or community preferences.

## 1. Mission

Read [MISSION-FORMAT.md](references/MISSION-FORMAT.md). If the user is unclear about the mission, or `MISSION.md` is not populated, interview them before any lesson.

**Done when**: `MISSION.md` exists and this session's next lesson can be judged against it; any mission change is user-confirmed and recorded.

## 2. Resources

Read [RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md) and follow its Exa discover-then-verify workflow before populating `RESOURCES.md`, finding communities, or grounding factual claims in lessons. Lesson and reference-sheet links may only cite URLs already listed in `RESOURCES.md`; add new sources via that workflow before first use.

**Done when**: every URL this session will cite is in `RESOURCES.md`.

## 3. Lesson

Read [LESSON-FORMAT.md](references/LESSON-FORMAT.md) (pedagogy, assets, reference sheets, preview) and [LEARNING-RECORD-FORMAT.md](references/LEARNING-RECORD-FORMAT.md). Scope this lesson from `learning-records/` plus `MISSION.md`, or the exact thing the user named.

**Done when**: every lesson written this session is tied to the mission and the user's zone of proximal development, cites only `RESOURCES.md` URLs, and is opened for the user if possible.

## 4. Glossary

Read [GLOSSARY-FORMAT.md](references/GLOSSARY-FORMAT.md). Add a term only when the user understands it.

**Done when**: every term this session established as understood is in `GLOSSARY.md`.
