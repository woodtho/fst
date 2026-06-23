# FSL Trainer — Government of Canada French Levels A & B + SLE Prep

An adaptive, self-directed French-as-a-Second-Language (FSL) learning and self-testing
platform built on the structure of the Government of Canada **Programme de français
langue seconde (PFL2)**, Levels A and B. The goal is to take a learner to GoC proficiency
**Level A** and **Level B** and prepare them for the **Second Language Evaluation (SLE)**
(Reading, Written Expression, Oral) tests.

> **Content provenance.** The **40 training objectives** (titles, sequencing, grammar
> scope, A/B split) are taken from the actual archived PFL2 source documents now stored in
> [`sources/`](sources/) — see [`sources/manifest.json`](sources/manifest.json). The
> **lexicon** is parsed faithfully from the official PFL2 Lexique into
> [`content/lexicon/by-of/`](content/lexicon/by-of/). The **consolidation** and
> **self-evaluation** booklets are downloaded and indexed per objective. All authored
> **practice items** (questions, distractors, explanations) are **original content written
> to those objectives** — they do not reproduce source passages or actual SLE test items.
> See [docs/07-content-generation-guide.md](docs/07-content-generation-guide.md).

## Source documents (`sources/`)

The real PFL2 materials are downloaded into the project:

| Path | What |
|------|------|
| [`sources/pdf/SC102-2-{1..40}-2005-fra.pdf`](sources/pdf/) | The 40 Objectifs de formation (OF 1–40). |
| `sources/pdf/SC102-2-47-{1..4}-2006-fra.pdf` | Consolidation booklets (OF 1–12, 13–22, 23–32, 33–40). |
| `sources/pdf/SC102-2-45-{1..4}-2006-fra.pdf` | Self-evaluation booklets (same OF ranges). |
| `sources/pdf/SC102-2-1-2-2005-fra.pdf` | The PFL2 Lexique (3,000+ bilingual entries). |
| `sources/text/*.txt` | UTF-8 text extracted from every PDF (via `pdftotext`). |
| [`sources/manifest.json`](sources/manifest.json) | Index: every OF + supplement → title, level, catalogue code, pdf, text. |

These drive the app: [`content/curriculum.json`](content/curriculum.json) carries the
authentic titles/grammar, [`content/lexicon/by-of/`](content/lexicon/by-of/) holds the
parsed source lexicon (regenerate with `npm run lexicon:parse`), and the module hub shows
the covering consolidation/self-evaluation booklet per objective.

## Module content status (all 40 implemented)

Every objective has a playable module (Learn + Practice) and an item bank — **369 questions**
in total, each with the full explanation contract.

| Tier | Objectives | How authored |
|------|-----------|--------------|
| **Hand-authored, full depth** | OF1, OF13 | Written directly from the source PDF: concept, real vocabulary tables, grammar charts, dialogues, example texts, and 20+ bespoke items (incl. matching) grounded in the source activities and answer keys. |
| **Generated from source grammar scope** | OF2–OF40 (38 modules) | `npm run build:modules` maps each OF's authentic grammar concepts (extracted from its source doc) onto a hand-authored **concept library** ([`content/_concepts/library.json`](content/_concepts/library.json)) covering all 16 grammar concepts. Each module gets concept-accurate grammar notes + a question bank (4 items per concept, rotated per OF), plus the OF's **full source vocabulary** auto-rendered on the Learn page and links to its consolidation/self-evaluation booklets. |

Regenerate the bulk modules anytime with `npm run build:modules` (deterministic), then
`npm run validate` (enforces the explanation contract on all 369 items).

> The generated tier gives every objective real, schema-valid, fully-explained grammar
> practice tied to its source-derived scope. The richest hand-authored depth (source
> dialogues, bespoke communicative items, vocabulary tables) currently exists for OF1 and
> OF13; the same treatment can be applied OF-by-OF on top of the generated baseline.

## What's in this repository

This is a **design package + seed content** deliverable. It is everything needed to
build the application, plus enough authored content to stand up a working vertical slice.

| Path | Purpose |
|------|---------|
| [docs/01-curriculum-map.md](docs/01-curriculum-map.md) | The 40 PFL2 training objectives as modules, mapped to levels, skills, themes, grammar & vocab domains. |
| [docs/02-question-bank-architecture.md](docs/02-question-bank-architecture.md) | Question types, difficulty model, variation/templating engine, explanation contract. |
| [docs/03-database-schema.md](docs/03-database-schema.md) | Entity-relationship design and rationale (Prisma source in `prisma/schema.prisma`). |
| [docs/04-api-design.md](docs/04-api-design.md) | REST/RPC endpoints, request/response shapes, auth, study vs. exam modes. |
| [docs/05-adaptive-learning-framework.md](docs/05-adaptive-learning-framework.md) | Mastery model, spaced repetition (FSRS), difficulty adaptation, remediation, readiness prediction. |
| [docs/06-ui-specification.md](docs/06-ui-specification.md) | Screen inventory, component specs, interaction flows, accessibility. |
| [docs/07-content-generation-guide.md](docs/07-content-generation-guide.md) | Authoring rules, item-writing standards, LLM generation prompts, QA checklist. |
| [prisma/schema.prisma](prisma/schema.prisma) | Runnable Prisma schema (SQLite dev / Postgres prod). |
| [content/curriculum.json](content/curriculum.json) | Machine-readable index of all 40 objectives. |
| [content/modules/](content/modules/) | Fully-authored sample modules (Learn/Practice/Consolidation/Self-test). |
| [content/question-bank/](content/question-bank/) | Seed question bank with full explanations & templates. |
| [content/lexicon/](content/lexicon/) | Government/workplace lexicon with glosses, gender, register. |
| [content/grammar/](content/grammar/) | Grammar charts (conjugation, agreement, etc.) as structured data. |

