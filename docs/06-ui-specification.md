# 06 — User Interface Specification

Next.js App Router. Server Components render content (Learn pages, catalog); Client
Components own interactive exercise state. Design system: a small token set + component
library (shadcn/ui-style). Bilingual UI chrome (EN/FR toggle); learning content is FR with
EN scaffolding per the content rules.

## Information architecture (routes)

```
/                         Dashboard (auth) / Landing (anon)
/learn                    Catalog — the 40 objectives, filterable (§6 filters)
/learn/[objectiveId]      Module hub (5 stages, progress ring)
/learn/[objectiveId]/learn          Learn stage
/learn/[objectiveId]/practice       Practice session
/learn/[objectiveId]/consolidation  Consolidation session
/learn/[objectiveId]/self-test      Self-test (timed/untimed)
/learn/[objectiveId]/mastery        Mastery-check report
/study                    Topic-focused study (grammar/vocab/skill tracks)
/study/grammar/[concept]  Grammar concept track + chart
/study/vocab/[domain]     Vocabulary domain track + lexicon
/review                   Daily spaced-repetition queue
/exam                     SLE prep hub (Reading / Written Expression / Oral)
/exam/[attemptId]         Exam runner
/exam/[attemptId]/results Exam review + predicted level
/speaking                 Speaking practice hub
/speaking/[itemId]        Oral practice runner (record → score → feedback)
/progress                 Detailed progress & readiness
/settings                 Locale, target level, audio, accessibility
```

## Global layout

- **Top bar**: logo, level switch (A/B), EN/FR chrome toggle, streak flame + `dueToday`
  badge (links to /review), avatar menu.
- **Left rail** (collapsible): Dashboard, Learn, Study, Review, Exam, Speaking, Progress.
- **Command palette** (⌘K): jump to any objective/concept/lexicon entry.

---

## Screen specs

### Dashboard (`/`)
The control center (requirement §9). Cards:
1. **Level progress** — two radial bars: Level A %, Level B %. Tap → /progress.
2. **Skill breakdown** — 6 horizontal bars (reading/writing/listening/speaking/grammar/
   vocabulary) with a one-line "weakest skill" callout.
3. **Continue learning** — resume card for the active objective + stage, with a single
   primary CTA ("Continue A11 · Practice").
4. **Due reviews** — count + "Start review" CTA.
5. **Recommended next** — up to 3 chips from `GET /api/recommendations`, each with a reason.
6. **Readiness** — three gauges (Level A / Level B / SLE) with the limiting-factor sentence.
7. **Mastered / Weak** — two compact lists (chips), each linking into the module.

### Catalog (`/learn`)
- **Filter bar** (sticky): Level (A/B segmented), Skill, Theme, Grammar concept, Vocab
  domain, plus a search box. Maps 1:1 to `GET /api/objectives` params. Active filters as
  removable chips.
- **Objective cards** grid: code badge (A11), title (FR primary, EN secondary), primary-
  skill icon, theme tags, a thin mastery bar, and a state pill (Not started / Learning /
  Review / Mastered / Weak). Locked modules (hard prereq) show a lock + tooltip.

### Module hub (`/learn/[id]`)
- Header: code, FR + EN title, level, themes, grammar/vocab tags, overall mastery ring.
- **Five stage cards** in a stepper: Learn · Practice · Consolidation · Self-test · Mastery.
  Each shows completion %, exit-condition status, and a CTA. Later stages visually
  "available" once prior exit conditions are met (no hard lock by default — soft nudge).
- Side panel: prerequisites (links), "concepts you'll practice", estimated time.

### Learn stage (`/learn/[id]/learn`)
Long-form, scrollable, server-rendered. Sections (collapsible, with a sticky mini-TOC):
- **Concept explanation** (EN scaffolding + FR examples).
- **Vocabulary list** — table (FR · gender/POS · EN · register · ▶ audio · ★ add-to-review).
- **Grammar notes + chart** — rendered conjugation/rule tables from `GrammarChart`.
- **Pronunciation guidance** — IPA hints, ▶ audio, "common pitfalls" callouts.
- **Example dialogues** — speaker-labelled, ▶ play-all, click a line to hear/gloss it.
- **Example texts** — workplace emails/notes with inline glossing on hover/tap.
- Footer CTA: "I've reviewed this → Start Practice".

### Exercise runner (Practice / Consolidation / Self-test) — the core component
A single reusable **`<ExerciseRunner>`** drives all session modes; the mode flag changes
feedback timing and chrome.

Layout:
- **Progress header**: served/remaining, a thin progress bar; in timed mode a countdown
  ring (turns amber < 20%, red < 5%).
- **Stem area**: renders by `item.type` (see component table below).
- **Confidence chip row** (study/practice only): 1–5 quick-select before/after submit.
- **Action bar**: Submit (disabled until answer present) · Skip · (study) Hint.
- **Feedback panel** (study/practice; slides in after submit):
  - ✓/✗ banner with the correct answer highlighted.
  - **Explanation accordion**: Why correct · Why each distractor is wrong · Grammar rule ·
    Vocab notes · Common mistakes.
  - **Learning tip card**: memory aid · pattern · 2–3 similar examples.
  - **Mastery delta** micro-animation on the objective ring.
  - "Add to review" toggle; "Report issue" link (→ flag queue).
  - Primary CTA: "Next".
