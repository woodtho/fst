# 03 — Database Schema

The runnable source of truth is [`prisma/schema.prisma`](../prisma/schema.prisma). This
document explains the design, the relationships, and the non-obvious choices. Dev uses
SQLite; the schema is Postgres-safe (switch the `provider`, and enums/Json become native).

## Domain map

```
                 ┌─────────────┐        ┌──────────────────┐
   Theme ◄──────►│  Objective  │◄───────│ ObjectivePrereq  │ (DAG of A01..B40)
                 │  (A01..B40) │        └──────────────────┘
                 └──────┬──────┘
        ┌───────────────┼────────────────┐
        ▼               ▼                 ▼
   ┌─────────┐    ┌──────────┐      ┌──────────┐
   │ Module  │    │   Item   │◄─────│ Template │ (variation engine)
   │ (stages)│    └────┬─────┘      └──────────┘
   └─────────┘         │  M:N → GrammarConcept, VocabDomain
                       ▼
                  ┌──────────┐      ┌─────────────────┐
                  │ Attempt  │─────►│    Session      │
                  └────┬─────┘      └─────────────────┘
                       │
   ┌───────────────────┼───────────────────────────────────┐
   ▼                   ▼                   ▼                 ▼
ObjectiveProgress  ConceptMastery   ReviewSchedule    ExamAttempt/ExamItem
   (per module)     (grammar/vocab/   (FSRS cards)      (SLE prep)
                     skill tracks)
                                                       SpeakingAttempt
```

## Why these tables

### Content side

- **Objective** is the module/unit of progress — the 40 PFL2 training objectives. It owns
  its **Modules** (one per `Stage`: learn/practice/consolidation/self_test/mastery_check),
  and its **Items**. `secondarySkills` is CSV on SQLite (a `String[]` on Postgres).
- **ObjectivePrereq** is a self-referential edge list → a prerequisite DAG. `hard=false`
  edges are *recommendations* (the recommender weights them); `hard=true` edges *lock* a
  module until the prereq is mastered. The seed ships soft edges only (numeric order),
  satisfying "recommended order but not hard-locked" from the curriculum map.
- **Module.content** is `Json` because each stage has a different shape (concept prose +
  dialogues for Learn; exercise refs for Practice; etc.). Shapes are validated against
  JSON Schemas in `content/` at load time, not by the DB.
- **Template** holds the parametric spec; generated **Items** point back via
  `templateId`. This makes "many variations preserving the objective" first-class.
- **LexiconEntry** / **GrammarChart** back the Learn stage and the cross-cutting
  vocab/grammar study tracks and filters.

### Item ↔ concept tagging

`ItemGrammarConcept` and `ItemVocabDomain` are explicit M:N join tables (not JSON arrays)
because the **topic-focused study filters (§6)** and **exam blueprints (§7)** query items
*by concept/domain* constantly — these need to be indexed relational joins, not JSON scans.

### Learner side

- **ObjectiveProgress** — one row per (user, objective): `masteryScore` (0..1),
  `confidence`, `state` (the `MasteryState` enum drives the dashboard's mastered/weak
  buckets), `stageReached` (gates the five stages), `bestSelfTest`.
- **ConceptMastery** — one row per (user, conceptKind, conceptId) where conceptKind ∈
  {grammar, vocab, skill}. Stores an **IRT ability estimate** `theta` and its standard
  error `thetaSe`. This is the statistical heart of adaptation: item selection and
  readiness prediction read `theta`, not raw percentages. See framework §4–6.
- **Session / Attempt** — every interaction is an Attempt inside a Session. Attempts record
  `responseMs` (response-time signal), `confidence` (1–5 self-rating), `attemptNo`, and
  `partialScore`. These four are exactly the adaptive signals required by §5.
- **ReviewSchedule** — one FSRS card per (user, item-or-concept). Stores FSRS `stability`,
  `difficulty`, `due`, `reps`, `lapses`, `state`. The review queue is
  `WHERE userId = ? AND due <= now() ORDER BY due` — hence the `@@index([userId, due])`.

### Exam & speaking

- **ExamBlueprint** declares an SLE-style form (counts per skill/concept/difficulty).
  **ExamAttempt** is a sitting; **ExamItem** is the per-item record (supports both
  fixed-form and computer-adaptive forms — `thetaFinal` for the adaptive case).
- **SpeakingAttempt** stores audio, ASR transcript, the four rubric scores
  (pronunciation/fluency/grammar/vocab), and structured feedback (model answer,
  improvements, alternatives, stronger workplace phrasing) — exactly requirement §8.

## Key indexes (performance-critical paths)

| Query | Index |
|-------|-------|
| Adaptive item selection by objective/band/status | `Item @@index([objectiveId, difficulty, status])` |
| Skill-filtered item pools | `Item @@index([skill, status])` |
| Per-user item history (suppress recently seen, count attempts) | `Attempt @@index([userId, itemId])` |
| Item statistics (p-value, discrimination) | `Attempt @@index([itemId, isCorrect])` |
| Due review queue | `ReviewSchedule @@index([userId, due])` |
| Dashboard buckets | `ObjectiveProgress @@index([userId, state])` |
| Concept track lookups | `ConceptMastery @@index([userId, conceptKind])` |

## Integrity rules enforced in the app layer (not expressible in SQLite DDL)

1. **Explanation contract** — `Item.explanation` and `Item.tip` must be non-empty and
   structurally valid before `status` may move to `live`. Enforced in the content
   validator and the item-publish service.
2. **Live-only serving** — selection queries always filter `status = 'live'`.
3. **Distractor rule** — MCQ-family `type`s require ≥ 2 distractors, each with a `tag` that
   has a matching key in `explanation.distractor_why`.
4. **Stage gating** — `ObjectiveProgress.stageReached` may only advance when the prior
   stage's exit condition (curriculum map §"Module anatomy") is met.

## Migration & seeding

```bash
# dev
npx prisma migrate dev --name init
npx ts-node scripts/load-content.ts      # validates content/ then upserts
npx ts-node scripts/generate-items.ts    # expands templates → Items (status=needsReview)
```

`load-content.ts` is idempotent (upsert by stable ids). `generate-items.ts` is
deterministic (item id = hash(template, slotValues)), so re-running never duplicates.

## Postgres production notes

- Switch `provider = "postgresql"`; enums become native; change `Json` columns to map to
  `jsonb`; `secondarySkills` → `Skill[]`.
- Add partial indexes for hot paths, e.g. `CREATE INDEX ON "Item"(objectiveId, difficulty)
  WHERE status = 'live';`.
- Consider a `pg_trgm` GIN index on `LexiconEntry.fr` for fuzzy lexicon search.
- Heavy analytics (item stats, calibration) should run against a read replica or a nightly
  materialized view, not the OLTP primary.
