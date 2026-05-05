---
name: humanizer
description: >-
  Rewrites text to remove AI-generated tells (significance inflation, promo tone,
  superficial -ing phrases, vague attributions, em dash overuse, AI vocabulary,
  passive voice, chatbot artifacts, filler, signposting). Adds voice and specificity.
  Use when editing or reviewing prose, depersonalizing slop, matching a user's writing
  sample, or when the user says humanize, humanizer, AI writing, slop, or natural tone.
license: MIT
metadata:
  version: "2.6.0"
  based_on: Wikipedia Signs of AI writing
---

# Humanizer

## When to use

- User asks to humanize, de-AI, fix slop, or sound less like ChatGPT.
- Editing essays, posts, docs, UIs, or marketing copy that reads synthetic.
- Optional: user supplies a writing sample (inline or file path) for voice matching.

Do **not** rely on this skill alone when the task is purely factual verification or legal/medical precision—the workflow prioritizes *natural* prose over exhaustive citation unless the user asks otherwise.

## Instructions

Act as a human editor. Goal: prose that sounds like a specific person thinking aloud, not a model optimizing likelihood.

### Workflow

1. **Identify** AI patterns using the catalog (see below). Read [references/patterns-detailed.md](references/patterns-detailed.md) when doing a full pass or when unsure which tells apply.
2. **Rewrite** problematic spans with simpler syntax, concrete detail, and honest stance.
3. **Preserve** meaning and factual claims unless the user asks for corrections.
4. **Match voice** when a sample is provided; otherwise use varied rhythm and real judgment (see Personality and soul).
5. **Anti-AI pass:** Ask internally what still screams “model output,” then tighten again.

### Pattern catalog (overview)

| Sections | Focus |
|----------|--------|
| 1–6 | Content puffery, notability shoehorning, -ing throat-clearing, promo travelogue tone, weasel attributions, formulaic “challenges” sections |
| 7–13 | AI vocabulary, copula avoidance, negative parallelisms, rule of three, synonym cycling, false ranges, passive fragments |
| 14–19 | Em dashes, mechanical bold, pseudo-headers in lists, title case headings, emojis, curly quotes |
| 20–22 | Chatbot pleasantries, training disclaimers, sycophantic tone |
| 23–29 | Filler, hedging, generic upbeat endings, hyphen spam, fake profundity, tutorial signposting, header throat-clearing |

Full tells, examples, and before/after lines live in [references/patterns-detailed.md](references/patterns-detailed.md) (load on demand so the main skill stays small).

### Voice calibration (optional)

When the user supplies their own writing sample—inline paste or file path:

1. Read it first; note sentence length mix, diction, paragraph openings, punctuation habits, transitions.
2. Prefer **their** habits over generic “good prose.” Short sentences stay short; informal stays informal.
3. Without a sample, follow **Personality and soul** below.

### Personality and soul

Sterile “correct” text still reads as AI. Aim for:

- **Opinions** where neutral fluff used to be.
- **Mixed rhythm**—staccato and longer lines in the same piece.
- **Acknowledged tradeoffs** instead of fake balance.
- **First person** when it fits the genre.
- **Specific discomfort or curiosity** instead of “this is important/significant.”

Quick sanity check: if it could appear unchanged as a Wikipedia lead or press release, add human friction.

### Process checklist

1. Read input end-to-end.
2. Mark hits against sections 1–29 (use the reference file for nuance).
3. Rewrite in place or produce a clean draft.
4. Confirm revised prose reads aloud naturally and keeps the user’s intent.
5. Run the closing prompts: “What makes this still obviously AI?” then “Make it not obviously AI.” and revise.

### Output format

Return:

1. Draft rewrite (or tracked commentary if the user asked for review-only).
2. Short bullets: remaining AI tells (if any).
3. Final rewrite after the audit.
4. Optional: one-paragraph summary of what changed.

### Long-form illustration

A step-by-step before / draft / audit / after walkthrough is in [references/worked-example.md](references/worked-example.md).
