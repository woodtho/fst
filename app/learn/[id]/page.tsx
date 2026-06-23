import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjective, getModule, getItems, getSupplements } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function ModuleHub({ params }: { params: { id: string } }) {
  const objective = getObjective(params.id);
  if (!objective) notFound();

  const mod = getModule(params.id);
  const items = getItems(params.id);
  const hasLearn = !!mod?.stages?.learn;
  const supp = getSupplements(objective.of);

  return (
    <>
      <p className="muted"><Link href="/">← Catalog</Link></p>
      <span className="card-code">{objective.id}</span>
      <h1 style={{ marginTop: 8 }}>{objective.titleFr}</h1>
      <p className="lead">{objective.titleEn}</p>

      <div className="tags" style={{ marginBottom: 20 }}>
        <span className="tag">Level {objective.level}</span>
        <span className="tag">Primary: {objective.primarySkill}</span>
        {objective.themes.map((t) => <span key={t} className="tag">{t.replace(/_/g, " ")}</span>)}
        {objective.grammarConcepts.map((g) => <span key={g} className="tag">{g.replace(/_/g, " ")}</span>)}
      </div>

      <h2>Stages</h2>
      <div className="stage-list">
        <div className="stage">
          <div>
            <strong>Learn</strong>
            <div className="meta">Concept, vocabulary, grammar, pronunciation, dialogues, texts</div>
          </div>
          {hasLearn
            ? <Link className="btn secondary" href={`/learn/${objective.id}/learn`}>Open</Link>
            : <span className="meta">Not yet authored</span>}
        </div>

        <div className="stage">
          <div>
            <strong>Practice</strong>
            <div className="meta">{items.length > 0 ? `${items.length} questions with full explanations` : "No items yet"}</div>
          </div>
          {items.length > 0
            ? <Link className="btn" href={`/learn/${objective.id}/practice`}>Start practice</Link>
            : <span className="meta">Not yet authored</span>}
        </div>

        <div className="stage">
          <div>
            <strong>Consolidation</strong>
            <div className="meta">
              {supp.consolidation
                ? `PFL2 source: Consolidation booklet ${supp.consolidation.booklet} (OF ${supp.consolidation.ofRange[0]}–${supp.consolidation.ofRange[1]}) · ${supp.consolidation.catalogue}`
                : "Scenario & real-world workplace tasks"}
            </div>
          </div>
          {supp.consolidation
            ? <span className="pill available">Source available</span>
            : <span className="meta">Spec only</span>}
        </div>

        <div className="stage">
          <div>
            <strong>Self-test</strong>
            <div className="meta">
              Timed exam-mode quiz, feedback at the end.
              {supp.selfEval && <> Mirrors Auto-évaluation booklet {supp.selfEval.booklet} (OF {supp.selfEval.ofRange[0]}–{supp.selfEval.ofRange[1]}) · {supp.selfEval.catalogue}.</>}
            </div>
          </div>
          {items.length > 0
            ? <Link className="btn" href={`/learn/${objective.id}/self-test`}>Start self-test</Link>
            : <span className="meta">No items yet</span>}
        </div>
      </div>
    </>
  );
}
