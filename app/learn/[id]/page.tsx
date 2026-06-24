import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjective, getModule, getItems, getSupplements, getCoverage } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function ModuleHub({ params }: { params: { id: string } }) {
  const objective = getObjective(params.id);
  if (!objective) notFound();

  const mod = getModule(params.id);
  const items = getItems(params.id);
  const hasLearn = !!mod?.stages?.learn;
  const supp = getSupplements(objective.of);
  const cov = getCoverage(params.id);
  const conv = cov?.validation?.convertible;
  const pct = conv ? Math.round((conv.covered / conv.total) * 100) : 0;
  const gaps = cov?.validation?.actionableGaps;
  const gapList: string[] = gaps ? [
    ...(gaps.sections ?? []),
    ...(gaps.activities?.length ? [`answer-keyed activities ${gaps.activities.join(", ")}`] : []),
    ...(gaps.vocabulary ?? []), ...(gaps.examples ?? []), ...(gaps.selfTest ?? []),
  ] : [];

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
            : <span className="meta">Coming soon</span>}
        </div>

        <div className="stage">
          <div>
            <strong>Practice</strong>
            <div className="meta">{items.length > 0 ? `${items.length} questions with full explanations` : "No items yet"}</div>
          </div>
          {items.length > 0
            ? <Link className="btn" href={`/learn/${objective.id}/practice`}>Start practice</Link>
            : <span className="meta">Coming soon</span>}
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
            : <span className="meta">Coming soon</span>}
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

      {cov && (
        <section style={{ marginTop: 28 }}>
          <h2>Source coverage</h2>
          <p className="muted" style={{ marginTop: -6 }}>
            Every learning item is traced to this objective's PFL2 source document ({cov.sourceDocument}). Coverage is measured against the source's own structure.
          </p>
          <div className="stage" style={{ alignItems: "center" }}>
            <div>
              <strong>Convertible source elements covered</strong>
              <div className="meta">Grammar &amp; vocabulary sections, the lexicon, model-sentence patterns, and every answer-keyed activity.</div>
              <div style={{ height: 8, background: "#e6e6e6", borderRadius: 4, marginTop: 8, overflow: "hidden", maxWidth: 320 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#2e7d32" : "#1565c0" }} />
              </div>
            </div>
            <span className="pill available">{conv?.covered}/{conv?.total} ({pct}%)</span>
          </div>

          {gapList.length > 0 && (
            <div className="stage">
              <div>
                <strong>⚠️ Actionable gaps — module not complete</strong>
                <div className="meta">Source material with answer keys that is not yet turned into items (the validator keeps this module incomplete until covered): {gapList.join("; ")}.</div>
              </div>
            </div>
          )}

          <div className="stage">
            <div>
              <strong>Non-convertible source elements</strong>
              <div className="meta">
                {cov.validation.nonConvertible.sections.length} oral/strategy/phonetic sections and {cov.validation.nonConvertible.activities.length} exploration/listening activities have no published answer key, so they cannot become auto-gradable questions. They are catalogued in the coverage map but intentionally not invented. Self-test review: {cov.selfTest.selfEvalBooklet}.
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
