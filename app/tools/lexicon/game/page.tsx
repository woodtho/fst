import Link from "next/link";
import { getAllLexicon } from "@/lib/content";
import LexiconGame from "@/components/LexiconGame";

export const dynamic = "force-dynamic";

export default function LexiconGamePage() {
  const entries = getAllLexicon();
  return (
    <>
      <p className="muted"><Link href="/tools/lexicon">← Lexicon</Link></p>
      <h1>Lexicon game</h1>
      <p className="lead">A fast vocabulary game over the full PFL2 lexicon ({entries.length.toLocaleString()} entries).</p>
      <LexiconGame entries={entries} />
    </>
  );
}