- **Exam/self-test timed mode**: no per-item feedback; a compact "answered/flagged" map for
  navigation; feedback batched on the results screen.

#### Exercise type → render component

| `item.type` | Component | Interaction |
|-------------|-----------|-------------|
| `mcq_single` / `listening_mcq` | `RadioOptions` | pick one (options shuffled) |
| `mcq_multi` | `CheckboxOptions` | pick set |
| `fill_blank` | `InlineBlank` | typed input inside the sentence |
| `cloze_multi` | `ClozePassage` | multiple inline inputs/dropdowns |
| `matching` | `MatchColumns` | drag/connect or tap-to-pair (touch-friendly) |
| `ordering` / `sentence_build` | `TokenSorter` | drag tokens; tap-to-place fallback |
| `translation_*` | `TranslationField` | textarea + accepted-answer fuzzy feedback |
| `error_correction` | `CorrectionEditor` | click the wrong token / edit the sentence |
| `dialogue_complete` | `DialogueGap` | pick or type the missing turn |
| `listening_dictation` | `AudioDictation` | ▶ (limited replays) + text |
| `reading_passage_set` | `PassageReader` | scrollable passage + question stack |
| `short_written_response` | `WrittenResponse` | textarea + rubric feedback |
| `oral_short_response` / `oral_roleplay` | `OralRecorder` | mic record → waveform → score |

### Topic-focused study (`/study`)
- Three tabs: **Grammar**, **Vocabulary**, **Skill**.
- **Grammar/[concept]**: the chart up top, then a "Practice this concept" CTA that starts a
  cross-cutting session filtered to the concept (pulls from all relevant objectives).
- **Vocab/[domain]**: searchable lexicon table + "Drill this domain" (matching/translation).
- Each track shows the learner's `ConceptMastery` for that concept/domain.

### Review (`/review`)
- A focused, distraction-free runner over the due queue. Each card shows a "why you're
  seeing this" line ("Missed 2 days ago" / "Due review: passé composé"). FSRS grade is
  inferred from correctness/time — the learner just answers.

### Exam hub & runner (`/exam`)
- Hub: three components (Reading / Written Expression / Oral) × level, each with a
  blueprint description, item count, time limit, and "Start". A readiness gauge per
  component.
- Runner: exam chrome (server timer, question navigator, flag-for-review, no feedback).
- Results: scaled score, **predicted level (A/B)**, component breakdown, and a full
  item-by-item review with explanations + "send weak items to review".

### Speaking (`/speaking`)
- Hub: prompts grouped by objective and kind (short response / role-play / scenario).
- Runner (`OralRecorder`): prompt + optional model context; big record button with live
  waveform and timer; after stop → transcript, four score dials
  (Pronunciation/Fluency/Grammar/Vocabulary), and the feedback card (model answer,
  improvements, alternatives, stronger workplace phrasing). Re-record and compare.

### Progress (`/progress`)
- Level A/B mastery breakdown by objective (heatmap grid, 40 cells colored by state).
- Skill radar chart (6 skills).
- Grammar & vocab track mastery bars.
- Readiness section with the three predictors and limiting factors.
- Activity: streak calendar, attempts/day, review adherence.

---

## Component library (tokens)

- **Color**: semantic tokens — `--correct` (green), `--incorrect` (red), `--info`,
  `--mastery-0..4` ramp for state pills. Government-neutral palette; high-contrast theme
  available.
- **Type**: a readable serif/sans for FR content; clear distinction between FR (content)
  and EN (scaffolding, rendered slightly muted/smaller).
- **State pills**: Not started (gray) · Learning (blue) · Review (amber) · Mastered
  (green) · Weak (red outline).
- **Audio button**: consistent ▶ with loading + playing states; respects reduced-motion.

## Interaction & feedback principles

- **Immediate, explanatory feedback** in study/practice — every wrong answer is a teaching
  moment (the explanation contract is always shown).
- **Keyboard-first**: number keys select MCQ options; Enter submits/advances; arrow keys
  navigate the question map; all drag interactions have tap/keyboard equivalents.
- **Optimistic UI** for attempt submission with rollback on error.
- **Autosave** session state (resume mid-session after refresh/disconnect).

## Accessibility (WCAG 2.2 AA target)

- All interactive exercises operable by keyboard and screen reader; drag-and-drop has a
  documented non-drag path (tap-to-select / move buttons).
- Audio items provide transcripts (revealed after attempt for listening items) and visible
  controls; never autoplay.
- Color is never the sole signal (✓/✗ icons + text accompany green/red).
- Timer can be extended or disabled in `/settings` (except true exam-simulation mode, which
  warns first). Respects `prefers-reduced-motion`.
- Focus management: feedback panel receives focus on reveal; Next returns focus to stem.
- Targets ≥ 44px; form fields labelled; lang attributes (`lang="fr"` / `lang="en"`) set per
  span so screen readers pronounce each language correctly.

## Responsive

- Mobile-first. Exercise runner is single-column; left rail collapses to a bottom tab bar
  (Learn / Review / Speak / Progress). Matching/ordering use tap-to-pair on touch.
