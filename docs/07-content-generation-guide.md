# 07 — Content Generation Guide

How to author (and machine-generate) the learning content so it is pedagogically sound,
legally clean, and consistent enough for the validators and adaptive engine to rely on.

## 1. Provenance & legal stance (read first)

- The **structure** (40 objectives, themes, skills, sequencing) follows the publicly
  archived GoC PFL2 framework — facts/structure, not copyrightable expression.
- All **learner-facing expression** (dialogues, texts, items, explanations) is **original**.
  Do **not** transcribe source passages or reproduce actual SLE test items.
- Exam mode **resembles** SLE format and GoC workplace register; it must not duplicate real
  test content. Blueprints define *shape*, authored items provide *content*.
- Where the source uses a specific vocabulary set (e.g. a government lexicon), we may reuse
  **individual terms** (terminology is not protected) but write our own examples.

## 2. Authoring principles (requirement §10)

1. **Communicative first** — items assess the ability to *do* something (answer a phone,
   write an email, run a meeting), not recite rules. Grammar is in service of a task.
2. **Authentic GoC workplace contexts** — managers, briefing notes, scheduling a meeting,
   replying to a citizen, requesting leave, minutes, action items. Names/orgs are generic
   and fictional (Mme Tremblay, la Direction des opérations).
3. **Many examples per concept** — every concept gets ≥ the inventory targets
   (question-bank §4). Prefer templated variation over near-duplicate hand items.
4. **Always answer keys + full explanation** — no item ships without the explanation
   contract (question-bank §5). This is enforced, not optional.
5. **FR with EN where pedagogically useful** — instructions and glosses in EN at Level A;
   taper EN scaffolding through Level B. Content FR is always primary.
6. **Register-aware** — mark `informal` (tu, salut) vs `formal` (vous, formules de
   politesse). GoC workplace defaults to `vous`/formal.

## 3. Item-writing standards

- **One learning point per item.** If an item tests two unrelated things, split it.
- **Plausible distractors** — each distractor encodes a *named misconception* (`tag`) that
  must appear in `explanation.distractor_why`. No throwaway/silly options.
- **Unambiguous key** — exactly one defensible answer (or an explicit accepted-set for open
  items). Open answers ship a `normalizer` (accent/case/trim) and, where safe, a `regex`.
- **Balanced options** — similar length/structure; correct answer not systematically
  longest; randomize option order at serve time.
- **Level-appropriate vocabulary** — don't let an A-level grammar item fail on B-level
  vocab. Keep incidental vocab within or below the objective's level.
- **Cultural neutrality & inclusion** — varied names, no stereotypes, no region-locked
  idioms without a gloss.

## 4. Difficulty calibration (authoring intent)

| Band | Heuristics |
|------|-----------|
| easy | recognition; cued; single transformation; high-frequency vocab |
| medium | production; one clause; contextual choice; short comprehension |
| advanced | multi-clause production; scenario reasoning; multi-step comprehension; open response |

Seed `irtB` from band (`easy −1.0 / medium 0.0 / advanced +1.0`); the calibration job
(framework §2) corrects it from real responses.

## 5. Explanation & tip authoring

Each explanation must answer, in plain language a learner can act on:
- **correct_why** — the rule *applied to this item* (not just the abstract rule).
- **distractor_why** — one entry per distractor `tag`, naming the misconception.
- **grammar_rule** — the general rule (FR rule statement OK with EN gloss).
- **vocab_notes** — gender, collocations, false-friend warnings.
- **common_mistakes** — 1–3 typical learner errors for this point.

Tip = **memory_aid** (mnemonic), **pattern** (the transferable rule-of-thumb), **similar**
(2–3 worked analogues). Tips should help *retention*, not restate the answer.

## 6. Content file formats

All authored content lives in `content/` as JSON validated by JSON Schemas
(`content/_schemas/`). Loaders (`scripts/load-content.ts`) upsert by stable ids.

```
content/
  curriculum.json                # index of all 40 objectives (ships complete)
  _schemas/                      # JSON Schemas for each content type
  modules/<objectiveId>.json     # Learn/Practice/Consolidation/Self-test content
  question-bank/items/<obj>.json # authored items
  question-bank/templates/*.json # variation templates
  lexicon/<domain>.json          # lexicon entries
  grammar/<concept>.json         # grammar charts
```

See the shipped samples for the canonical shapes: `content/modules/A01.json`,
`content/modules/A11.json`, `content/question-bank/items/A11.json`,
`content/question-bank/templates/tmpl_pc_regular_er.json`, `content/grammar/passe_compose.json`,
`content/lexicon/government.json`.

## 7. LLM-assisted generation (scaling content)

Use an LLM (latest Claude — e.g. `claude-opus-4-8` for authoring, a cheaper model for
bulk variation) to expand templates and draft items, then validate + human-review. A
generation prompt skeleton:

```
SYSTEM: You are an FSL item writer for Government of Canada French Levels A/B.
Write ORIGINAL items — never copy source/test material. GoC workplace register, vous-form.
Return JSON conforming to the item schema. Every item MUST include the full explanation
contract and a learning tip. One learning point per item. Distractors must encode named
misconceptions.

USER: Objective A11 (passé composé, workplace). Difficulty: medium. Type: error_correction.
Concept focus: avoir vs être auxiliary. Produce 8 items as a JSON array. Themes: workplace
email, scheduling. Keep incidental vocabulary at or below Level A.
```

Generation output is written with `status: needsReview`. Promotion to `live` requires:

## 8. QA checklist (gate to `live`)

- [ ] Validates against the JSON Schema.
- [ ] Linguistic linter passes (agreement, elision/contraction, gender from lexicon).
- [ ] Exactly one defensible answer (or explicit accepted-set with normalizer).
- [ ] Every distractor `tag` has a `distractor_why` entry.
- [ ] Explanation contract complete (5 fields) + tip complete (3 fields).
- [ ] Band matches the difficulty heuristics; incidental vocab ≤ objective level.
- [ ] No source/test reproduction (originality check).
- [ ] Inclusive, register-correct, culturally neutral.
- [ ] (After ~200 responses) calibrated `irtB` within 1 logit of band, else re-band.

## 9. Maintenance loop

Item stats (question-bank §7) drive auto-retire/re-band; the learner **flag queue** routes
ambiguous items back to `needsReview`. Lexicon and grammar charts are versioned so a fix
propagates to every item that references them.
