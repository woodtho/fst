import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjective, getModule, getLexiconByOf } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function LearnPage({ params }: { params: { id: string } }) {
  const objective = getObjective(params.id);
  const mod = getModule(params.id);
  if (!objective || !mod?.stages?.learn) notFound();
  const learn = mod.stages.learn;
  const lexicon = getLexiconByOf(objective.id);

  return (
    <>
      <p className="muted"><Link href={`/learn/${objective.id}`}>← {objective.id} hub</Link></p>
      <h1>{objective.titleFr}</h1>
      <p className="lead">Learn · {objective.titleEn}</p>

      {/* Concept */}
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Concept</h2>
        <p>{learn.conceptExplanation?.en}</p>
        {learn.conceptExplanation?.fr && <p className="fr">{learn.conceptExplanation.fr}</p>}
      </div>

      {/* Vocabulary */}
      {learn.vocabulary?.length > 0 && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Vocabulary</h2>
          <table className="vocab-table">
            <thead>
              <tr><th>Français</th><th>English</th><th>Type</th><th>Register / note</th></tr>
            </thead>
            <tbody>
              {learn.vocabulary.map((v: any, i: number) => (
                <tr key={i}>
                  <td className="fr">{v.fr}</td>
                  <td>{v.en}</td>
                  <td className="muted">{v.pos ?? (v.aux ? `aux: ${v.aux}` : "")}</td>
                  <td className="muted">{v.register ?? ""}{v.note ? ` — ${v.note}` : ""}{v.pp ? `pp: ${v.pp}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grammar */}
      {learn.grammarNotes && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Grammar notes</h2>
          {learn.grammarNotes.summary && <p className="muted">{learn.grammarNotes.summary}</p>}
          <ul>
            {(learn.grammarNotes.points ?? []).map((p: string, i: number) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* Pronunciation */}
      {learn.pronunciation?.points?.length > 0 && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Pronunciation</h2>
          <ul>{learn.pronunciation.points.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}

      {/* Dialogues */}
      {learn.dialogues?.map((d: any, i: number) => (
        <div className="panel" key={i}>
          <h2 style={{ marginTop: 0 }}>Dialogue — {d.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>Register: {d.register}</p>
          {d.lines.map((l: any, j: number) => (
            <div className="dialogue-line" key={j}>
              <span className="spk">{l.speaker}</span>
              <span className="fr">{l.fr}</span>
              {l.en && <div className="en">{l.en}</div>}
            </div>
          ))}
        </div>
      ))}

      {/* Example texts */}
      {learn.exampleTexts?.map((t: any, i: number) => (
        <div className="panel" key={i}>
          <h2 style={{ marginTop: 0 }}>Example text</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }} className="fr">{t.fr}</pre>
          {t.en && <p className="en">{t.en}</p>}
        </div>
      ))}

      {/* PFL2 source lexicon for this OF */}
      {lexicon && lexicon.frenchSource && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Lexicon — PFL2 source vocabulary</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Full vocabulary list for this objective, from the official PFL2 Lexique
            (<code>{lexicon.source.catalogue}</code>). French and English are parallel source
            lists.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <h3 style={{ marginTop: 0 }}>Français</h3>
              <p className="fr" lang="fr" style={{ fontSize: ".9rem" }}>{lexicon.frenchSource}</p>
            </div>
            <div>
              <h3 style={{ marginTop: 0 }}>English</h3>
              <p className="en" lang="en" style={{ fontSize: ".9rem" }}>{lexicon.englishSource}</p>
            </div>
          </div>
        </div>
      )}

      <div className="btn-row">
        <Link className="btn" href={`/learn/${objective.id}/practice`}>I&apos;ve reviewed this → Start Practice</Link>
      </div>
    </>
  );
}
