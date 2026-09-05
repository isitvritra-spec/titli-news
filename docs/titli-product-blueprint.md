# Titli Product Blueprint

Status: MVP implementation complete, September 2, 2026

## The one-sentence product

Titli gives every Indian woman the seven things worth knowing today, with proof, in five calm minutes.

This is narrower and stronger than "short news." Titli is a women-first daily briefing that combines verified news, durable data, useful context, and visible progress without asking the reader to sort through a general-news firehose.

## What the current MVP proves

The repository now proves the difficult foundation:

- A one-card-at-a-time reader exists on web and mobile.
- Every card has provenance, with special support for data, methodology, and contested claims.
- Readers can choose topics, save stories, share, open details, and inspect sources.
- Editors have an RSS candidate inbox, manual drafting, source management, topics, and publishing.
- Anonymous events capture views, dwell, details, saves, shares, source opens, and topic follows.
- The product is self-hosted and does not require an external CMS or user account.
- A finite seven-card daily edition can be drafted, checked, scheduled, published, resumed, and completed.
- Authenticated Render jobs prepare the morning inbox at 05:30 IST and release approved editions at 07:00 IST.
- Local reader-profile weights learn from explicit topics and behavior, decay over 21 days, and rank only safe edition positions.
- Editors can record visible corrections and inspect completion, diversity, source quality, and correction health.

The planned MVP loop is complete. Edition composition combines explicit editor judgment, role constraints, recommendation reasons, source/topic balance warnings, reader-selected topics, and slowly learned on-device behavior. Personalization never moves the Anchor, Another Lens, the Lift, mandatory cards, or high-distress cards, and a reader's order stays fixed until the next edition version.

## The Steve Jobs edit

### Keep

- One screen, one idea.
- Human editorial judgment as the trust moat.
- Roughly 60 words, followed by optional depth.
- Source and methodology as part of the product, not legal fine print.
- Women-specific categories and the Women's Pulse.
- Local, anonymous personalization before introducing accounts.

### Say no to

- An endless feed as the primary experience.
- Generic national breaking news unless it materially affects the audience.
- AI auto-publishing or summarizing without an editor.
- Optimizing for outrage, session length, notification opens, or compulsive scrolling.
- Opaque "because the algorithm said so" ranking.
- Likes, comments, follower counts, and public popularity signals in the MVP.

## The daily ritual

Titli should feel finite, nourishing, and fresh. The default morning edition contains seven cards:

1. The Anchor: the most consequential verified story of the day.
2. For You: one high-confidence topic match.
3. The Number: a data card that gives the day durable context.
4. Useful Now: a right, scheme, health, money, or safety action the reader can use.
5. Beyond the Metro: a rural, regional, or grassroots perspective.
6. Another Lens: an intentional exploration card outside the reader's usual topics.
7. The Lift: a verified women's win that ends the edition with agency rather than dread.

Breaking stories may be inserted, but the edition should still preserve diversity and a completion point. After card seven, Titli says "You are caught up" and offers three intentional exits: save something, explore one topic, or leave and return tomorrow.

## First-touch flow

### First 30 seconds

1. Show the product promise, not a feature tour: "Seven things worth knowing. Five calm minutes. Every source visible."
2. Ask the reader to pick three concerns from plain-language topics.
3. Ask one optional context question such as state or preferred language. Explain why it helps.
4. Open directly into card one. Do not require account creation.

### First session

1. The first three cards are editor-led, not hyper-personalized.
2. A small "Why this?" label explains edition role and topic match.
3. Swiping records a soft signal; save, source open, share, and "less like this" are stronger signals.
4. Detail opens in place and always returns to the same position.
5. The final card resolves the session with a progress recap and tomorrow promise.

### Returning session

1. Resume an unfinished edition at the last unread card.
2. If today's edition is complete, show the completion state instead of recycling old cards.
3. Offer an archive or topic exploration as a conscious secondary action.
4. Send at most one useful notification per edition window, controlled by the reader.

## Titli ranking model, version 1

This is a transparent Titli design, not a claim about Inshorts' proprietary ranking formula.

### Step 1: eligibility gate

A story cannot rank unless it is published, editor-reviewed, source-linked, recent enough for its type, and safe for the selected language. Similar coverage of the same event is clustered before ranking. Discovery-tier RSS sources can nominate a story but should not be the sole provenance for a consequential claim.

### Step 2: score eligible cards

Use a simple score that an editor can inspect:

```text
score =
  0.30 * editorial_importance
  + 0.20 * reader_relevance
  + 0.15 * freshness
  + 0.15 * practical_utility
  + 0.10 * source_quality
  + 0.10 * novelty
  - 0.15 * fatigue
```

