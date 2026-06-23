# 02 — Question Bank Architecture

The question bank is the engine of practice, self-test, consolidation, and exam mode. It
must produce **large numbers of items per concept**, at **three difficulty bands**, with
**variation** (so items are not memorized verbatim), and every item must carry a **full
explanation contract**.

## 1. Item model

An **Item** is the atomic assessable unit. Items are produced two ways:

- **Authored items** — hand-written, stored directly.
- **Templated items** — a `Template` + a `slot-fill` set generate many concrete `Item`
  instances. This is how "many variations preserving the learning objective" is achieved
  at scale (requirement §3, §10).

Every Item, however produced, conforms to one schema (see `content/question-bank/`):

```jsonc
{
  "id": "itm_a11_pc_0007",
  "objectiveId": "A11",
  "skill": "writing",
  "grammarConcepts": ["passe_compose", "agreement_past_participle"],
  "vocabDomains": ["workplace"],
  "theme": "workplace",
  "difficulty": "medium",          // easy | medium | advanced
  "type": "fill_blank",            // see §2
  "irtB": -0.3,                    // calibrated difficulty (logit); seeded from band
  "discrimination": 1.0,           // IRT a-param; default 1.0 until calibrated
  "estTimeSec": 40,
  "prompt": {
    "fr": "Hier, j'___ (envoyer) le rapport au gestionnaire.",
    "en": "Yesterday, I sent the report to the manager.",
    "instructions_en": "Write the verb in the passé composé."
  },
  "answer": {
    "type": "text",
    "accepted": ["ai envoyé"],
    "normalizer": "fr_accent_insensitive_trim_lower",
    "regex": null
  },
  "distractors": [                  // for MCQ types; empty for open
    { "value": "ai envoyer", "tag": "infinitive_for_participle" },
    { "value": "suis envoyé", "tag": "wrong_auxiliary" },
    { "value": "ai envoyée", "tag": "wrong_agreement" }
  ],
  "explanation": { /* see §5 — REQUIRED */ },
  "tip": { /* see §5 — REQUIRED */ },
  "media": { "audioUrl": null, "imageUrl": null },
  "source": { "authored": true, "templateId": null, "generator": "human" }
}
```

## 2. Question types

Grouped by the skill they best assess. Each type declares how it is **rendered**, how the
answer is **captured**, and how it is **scored**.

| Type | Skill(s) | Render | Capture | Scoring |
|------|----------|--------|---------|---------|
| `mcq_single` | all | stem + 3–4 options | radio | exact match |
| `mcq_multi` | reading, grammar | stem + options | checkbox | set match (partial credit optional) |
| `fill_blank` | grammar, writing | sentence w/ gap | text input | normalized string / regex |
| `cloze_multi` | reading, grammar | passage w/ N gaps | N inputs or dropdowns | per-gap, weighted |
| `matching` | vocab, reading | two columns | drag/connect | pairwise |
| `ordering` | reading, writing | shuffled tokens/sentences | drag-sort | sequence match |
| `sentence_build` | writing, grammar | word bank | drag tokens into order | sequence + agreement check |
| `translation_fr_en` | reading, vocab | FR sentence | text | reference + accepted-set fuzzy |
| `translation_en_fr` | writing, grammar | EN sentence | text | reference-set + grammar checks |
| `error_correction` | writing, grammar | sentence w/ error | edit / pick correction | normalized match |
| `dialogue_complete` | speaking, listening | dialogue w/ missing turn | MCQ or text | match / rubric |
| `listening_mcq` | listening | audio + stem | radio | exact match |
| `listening_dictation` | listening | audio | text | normalized + WER threshold |
| `reading_passage_set` | reading | passage + 3–6 Qs | mixed | per-question |
| `short_written_response` | writing | prompt | textarea | rubric (auto + optional LLM) |
| `oral_short_response` | speaking | prompt (+timer) | mic | ASR + pronunciation/fluency/grammar/vocab rubric |
| `oral_roleplay` | speaking | scenario + turns | mic, multi-turn | rubric per turn + holistic |

## 3. Difficulty model

Two layers:

1. **Band** (`easy` / `medium` / `advanced`) — authored intent, drives initial selection
   and the §3 mapping below.
2. **IRT difficulty** (`irtB`, logit scale) — calibrated from learner responses over time.
   Seeded from band (`easy ≈ -1.0`, `medium ≈ 0.0`, `advanced ≈ +1.0`) and updated by the
   calibration job (framework §5). Adaptive selection uses `irtB`, not the band, once
   enough responses exist (≥ 200 per item recommended; fall back to band below that).

Band → cognitive target (requirement §3):

| Band | Targets | Typical types |
|------|---------|---------------|
| **Easy** | recognition, vocab recall, basic grammar | `mcq_single`, `matching`, `fill_blank` (cued) |
| **Medium** | sentence construction, contextual vocab, reading comprehension | `sentence_build`, `cloze_multi`, `reading_passage_set`, `translation_fr_en` |
| **Advanced** | workplace scenarios, multi-step comprehension, written/oral response | `short_written_response`, `oral_roleplay`, multi-passage `reading_passage_set` |

## 4. Variation engine (templating)

