# 04 — API Design

A REST-ish API over Next.js App Router route handlers (`app/api/**/route.ts`). JSON
everywhere. Auth via Auth.js session cookie; the user id is derived server-side from the
session — clients never pass `userId`. All list endpoints support cursor pagination
(`?cursor=&limit=`). All mutating endpoints are idempotent where noted.

Conventions:
- Base path `/api`. Versioned via header `X-API-Version: 1` (default 1).
- Errors: `{ "error": { "code": "string", "message": "string", "details"?: any } }`,
  standard HTTP status codes.
- Times are ISO-8601 UTC. Enums match the Prisma enums.

---

## 1. Catalog & content (read)

### `GET /api/objectives`
Filterable index of the 40 modules. Powers every §6 filter.

Query params (all optional, combinable): `level`, `skill`, `theme`, `grammarConcept`,
`vocabDomain`, `q` (text search), `state` (per-user progress filter).

```jsonc
// 200
{
  "items": [
    {
      "id": "A11", "level": "A", "orderIndex": 11,
      "titleFr": "Parler d'événements passés (récents)",
      "titleEn": "Talk about recent past events",
      "primarySkill": "speaking",
      "themes": ["workplace", "daily_life"],
      "grammarConcepts": ["passe_compose"],
      "vocabDomains": ["workplace"],
      "progress": { "state": "learning", "masteryScore": 0.42, "stageReached": "practice" }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/objectives/:id`
Full module: metadata + the five stage modules (Learn/Practice/Consolidation/Self-test/
Mastery) with `content`, plus prerequisite/unlock edges and the learner's progress.

### `GET /api/objectives/:id/modules/:stage`
A single stage's content (e.g. `learn`). Learn returns concept prose, vocab list (resolved
`LexiconEntry`s), grammar notes + chart refs, pronunciation guidance, dialogues, texts.

### `GET /api/lexicon?domain=&q=&level=`
Lexicon entries (fr/en, gender, register, example, audio). Backs the Vocabulary track and
in-exercise glossing.

### `GET /api/grammar/:conceptId`
Grammar chart(s) for a concept (conjugation tables, rule rows) + linked objectives.

---

## 2. Study sessions (the practice/learn loop)

A **session** wraps a sequence of item attempts in a mode. The server selects items
adaptively; the client renders and submits responses.

### `POST /api/sessions`
Start a session.

```jsonc
// request
{
  "mode": "practice",            // study|practice|consolidation|self_test|review|speaking
  "objectiveId": "A11",          // optional for review/cross-cutting modes
  "filters": {                   // optional — drives §6 topic-focused study
    "level": "A", "skill": "grammar", "grammarConcept": "passe_compose"
  },
  "timed": false,
  "length": 12                   // requested item count (server may adjust)
}
// 201
{ "sessionId": "ses_...", "mode": "practice", "estimatedCount": 12 }
```

### `GET /api/sessions/:id/next`
Returns the next item chosen by the adaptive selector (framework §6). The item is
**sanitized** — no `answer`/`explanation`/`distractor` tags leak.

```jsonc
// 200
{
  "item": {
    "id": "itm_a11_pc_0007", "type": "fill_blank", "difficulty": "medium",
    "skill": "writing", "estTimeSec": 40,
    "prompt": { "fr": "Hier, j'___ (envoyer) le rapport.", "instructions_en": "Passé composé." },
    "options": null,             // populated for MCQ-family (order randomized)
    "media": { "audioUrl": null }
  },
  "progress": { "served": 4, "remaining": 8 },
  "sessionComplete": false
}
```

### `POST /api/sessions/:id/attempts`
Submit a response; get immediate scored feedback **including the full explanation** (study/
practice modes). In `exam`/`self_test` timed mode, feedback may be deferred to session end
(see §"study vs exam").

```jsonc
// request
{
  "itemId": "itm_a11_pc_0007",
  "response": { "type": "text", "value": "ai envoyé" },
  "responseMs": 7321,
  "confidence": 4               // optional 1..5
}
// 200
{
  "isCorrect": true,
  "partialScore": 1,
  "correctAnswer": { "display": "ai envoyé" },
  "explanation": { "correct_why": "...", "distractor_why": {...}, "grammar_rule": "...",
                   "vocab_notes": "...", "common_mistakes": [...] },
  "tip": { "memory_aid": "...", "pattern": "...", "similar": [...] },
  "masteryDelta": { "objectiveId": "A11", "from": 0.40, "to": 0.46 },
  "scheduledReview": { "itemId": "itm_a11_pc_0007", "due": "2026-06-26T00:00:00Z" }
}
```

### `POST /api/sessions/:id/finish`
Ends the session, returns a summary (score, per-concept breakdown, items to review,
mastery changes, recommended next action).

---

## 3. Self-test & mastery check

### `POST /api/objectives/:id/self-test`
Spins up a `self_test` session (timed or untimed, adaptive progressive difficulty). Same
attempt loop as §2.

### `GET /api/objectives/:id/mastery-check`
Computes the mastery recommendation from current evidence (framework §4).

