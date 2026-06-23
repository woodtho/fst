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

## Source-fidelity policy (per-OF question banks)

**Every question in an objective's bank is directly traceable to the Government of Canada
PFL2 source materials.** The generator does not invent generic French content, does not use
external textbooks, and does not introduce vocabulary or grammar not taught in that
objective's source. Coverage of the source is prioritized over question variety; where the
source has no auto-extractable written questions, the bank is left small or empty rather
than padded.

`npm run build:modules` first identifies each objective's level, training objective, source
document, **taught vocabulary** (its section of the PFL2 Lexique) and **taught grammar**
(`content/curriculum.json`, derived from the OF document), then assembles the bank from only:

1. **Verbatim source activities** — real fill-in-the-blank exercises + their published
   answer keys (CORRIGÉ), extracted from the OF document by
   [`scripts/extract-source-activities.ts`](scripts/extract-source-activities.ts) into
   [`content/question-bank/source/`](content/question-bank/source/).
2. **Source-vocabulary questions** — French↔English MCQs and matching built **only** from
   that OF's own Lexique section ([`content/lexicon/by-of/`](content/lexicon/by-of/)); no
   untaught or cross-module vocabulary.

**Traceability:** every item carries a `trace` block — `sourceDocument`, `trainingObjective`,
`level`, `page` (where available), `topic`, `vocabularySet`, `grammarConcepts`.

**Current coverage:** ~2,270 source-traceable items; **38/40 objectives have questions**;
OF34/OF35 have none (their source activities are oral/open-ended and their Lexique sections
are too small to form questions). Regenerate with `npm run extract:source && npm run
build:modules`, then `npm run validate`.

> The standalone **conjugation tool** (`/tools/conjugation`) is a generic practice utility
> kept by request; it is separate from the per-OF banks, which remain strictly source-bound.

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

## Deploying (Vercel)

This is a server-rendered Next.js app (API routes for grading, dynamic routes, request-time
randomization), so it needs a host that runs Node — **Vercel** is the natural fit and deploys
straight from this GitHub repo.

**One-time setup** (in the browser, ~2 min):
1. Go to **vercel.com** → log in with GitHub → **Add New… → Project**.
2. **Import** the `woodtho/fst` repository.
3. Framework preset auto-detects **Next.js** — leave the defaults (build `next build`, output handled automatically). No env vars required.
4. Click **Deploy**.

After that, **every `git push` to `main` auto-deploys** (and PRs get preview URLs). The live
URL will be something like `https://fst.vercel.app`.

Notes:
- [`next.config.mjs`](next.config.mjs) uses `outputFileTracingIncludes` so the `content/**`
  JSON and `sources/manifest.json` (read at runtime via `fs`) are bundled into the serverless
  functions — without this the app would 500 in production.
- [`.vercelignore`](.vercelignore) keeps the 99 MB of source PDFs/text out of the deploy
  (they're build/authoring-time only; the app never reads them at runtime).
- The local `next build` fails only because this folder name contains a space — Vercel builds
  in a space-free path, so it's unaffected.

> **Why not GitHub Pages?** Pages serves static files only; it can't run the grading API
> (`/api/check`, `/api/conjugate`) or the dynamic server rendering. Hosting on Pages would
> require a static export that moves grading into the browser (shipping the answer keys in the
> client bundle). Vercel keeps the app working exactly as built.

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
