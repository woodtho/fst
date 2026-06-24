import Link from "next/link";
import { getAllLexicon, getLexiconLearn, getLexiconQuestions, getObjectives, getSupplementalLexicon } from "@/lib/content";
import LexiconBrowser from "@/components/LexiconBrowser";

export const dynamic = "force-dynamic";

export default function LexiconTool() {
  const entries = getAllLexicon();
  const learn = getLexiconLearn();
  const questions = getLexiconQuestions();
  const supplemental = getSupplementalLexicon();
  const objectives = [
    ...getObjectives().map((o) => ({ id: o.id, of: o.of, titleFr: o.titleFr })),
    ...(supplemental ? [{ id: supplemental.objectiveId, of: supplemental.of, titleFr: supplemental.titleFr }] : [])
  ];
  const sourceEntries = learn?.counts?.entries ?? entries.length;
  const supplementalEntries = learn?.counts?.supplementalEntries ?? 0;
  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>Lexicon tool</h1>
      <p className="lead">
        {sourceEntries.toLocaleString()} vocabulary entries from the PFL2 source Lexique (SC102-2/1-2-2005F)
        {supplementalEntries ? ` plus ${supplementalEntries.toLocaleString()} supplemental digital-workplace terms` : ""}, French ↔ English.
      </p>
      <div className="btn-row" style={{ marginBottom: 18 }}>
        <Link className="btn" href="/tools/lexicon/practice">Practice lexicon questions</Link>
        <Link className="btn secondary" href="/tools/lexicon/game">Play the lexicon game</Link>
      </div>
      {learn && (
        <section className="panel" style={{ marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>{learn.title}</h2>
          <p>{learn.summary}</p>
          <p className="muted">
            {learn.counts.entries.toLocaleString()} source entries
            {learn.counts.supplementalEntries ? ` · ${learn.counts.supplementalEntries.toLocaleString()} supplemental entries` : ""}
            {" · "}{questions.length.toLocaleString()} generated practice questions · {learn.counts.objectives} objectives
          </p>
          <div className="grid">
            {learn.learningMaterial.map((section: any) => (
              <div className="card" key={section.title}>
                <h3>{section.title}</h3>
                <ul>
                  {section.points.map((point: string) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      <LexiconBrowser entries={entries} objectives={objectives} />
    </>
  );
}