```jsonc
// 200
{
  "objectiveId": "A11",
  "recommendation": "pass",          // pass | almost | keep_practicing
  "masteryScore": 0.83,
  "confidence": 0.78,
  "weakAreas": [
    { "concept": "agreement_past_participle", "kind": "grammar", "accuracy": 0.55,
      "suggestion": "Targeted set on participle agreement with avoir." }
  ],
  "recommendedNext": { "type": "remediation", "sessionTemplate": {...} }
}
```

---

## 4. Adaptive / review

### `GET /api/review/due?limit=`
The spaced-repetition queue: cards with `due <= now()` ordered by `due`. Returns items +
why-resurfaced metadata.

### `POST /api/review/sessions`
Convenience: start a `review` session pre-loaded from the due queue.

### `GET /api/recommendations`
What to do next (framework §6): next objective, weak-concept remediation, due reviews,
exam-readiness nudges.

```jsonc
// 200
{
  "nextObjective": { "id": "A12", "reason": "highest expected gain", "expectedGain": 0.21 },
  "remediation": [ { "objectiveId": "A11", "concept": "agreement_past_participle" } ],
  "dueReviews": 14,
  "readiness": { "levelA": 0.71, "levelB": 0.12, "sle": 0.34 }
}
```

---

## 5. Exam mode (SLE prep)

### `GET /api/exams/blueprints?component=&level=`
Lists available SLE-style blueprints (Reading / Written Expression / Oral).

### `POST /api/exams`
Start an exam from a blueprint. Returns an `examAttemptId`. Items are delivered one at a
time (adaptive form) or as a fixed set, **with feedback withheld until submission** (exam
mode contract, §"study vs exam").

### `GET /api/exams/:id/next` · `POST /api/exams/:id/attempts` · `POST /api/exams/:id/submit`
Same shape as sessions, but: timer enforced server-side; no per-item explanation returned
mid-exam; `submit` returns the full review (every item, correct answer, explanation),
scaled score, and **predicted level** (A / B / readiness for SLE).

```jsonc
// POST /api/exams/:id/submit → 200
{
  "scaledScore": 0.78, "thetaFinal": 0.62,
  "predictedLevel": "B",
  "componentBreakdown": { "reading": 0.81, "grammar": 0.70 },
  "review": [ { "itemId": "...", "yourAnswer": "...", "correct": "...", "explanation": {...} } ],
  "readiness": { "sle_reading": 0.74 }
}
```

---

## 6. Speaking practice

### `POST /api/speaking/attempts`
Multipart: audio blob + `itemId`. Server runs ASR + scoring (framework §7), returns scores
and structured feedback.

```jsonc
// 200
{
  "transcript": "Hier j'ai envoyé le rapport au gestionnaire.",
  "scores": { "pronunciation": 82, "fluency": 75, "grammar": 90, "vocabulary": 80 },
  "feedback": {
    "modelAnswer": "Hier, j'ai transmis le rapport au gestionnaire avant la réunion.",
    "improvements": ["Liaison 'j'ai' is good; work on the nasal in 'gestionnaire'."],
    "alternatives": ["faire parvenir", "transmettre", "acheminer"],
    "strongerPhrasing": ["J'ai fait parvenir le rapport au gestionnaire en fin de journée."]
  }
}
```

### `GET /api/speaking/items?objectiveId=&kind=`
Lists oral prompts (`oral_short_response`, `oral_roleplay`) with scenario context.

---

## 7. Progress & dashboard

### `GET /api/progress/overview`
Everything the dashboard (UI §Dashboard) needs in one call.

```jsonc
// 200
{
  "level": { "A": 0.71, "B": 0.12 },
  "skills": { "reading": 0.68, "writing": 0.55, "listening": 0.49,
              "speaking": 0.40, "grammar": 0.62, "vocabulary": 0.70 },
  "mastered": [ { "id": "A01", "titleEn": "Greet, introduce..." } ],
  "weak": [ { "id": "A09", "accuracy": 0.52 } ],
  "recommendedNext": [ { "id": "A12" } ],
  "readiness": { "levelA": 0.71, "levelB": 0.12, "sle": 0.34 },
  "streak": { "days": 6, "dueToday": 14 }
}
```

### `GET /api/progress/objectives/:id` · `GET /api/progress/concepts?kind=`
Drill-downs for a single objective and for the grammar/vocab/skill tracks.

---

## 8. Study vs. exam mode (the cross-cutting contract)

| Aspect | Study / Practice | Exam (self-test timed, SLE) |
|--------|------------------|------------------------------|
| Per-item explanation | returned immediately | withheld until `submit` |
| Timer | optional, advisory | enforced server-side; auto-submit on expiry |
| Item selection | adaptive, may repeat for mastery | blueprint-balanced, no repeats |
| Hints / reveal answer | allowed | disabled |
| Mastery/FSRS updates | yes | yes, plus exam-calibrated theta |
| Confidence rating | prompted | optional |

The same `Item` records serve both; the **mode flag** on the session/exam controls
sanitization and feedback timing. This is how "support both study mode and exam mode"
(requirement §10) is met with one content store.

## 9. Auth & rate limits

- Auth.js session required for everything except `GET /api/objectives` and
  `GET /api/grammar/*` (public catalog browse).
- Write endpoints: 60 req/min/user; ASR speaking endpoint: 20 req/min/user (cost guard).
- Server validates all enum/range inputs with Zod; rejects unknown fields.