All inputs are normalized from 0 to 1. The score chooses candidates; it does not determine the final order by itself.

### Step 3: compose, do not merely sort

The edition composer fills the seven roles above. Apply hard constraints:

- No more than two cards from one primary topic.
- No more than two cards from one source.
- Include at least one primary-source or data card when available.
- Include one exploration card outside the strongest affinity cluster.
- Avoid placing two high-distress stories back to back.
- End on agency, utility, or progress unless breaking-news importance overrides it.

### Step 4: learn slowly

Start with explainable local weights:

```text
explicit topic follow  +5
save                   +4
source open            +3
share                  +3
detail open            +2
healthy dwell          +1
fast skip              -1
repeated topic skips   -2
less like this         -5
```

Decay behavioral weights with a 21-day half-life. Explicit preferences do not decay. Cap any one topic's affinity so the reader cannot fall into a single-topic tunnel. Reserve about 15% of personalized positions for exploration.

### Step 5: explain it

Every personalized card can expose a small reason:

- "In today's essential seven"
- "Because you follow Work & Money"
- "A different lens for balance"
- "New from a source you trust"

## Editorial and refresh operating model

### Morning edition

- 05:30 IST: scheduled RSS ingestion and deduplication prepare the inbox.
- 05:45 IST: automated clustering groups duplicate coverage and flags primary sources.
- 06:00 IST: editor selects candidates, writes fresh summaries, verifies claims, and sets edition roles.
- 06:45 IST: editor previews balance, distress sequence, sources, and word counts.
- 07:00 IST: publish one edition atomically; readers receive the new edition on foreground refresh.

### Day updates

- Breaking updates create a new version of a card or insert one high-priority card.
- Corrections remain visible with a correction note and timestamp.
- A noon refresh may add one or two cards, but should not silently reset completion.
- Old editions stay available in an archive; they do not re-enter today's default feed.

### Required product objects

- `edition`: date, timezone, status, published time, editor, version.
- `edition_card`: edition, card, position, role, editorial importance, explanation.
- `story_cluster`: canonical event and related candidate links.
- `reader_profile`: local installation, topic weights, language, state, notification window.
- `reader_edition_state`: seen positions, completion, last active card.
- `card_feedback`: less-like-this and optional reason.

## MVP phases

### Phase 1: make the ritual real

- Complete: editions and seven edition-card roles in the database.
- Complete: authenticated morning ingestion and scheduled publishing via Render cron.
- Complete: editor edition composer with hard validation and balance warnings.
- Complete: today's finite edition from `/api/editions/today`.
- Complete: progress, resume, recommendation explanations, and a caught-up state.
- Complete: `edition_start`, `edition_complete`, `why_this_open`, and `less_like_this` events.

### Phase 2: useful personalization

- Complete: store local reader profile weights on-device.
- Complete: rank within edition-role constraints using explicit topics plus behavior.
- Complete: add "less like this" and transparent recommendation reasons.
- Deliberately deferred: ask for language and state only when the content supply can use those answers honestly.
- Complete: create an editor dashboard for completion, diversity, source quality, and corrections.

### Phase 3: scale without losing trust

- Add story clustering and assisted draft suggestions, always with human approval.
- Run controlled experiments on sequence, copy, and edition size.
- Add account sync only when readers ask for cross-device saved stories and preferences.
- Expand into evening or regional editions only after the morning ritual retains.

## Success measures

The north-star metric is completed trusted editions per weekly active reader.

Supporting metrics:

- First-edition completion rate.
- Day-1, day-7, and day-30 return rate.
- Median cards read before completion.
- Save, share, source-open, and detail-open rates.
- Topic and source diversity per completed edition.
- "Less like this" rate and notification opt-out rate.
- Correction rate and time-to-correction.

Do not use total time spent as the primary metric. If Titli works, a reader can feel informed quickly and leave with confidence.

## Public inspiration, not copied implementation

Public Inshorts material describes a single-card, roughly 60-word format, optional full-article reading, human editorial selection, and personalized feeds informed by usage. The exact algorithm is not public. Titli borrows those general product principles while differentiating through a finite edition, women-first utility, source transparency, data methodology, editorial diversity constraints, and a calm completion state.

- Inshorts product page: https://inshorts.com/
- Inshorts editorial process: https://blog.inshorts.com/2015/12/05/content-curation-and-editing-process-at-inshorts/
- Inshorts privacy policy: https://inshorts.com/privacy
- Inshorts search announcement: https://blog.inshorts.com/2016/09/07/inshorts-launches-new-search-feature/
