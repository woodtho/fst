# Documentation index

Read in this order. Each builds on the previous.

| Doc | What it answers |
|-----|-----------------|
| [01 — Curriculum Map](01-curriculum-map.md) | What is taught: the 40 PFL2 objectives, the five filter axes, module anatomy, grammar/vocab tracks. |
| [02 — Question Bank Architecture](02-question-bank-architecture.md) | How items are modelled, the 17 question types, difficulty/IRT, the variation engine, the explanation contract, exam pools. |
| [03 — Database Schema](03-database-schema.md) | How it is stored. Companion to [`prisma/schema.prisma`](../prisma/schema.prisma). |
| [04 — API Design](04-api-design.md) | How clients talk to it: catalog, sessions, self-test, review, exams, speaking, progress; study-vs-exam contract. |
| [05 — Adaptive Learning Framework](05-adaptive-learning-framework.md) | The brain: signals, IRT ability, difficulty adaptation, mastery, FSRS spaced repetition, remediation, readiness prediction, speaking scoring. |
| [06 — UI Specification](06-ui-specification.md) | Screens, the reusable exercise runner, component map, accessibility, responsive. |
| [07 — Content Generation Guide](07-content-generation-guide.md) | How content is authored/generated, item-writing standards, LLM prompts, the QA gate. |

## Requirement → artifact traceability

| Prompt requirement | Where addressed |
|--------------------|-----------------|
| 1. Content organization (level/skill/theme/objective) | Curriculum map; `content/curriculum.json` |
| 2. Module structure (Learn→Mastery) | Curriculum map §Module anatomy; `content/modules/*.json` |
| 3. Question generation (easy/medium/advanced, variations) | Question bank §2–4; templates |
| 4. Explanations & feedback | Question bank §5; enforced by `scripts/validate-content.ts` |
| 5. Adaptive learning | Framework §1–6; schema (Attempt, ConceptMastery, ReviewSchedule) |
| 6. Topic-focused study | Curriculum map track indexes; API `/objectives` + `/study` filters |
| 7. Government language testing mode | Question bank §8; API §5; `content/exams/*.json` |
| 8. Speaking practice | Framework §7; API §6; schema SpeakingAttempt |
| 9. Progress tracking | Framework §9; API §7; UI Dashboard/Progress |
| 10. Content generation rules | Content guide; validator |

## Seed content shipped

- `content/curriculum.json` — all **40** objectives (complete).
- `content/modules/A01.json`, `A11.json` — two fully-authored modules (all 5 stages).
- `content/question-bank/items/A11.json` — 7 items with full explanation contracts.
- `content/question-bank/templates/tmpl_pc_regular_er.json` — variation template (~60 items).
- `content/grammar/passe_compose.json` — grammar charts + rules.
- `content/lexicon/government.json`, `workplace.json` — lexicon entries.
- `content/exams/blueprint-reading-A.json` — SLE-style reading blueprint.
- `scripts/validate-content.ts`, `scripts/load-content.ts` — QA + ingest.

To extend to full coverage: author the remaining 38 modules and per-objective item banks
following the shipped shapes, run `validate-content.ts` (gate), then `load-content.ts`.
