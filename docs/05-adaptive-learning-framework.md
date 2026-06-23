# 05 — Adaptive Learning Framework

This is the brain of the platform: how raw attempts become mastery estimates, how the next
item/objective is chosen, how reviews are scheduled, how weak concepts are remediated, and
how readiness is predicted. It satisfies requirement §5 (track accuracy, response time,
confidence, attempts; raise difficulty after success; reintroduce weak concepts; schedule
spaced repetition; generate remediation) and §9 (readiness prediction).

## 1. Signals captured per attempt

Every `Attempt` records four signals (schema §Attempt):

| Signal | Field | Use |
|--------|-------|-----|
| **Accuracy** | `isCorrect`, `partialScore` | primary mastery + IRT evidence |
| **Response time** | `responseMs` | fluency proxy; fast-correct → stronger evidence, slow-correct → fragile |
| **Confidence** | `confidence` (1–5) | calibration; over/under-confidence flags |
| **Attempts** | `attemptNo` | struggle signal; first-try correct weighted higher |

## 2. Ability model — IRT (the statistical core)

Each learner has an **ability estimate `theta`** (logit scale) on each cross-cutting track
(`ConceptMastery`: grammar concept, vocab domain, skill) and, derived, per objective. Each
item has a difficulty `irtB` and discrimination `irtA` (question-bank §3).

Probability of a correct response (2-parameter logistic):

```
P(correct | theta, a, b) = 1 / (1 + exp(-a * (theta - b)))
```

**Update rule** (online, after each attempt) — Bayesian/EAP-style or simple Elo-rated
fallback at MVP:

```
# MVP: Elo-style (cheap, robust, no batch needed)
expected = 1 / (1 + 10^((irtB - theta)/0.4))
theta   += K(thetaSe, responseMs, attemptNo) * (score - expected)
thetaSe  = shrink(thetaSe)              # SE narrows as evidence accrues
irtB    += K_item * (expected - score)  # item difficulty drifts toward calibration
```

`K` (learning rate) is **modulated by the auxiliary signals**:
- larger when `thetaSe` is high (early, uncertain) — converge faster;
- reduced for slow-correct responses (`responseMs` ≫ `estTimeSec`) — fragile knowledge;
- reduced when `attemptNo > 1` — credit partial.

A nightly **batch calibration** (when ≥ 200 responses/item) replaces the drifted `irtB`
with a proper MLE/EAP estimate and re-bands items that disagree with their authored band
by > 1 logit (question-bank §7).

## 3. Difficulty adaptation (within a session)

Item selection targets the item whose `irtB` is near the learner's current `theta` plus an
**offset** that creates desirable difficulty:

```
targetB = theta + 0.5         # ~62% success → in the productive struggle zone
```

- **After a correct streak** (e.g. 3 in a row at band): raise `targetB` by 0.4 → harder
  items, escalating easy→medium→advanced as `theta` crosses band thresholds.
- **After errors**: lower `targetB`, fall back a band, and inject a scaffolded item.
- **Recency suppression**: items seen in the last N attempts or due > 1 day out are
  excluded unless the session mode is `review`.
- **Content balance**: within an objective session, spread across its grammar concepts and
  themes so one sub-skill doesn't dominate.

Selection query (conceptual):

```sql
SELECT * FROM Item
WHERE status='live' AND objectiveId=:obj AND difficulty IN (:bands)
  AND id NOT IN (:recentlySeen)
ORDER BY abs(irtB - :targetB) ASC, timesServed ASC   -- prefer under-exposed items
LIMIT :k;
```

## 4. Mastery model (per objective)

`ObjectiveProgress.masteryScore ∈ [0,1]` blends evidence rather than using raw accuracy:

```
mastery =  0.45 * accuracy_recent          # weighted recent correctness (last ~20 items)
         + 0.25 * sigmoid(theta_objective)  # IRT ability over the objective's items
         + 0.15 * coverage                  # fraction of the objective's concepts attempted
         + 0.10 * retention                 # success on items resurfaced after ≥1 day
         + 0.05 * fluency                    # share of correct items answered within estTime
```

- `accuracy_recent` uses a **decayed** average (recent attempts weighted higher) so
  improvement shows up quickly and old mistakes fade.
- **States** (`MasteryState`): `not_started → learning → review → mastered`, with `weak`
  set whenever a previously-higher mastery drops below 0.6 (triggers reintroduction).

**Mastery check recommendation** (API §3):

| masteryScore | confidence | recommendation |
|--------------|-----------|----------------|
| ≥ 0.80 | ≥ 0.70 | **pass** |
| ≥ 0.80 | < 0.70 | **pass** (flag: low confidence — verify with one more self-test) |
| 0.65–0.79 | any | **almost** |
| < 0.65 | any | **keep practicing** |

