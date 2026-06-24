import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjective, getModule, getLexiconByOf } from "@/lib/content";

export const dynamic = "force-dynamic";

function exampleTitle(example: any) {
  if (example.title) return example.title;
  const firstLine = typeof example.fr === "string" ? example.fr.split("\n")[0]?.trim() : "";
  return firstLine?.startsWith("Activité ") ? firstLine : "Example text";
}

function exampleBody(example: any) {
  if (example.title || typeof example.fr !== "string") return example.fr;
  const lines = example.fr.split("\n");
  return lines[0]?.trim().startsWith("Activité ") ? lines.slice(1).join("\n").trimStart() : example.fr;
}

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
          <h2 style={{ marginTop: 0 }}>{exampleTitle(t)}</h2>
          {exampleBody(t) && <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }} className="fr">{exampleBody(t)}</pre>}
          {t.table && (
            <table className="vocab-table">
              <thead>
                <tr>{t.table.headers.map((h: string) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {t.table.rows.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className={cellIndex === 0 ? "muted" : "fr"}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {t.en && <p className="en">{t.en}</p>}
        </div>
      ))}

      {/* PFL2 source lexicon for this OF */}
      {lexicon && lexicon.entries?.length > 0 && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Lexicon — PFL2 source vocabulary</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {lexicon.count} entries for this objective, from the official PFL2 Lexique
            (<code>{lexicon.source.catalogue}</code>). <Link href="/tools/lexicon">Search the full lexicon →</Link>
          </p>
          <table className="lex-table">
            <thead><tr><th>Français</th><th>English</th></tr></thead>
            <tbody>
              {lexicon.entries.map((e: any, i: number) => (
                <tr key={i}><td className="fr" lang="fr">{e.fr}</td><td lang="en">{e.en}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="btn-row">
        <Link className="btn" href={`/learn/${objective.id}/practice`}>I&apos;ve reviewed this → Start Practice</Link>
      </div>
    </>
  );
}
