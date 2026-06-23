import Link from "next/link";
import { getAllLexicon, getObjectives } from "@/lib/content";
import LexiconBrowser from "@/components/LexiconBrowser";

export const dynamic = "force-dynamic";

export default function LexiconTool() {
  const entries = getAllLexicon();
  const objectives = getObjectives().map((o) => ({ id: o.id, of: o.of, titleFr: o.titleFr }));
  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>Lexicon tool</h1>
      <p className="lead">{entries.length.toLocaleString()} vocabulary entries from the PFL2 source Lexique (SC102-2/1-2-2005F), French ↔ English, across all 40 objectives.</p>
      <div className="btn-row" style={{ marginBottom: 18 }}>
        <Link className="btn" href="/tools/lexicon/game">🎯 Play the lexicon game</Link>
      </div>
      <LexiconBrowser entries={entries} objectives={objectives} />
    </>
  );
}
