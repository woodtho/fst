import Link from "next/link";
import { getConceptLibrary, getItemsByConcept, getObjectives } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function GrammarTool() {
  const lib = getConceptLibrary();
  const objectives = getObjectives();
  const concepts = Object.keys(lib);

  // which objectives introduce/consolidate each concept (from the source-derived curriculum)
  const ofsByConcept: Record<string, string[]> = {};
  for (const c of concepts) ofsByConcept[c] = objectives.filter((o) => (o.grammarConcepts ?? []).includes(c)).map((o) => o.id);

  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>Grammar tool</h1>
      <p className="lead">The 16 grammar concepts of PFL2 Levels A &amp; B. Each is a cross-cutting track: practice pulls questions from every objective that uses it.</p>
      <div className="stage-list">
        {concepts.map((c) => {
          const info = lib[c];
          const n = getItemsByConcept(c).length;
          return (
            <div className="stage" key={c} style={{ alignItems: "flex-start" }}>
              <div style={{ maxWidth: "75%" }}>
                <strong className="fr">{info.nameFr}</strong> <span className="muted">· {info.nameEn}</span>
                <div className="meta">{info.summaryEn}</div>
                <div className="tags" style={{ marginTop: 8 }}>
                  <span className="tag">{n} questions</span>
                  <span className="tag">{ofsByConcept[c].length} objectives</span>
                  {ofsByConcept[c].slice(0, 6).map((id) => <span key={id} className="tag">{id}</span>)}
                </div>
              </div>
              <Link className="btn" href={`/tools/grammar/${c}`}>Practice</Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
