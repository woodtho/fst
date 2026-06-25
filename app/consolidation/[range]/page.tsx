import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemsForOfRange, getConsolidationBooklets, getConsolidationQuestionsForRange, getObjectives, getSupplementStudyGuide } from "@/lib/content";
import { buildSession } from "@/lib/session";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

export default function ConsolidationRange({ params, searchParams }: { params: { range: string }; searchParams: { mode?: string } }) {
  const m = params.range.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) notFound();
  const from = parseInt(m[1], 10), to = parseInt(m[2], 10);

  const items = getItemsForOfRange(from, to);
  if (items.length === 0) notFound();

  const booklet = getConsolidationBooklets().find((b) => b.ofRange[0] === from && b.ofRange[1] === to);
  const guide = booklet ? getSupplementStudyGuide(booklet) : null;
  const sourceQuestions = getConsolidationQuestionsForRange(from, to);
  const ofs = getObjectives().filter((o) => o.of >= from && o.of <= to);
  const exam = searchParams.mode === "exam";

  // Mixed review: shuffle across the whole range (no difficulty ramp, like a real consolidation).
  const session = buildSession(items, 20, "shuffle");

  return (
    <>
      <p className="muted"><Link href="/consolidation">← Consolidation</Link></p>
      <h1 style={{ marginBottom: 2 }}>Consolidation — OF {from}–{to}</h1>
      <p className="lead">Mixed review across {ofs.length} objectives{booklet ? ` · source ${booklet.catalogue}` : ""}.</p>
      <div className="filterbar">
        <Link href={`/consolidation/${from}-${to}`} className={`chip ${!exam ? "active" : ""}`}>Study (feedback each)</Link>
        <Link href={`/consolidation/${from}-${to}?mode=exam`} className={`chip ${exam ? "active" : ""}`}>Exam (feedback at end)</Link>
      </div>
      {guide && (
        <section className="panel supplement-panel" aria-labelledby="consolidation-source">
          <div className="section-head">
            <div>
              <h2 id="consolidation-source">Booklet learning material</h2>
              <p className="muted">{guide.title} · source text <code>{guide.source.text}</code></p>
            </div>
            <span className="tag">Source {guide.source.catalogue}</span>
          </div>
          <p>{guide.intro}</p>
          <div className="stats-grid">
            <div><strong>{sourceQuestions.length}</strong><span>answer-keyed source activities</span></div>
            <div><strong>{guide.correctedActivityCount || "Keyed"}</strong><span>answer-key activities</span></div>
            <div><strong>{items.length}</strong><span>in-app questions</span></div>
          </div>
          {guide.sections.length > 0 && (
            <>
              <h3>Source sections covered</h3>
              <ul className="compact-list two-col">
                {guide.sections.slice(0, 18).map((section) => <li key={section}>{section}</li>)}
              </ul>
            </>
          )}
          {sourceQuestions.length > 0 && (
            <details className="source-list">
              <summary>Show answerable consolidation activities with answer keys</summary>
              <div className="source-question-list">
                {sourceQuestions.map((q) => (
                  <article key={q.id} className="source-question">
                    <h4>{q.title}</h4>
                    <p className="fr" lang="fr">{q.promptFr}</p>
                    {q.answer && (
                      <details className="answer-key">
                        <summary>Answer key</summary>
                        <p className="fr" lang="fr">{q.answer}</p>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            </details>
          )}
        </section>
      )}
      <ExerciseRunner items={session} examMode={exam} backHref="/consolidation" backLabel="Back to consolidation" />
    </>
  );
}