## Practice tools

Beyond the per-objective modules, the app has cross-cutting tools (top nav):

| Tool | Route | What it does |
|------|-------|--------------|
| **Grammar** | `/tools/grammar` | The 16 grammar concepts, each with rules and a cross-OF practice set (pulls questions from every objective that uses the concept). |
| **Conjugation** | `/tools/conjugation` | Live conjugation drills across 6 tenses (présent, passé composé, imparfait, futur simple, conditionnel, subjonctif) for 25+ regular and irregular verbs. A real engine ([`lib/conjugation.ts`](lib/conjugation.ts)) generates prompts and grades server-side via `/api/conjugate`. Filter by tense or verb group. |
| **Lexicon** | `/tools/lexicon` | Searchable browser over **1,423** PFL2 vocabulary entries (French ↔ English), filterable by objective. Re-parsed from the source with `pdftotext -layout` so every entry is a clean aligned row (`npm run lexicon:parse`). |
| **Government & workplace** | `/tools/workplace` | Targeted practice on workplace vs. public-service language, drawing items by vocab domain and theme. |
| **Consolidation** | `/consolidation` | Mixed review across the four PFL2 booklet ranges (OF 1–12, 13–22, 23–32, 33–40); each session pulls from every objective in the range, in study or exam mode. |
| **Self-test** | `/learn/<OF>/self-test` | Per-objective timed, exam-mode quiz (blueprint-driven, feedback + full review at the end). Linked from every module hub. |

All of these reuse one `ExerciseRunner` (now supporting study mode, **exam mode**, timers,
and matching). Selecting questions is just filtering real items, so grading and explanations
work everywhere automatically.

## Run the app (vertical slice)

A working Next.js slice is implemented over the authored content — **no database required**
to run it (the content layer reads `content/*.json` directly; the Prisma schema remains the
production data path).

```bash
npm install
npm run dev      # http://localhost:3000
```

Then:
- **Catalog** (`/`) — all 40 objectives, filter by level. Playable modules are badged "Available".
- **Module hub** (`/learn/A11`) — the five stages.
- **Learn** (`/learn/A11/learn`) — concept, vocabulary, grammar, pronunciation, dialogues, texts.
- **Practice** (`/learn/A11/practice`) — the exercise runner: MCQ, fill-in-the-blank,
  error correction, and sentence building, with **server-side grading** and the full
  explanation + learning-tip feedback after each answer. Try **A01** (Learn) and **A11**
  (Learn + Practice, 7 questions).

What the slice implements vs. the full spec:
- ✅ Catalog/filter, module hub, Learn stage, Practice runner, 5 answer types, accent-insensitive
  grading, the explanation contract surfaced in the UI, answers kept server-side.
- 🚧 Not yet wired: user accounts, persisted progress/mastery, spaced repetition, self-test/exam
  mode, speaking practice, dashboard. These are specified in `docs/` and modelled in
  `prisma/schema.prisma`; progress in the slice is per-session only.

Other commands:

```bash
npm run validate   # content QA gate (explanation contract + distractor linkage)
npm run build      # production build — see caveat below
```

> **Windows build caveat.** `npm run dev` works in this folder. `npm run build` (production)
> fails here only because the folder name contains a **space** (`french training`) — a known
> Next.js bug on Windows that surfaces as `PageNotFoundError: /_document`. The code is fine
> (it builds cleanly from a space-free path). To produce a production build, either rename the
> folder to remove the space, or build through a space-free junction:
> ```powershell
> New-Item -ItemType Junction -Path C:\tmp\fsltrainer -Target "C:\Users\aThom\OneDrive\Documents\french training"
> cd C:\tmp\fsltrainer ; npm run build
> ```

## Recommended stack

- **App:** Next.js (App Router) + TypeScript, React Server Components for content,
  client components for interactive exercises.
- **DB/ORM:** Prisma → SQLite (local dev) / PostgreSQL (prod). Schema is Postgres-safe.
- **Auth:** Auth.js (NextAuth) — email + OAuth.
- **State/data:** TanStack Query for client data, Zustand for ephemeral exercise state.
- **Scheduling:** FSRS (Free Spaced Repetition Scheduler) for review timing.
- **Speech:** Web Speech API for capture in-browser; server-side pronunciation scoring via
  a forced-alignment / ASR service (pluggable — see adaptive framework §7).
- **Content pipeline:** JSON content authored/validated against schemas in `content/`,
  loaded into the DB by a seed script.

## Build order (suggested)

1. Apply `prisma/schema.prisma`, write the content loader, import `content/`.
2. Implement Learn + Practice + Self-test for one module end-to-end (vertical slice).
3. Wire the adaptive scheduler (attempts → mastery → review queue).
4. Add the dashboard and readiness predictors.
5. Add SLE exam mode (Reading / Written Expression / Oral).
6. Add speaking practice + scoring.

## Levels at a glance

- **Level A** — survival/functional: personal info, routines, simple workplace exchanges,
  present/near-future/recent-past, basic telephone and scheduling. (Objectives A01–A18.)
- **Level B** — operational: detailed work description, meetings, professional email,
  problem-solving, narration, hypotheticals, reported speech, subjunctive notions,
  presentations. (Objectives B19–B40.)