**Confidence score** = rolling mean of self-rated `confidence` (1–5 → 0..1), **penalized
for miscalibration**: if the learner rates 5 but is frequently wrong, confidence is
discounted (calibration gap surfaced as a study tip).

## 5. Spaced repetition (FSRS)

Long-term retention uses **FSRS** (Free Spaced Repetition Scheduler) over `ReviewSchedule`
cards. Cards exist at two granularities:
- **item cards** — specific items the learner missed or that are mastery-critical;
- **concept cards** — a representative draw from a grammar concept / vocab set, so review
  rotates *variations* (avoids memorizing one surface form).

On each review, the learner's outcome maps to an FSRS grade
(`again | hard | good | easy`) derived from `isCorrect`, `partialScore`, `responseMs`, and
`confidence`. FSRS updates `stability` and `difficulty` and sets the next `due`. Lapses
(again) drop the card to `relearning` and **flag the parent concept as weak**.

The due queue (API §4) feeds the daily review session; the dashboard shows `dueToday`.

## 6. What to do next (recommendation policy)

`GET /api/recommendations` ranks candidate actions by **expected learning gain per minute**:

1. **Overdue reviews** — highest priority once `due` passes (retention protects prior
   investment). Capped per day to avoid review pile-ups.
2. **Weak-concept remediation** — for any concept with accuracy < 0.6 or a recent lapse,
   generate a *targeted set*: items filtered to that concept at `targetB ≈ theta` plus a
   short Learn re-exposure (the relevant grammar chart / lexicon slice). See §8.
3. **Next objective** — among unlocked objectives, pick the one maximizing expected mastery
   gain, weighted by: prerequisite readiness, the learner's `targetLevel`, skill balance
   (under-practiced skills get a boost), and soft-prereq order.
4. **Stretch / readiness** — when an objective passes, surface its self-test or an
   exam-mode taste to consolidate.

## 7. Speaking scoring pipeline (requirement §8)

Pluggable; default pipeline:

```
audio ──► ASR (FR) ──► transcript
   │                      │
   ├─► forced alignment ──┴─► PRONUNCIATION: phoneme-level GOP (goodness of pronunciation) → 0..100
   ├─► VAD + timing ─────────► FLUENCY: speech rate, pause ratio, filler count → 0..100
   ├─► transcript ──► grammar checker (LanguageTool-fr / LLM) → GRAMMAR: error density → 0..100
   └─► transcript ──► lexical analysis (range, register, domain match) → VOCABULARY → 0..100
```

Scores + the prompt's model answer feed an LLM (or rule templates) to produce the four
feedback fields (model answer, improvements, alternatives, stronger workplace phrasing).
Each sub-score also updates the relevant `ConceptMastery` (skill=`speaking`, plus grammar/
vocab tracks touched). Providers are swappable behind a `SpeechScorer` interface; the MVP
can ship with browser Web Speech ASR + heuristic fluency + LanguageTool grammar, upgrading
to a hosted forced-aligner for true pronunciation GOP.

## 8. Remediation generation

When a concept is weak, the system assembles a remediation session:
- pull the concept's **grammar chart / lexicon** for a 60-second re-teach;
- select **scaffolded items** (cued fill-blank, recognition MCQ) at `targetB = theta` (not
  theta+0.5 — reduce difficulty while rebuilding);
- end with **2 transfer items** at the original objective's level to confirm recovery;
- schedule a **follow-up review** at +2 days regardless of FSRS to verify durability.

## 9. Readiness prediction (requirement §9)

Three predictors, each a calibrated logistic over features, output 0..1:

| Predictor | Features |
|-----------|----------|
| **Level A readiness** | mean mastery of A01–A18, min mastery (weakest link), coverage, retention, self-test scores |
| **Level B readiness** | same over B19–B40, gated on Level A readiness |
| **SLE readiness** | exam-mode theta per component (reading/written/oral), recency, score stability across sittings |

Outputs are shown as bands (Not yet / Approaching / Ready) with the **limiting factor**
named ("Listening is your weakest skill for Level A"). Coefficients start as sensible
priors and are refit as outcome data (actual self-test/exam passes) accumulate.

## 10. Cold start & guardrails

- **Cold start**: a 6–10 item placement mini-test estimates initial `theta` per skill;
  until then, selection uses authored bands and starts at `easy`.
- **Anti-frustration**: never serve > 2 consecutive items the model predicts < 35% success;
  inject a confidence-builder.
- **Anti-boredom**: never serve > 3 consecutive items predicted > 90% success; escalate.
- **Honesty**: mastery/readiness never inflate from review-only activity without fresh
  unseen items — retention and transfer terms require novel exposures.
