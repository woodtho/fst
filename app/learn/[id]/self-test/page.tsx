import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getObjective,
  getModule,
  getItems,
  getSelfEvaluationItemsForObjective,
  getSelfEvaluationQuestionsForObjective,
  getSupplementStudyGuide,
  getSupplements,
  sanitize,
  type Item
} from "@/lib/content";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function SelfTestPage({ params }: { params: { id: string } }) {
  const objective = getObjective(params.id);
  const mod = getModule(params.id);
  const items = getItems(params.id);
  const extractedItems = getSelfEvaluationItemsForObjective(params.id);
  const sourceQuestions = getSelfEvaluationQuestionsForObjective(params.id);
  const examBank = [...extractedItems, ...items.filter((it) => !extractedItems.some((supp) => supp.id === it.id))];
  if (!objective || examBank.length === 0) notFound();

  const bp = mod?.stages?.selfTest?.blueprint ?? { easy: 6, medium: 4, advanced: 2 };
  const bpTotal = (bp.easy ?? 0) + (bp.medium ?? 0) + (bp.advanced ?? 0);
  const target: number = mod?.stages?.selfTest?.examQuestions ?? (bpTotal || Math.min(16, examBank.length));
  const timed: number = mod?.stages?.selfTest?.timedSeconds ?? Math.max(180, target * 35);
  const selfEval = getSupplements(objective.of).selfEval;
  const guide = selfEval ? getSupplementStudyGuide(selfEval) : null;

  // Draw per blueprint from the OF's full bank…
  const byBand = (b: string) => shuffle(examBank.filter((it) => it.difficulty === b));
  const chosen: Item[] = [
    ...byBand("easy").slice(0, bp.easy ?? 0),
    ...byBand("medium").slice(0, bp.medium ?? 0),
    ...byBand("advanced").slice(0, bp.advanced ?? 0),
  ];
  // …then top up to the target length from any remaining items, so the exam is always full-length
  // even when the bank's difficulty mix doesn't match the blueprint.
  if (chosen.length < target) {
    const usedIds = new Set(chosen.map((it) => it.id));
    chosen.push(...shuffle(examBank.filter((it) => !usedIds.has(it.id))).slice(0, target - chosen.length));
  }
  const session = shuffle(chosen.length ? chosen : examBank.slice(0, target)).map(sanitize);

  return (
    <>
      <p className="muted"><Link href={`/learn/${objective.id}`}>← {objective.id} hub</Link></p>
      <h1 style={{ marginBottom: 2 }}>Self-test — {objective.id}</h1>
      <p className="lead">{objective.titleFr}</p>
      <div className="note">
        Exam mode: {session.length} questions, {Math.round(timed / 60)} min. Feedback and the full
        review are shown at the end (not after each question).
        {guide && <> Mirrors the PFL2 self-evaluation booklet <code>{guide.source.catalogue}</code>.</>}
      </div>
      {guide && (
        <section className="panel supplement-panel" aria-labelledby="self-eval-source">
          <div className="section-head">
            <div>
              <h2 id="self-eval-source">Self-evaluation source</h2>
              <p className="muted">{guide.title} · source text <code>{guide.source.text}</code></p>
            </div>
            <Link className="btn secondary small" href={`/consolidation/${guide.ofRange[0]}-${guide.ofRange[1]}`}>Review range</Link>
          </div>
          <p>{guide.intro}</p>
          <div className="stats-grid">
            <div><strong>{sourceQuestions.length}</strong><span>source questions extracted</span></div>
            <div><strong>{extractedItems.length}</strong><span>gradeable self-test items</span></div>
            <div><strong>OF {guide.ofRange[0]}–{guide.ofRange[1]}</strong><span>coverage range</span></div>
          </div>
          {guide.studyPoints.length > 0 && (
            <>
              <h3>Booklet study points</h3>
              <ul className="compact-list">
                {guide.studyPoints.slice(0, 10).map((point) => <li key={point}>{point}</li>)}
              </ul>
            </>
          )}
          {sourceQuestions.length > 0 && (
            <details className="source-list">
              <summary>Show all extracted self-evaluation questions for {objective.id}</summary>
              <div className="source-question-list">
                {sourceQuestions.map((q) => (
                  <article key={q.id} className="source-question">
                    <h4>{q.title}</h4>
                    <p className="fr" lang="fr">{q.promptFr}</p>
                    {q.answer && <p className="muted">Answer key: <span className="fr" lang="fr">{q.answer}</span></p>}
                  </article>
                ))}
              </div>
            </details>
          )}
        </section>
      )}
      <ExerciseRunner items={session} examMode timeLimitSec={timed} backHref={`/learn/${objective.id}`} backLabel="Back to module" />
    </>
  );
}