A **Template** parameterizes a learning point and generates many surface forms. This keeps
items from "simply repeating source material" while holding the objective constant.

```jsonc
// content/question-bank/templates/tmpl_pc_regular_er.json
{
  "id": "tmpl_pc_regular_er",
  "objectiveId": "A11",
  "type": "fill_blank",
  "difficulty": "easy",
  "grammarConcepts": ["passe_compose"],
  "stem": "{time}, {subject} ___ ({infinitive}) {complement}.",
  "answerExpr": "{aux} {participle}",
  "slots": {
    "time": ["Hier", "La semaine dernière", "Ce matin", "Lundi dernier"],
    "subject": ["j'", "il", "elle", "nous", "le gestionnaire"],
    "infinitive": ["envoyer", "préparer", "terminer", "envoyer", "vérifier"],
    "complement": ["le rapport", "le courriel", "la réunion", "le dossier"]
  },
  "derivations": {
    "aux": "avoir.conjugate(subject)",         // pure functions in the generator lib
    "participle": "infinitive.pastParticiple()"
  },
  "constraints": [
    "subject != 'nous' OR complement != 'la réunion'"  // avoid awkward combos
  ],
  "explanationTemplate": "explanations/passe_compose_avoir.md",
  "maxInstances": 60
}
```

Generation rules:
- Slot combinations are sampled, deduplicated, and validated by `constraints` and a
  **linguistic linter** (gender/number agreement, contraction `je → j'`, elision).
- Each generated Item gets a deterministic id (`hash(template, slotValues)`) so the same
  combination is never stored twice and is stable across runs.
- Generated items are **flagged `needsReview`** until a human or a higher-tier LLM QA pass
  approves them (see content guide §QA).

Target inventory per objective (seed goal):

| Band | Items per objective | Mechanism |
|------|---------------------|-----------|
| Easy | ≥ 40 | mostly templated |
| Medium | ≥ 30 | templated + authored |
| Advanced | ≥ 15 | authored (rubric-scored) |

→ ≈ 85 items × 40 objectives ≈ **3,400 seed items** at target. The repo ships a
representative slice; the generator + templates scale it.

## 5. Explanation contract (REQUIRED on every item)

No item may be served without both blocks. This is enforced by the content validator
(`scripts/validate-content.ts`) and by a DB `CHECK`/application-layer guard.

```jsonc
"explanation": {
  "correct_why": "« ai envoyé » = avoir (présent) + participe passé. With 'avoir' and no preceding direct object, the participle does not agree, so it stays 'envoyé'.",
  "distractor_why": {
    "ai envoyer": "Infinitive instead of past participle. After the auxiliary you need the participle 'envoyé', not 'envoyer'.",
    "suis envoyé": "Wrong auxiliary. 'Envoyer' uses 'avoir', not 'être'.",
    "ai envoyée": "Over-applied agreement. No preceding direct object here, so no '-e'."
  },
  "grammar_rule": "Passé composé = auxiliaire (avoir/être) au présent + participe passé. Agreement with avoir only when a direct object precedes the verb.",
  "vocab_notes": "envoyer (to send) → participe passé 'envoyé'. Pairs: envoyer un courriel/un rapport/un dossier.",
  "common_mistakes": ["using -er infinitive as participle", "using être with avoir-verbs", "agreeing the participle by default"]
},
"tip": {
  "memory_aid": "DR & MRS VANDERTRAMP take être; almost everything else (and all -er transitives like envoyer) takes avoir.",
  "pattern": "avoir + participe passé → no agreement unless a direct object comes BEFORE.",
  "similar": ["J'ai préparé le dossier.", "Nous avons terminé la réunion."]
}
```

## 6. Tagging & retrieval

Items are indexed for every retrieval path the UI offers:

- `objectiveId`, `level`, `skill`, `theme`, `grammarConcepts[]`, `vocabDomains[]`,
  `difficulty`, `type`.
- **Composite selection** queries combine these with adaptive parameters (mastery,
  due-for-review, recently-seen suppression). See API §"sessions" and framework §6.

## 7. Quality & lifecycle states

`draft → needsReview → approved → live → retired`. Only `live` items are served to
learners. Item statistics (p-value, point-biserial, avg time, flag rate) feed:
- **Auto-retire** items with p-value > 0.97 or < 0.10, or negative discrimination.
- **Re-band** items whose calibrated `irtB` disagrees with the authored band by > 1 logit.
- **Flag queue** for learner-reported "this item is wrong/ambiguous".

## 8. Exam-mode item pools

SLE prep (requirement §7) draws from the same bank but through **fixed-form** or
**adaptive-form** blueprints that mirror SLE structure without copying test content:

| SLE component | Blueprint | Item types |
|---------------|-----------|------------|
| Reading | 4–6 passages, increasing difficulty, 25–40 items | `reading_passage_set`, `mcq_single` |
| Written Expression | sentence correction + grammar selection + completion | `error_correction`, `mcq_single`, `cloze_multi` |
| Oral | short responses, long responses, scenarios, role-play | `oral_short_response`, `oral_roleplay` |

Blueprints specify counts per `level`, `skill`, `grammarConcept`, and `difficulty` so each
generated exam is balanced and reproducible from a seed. See API §"exams".
