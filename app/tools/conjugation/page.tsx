import Link from "next/link";
import { VERBS, TENSES } from "@/lib/conjugation";
import ConjugationTable from "@/components/ConjugationTable";
import ConjugationGame from "@/components/ConjugationGame";
import VerbConstructionReference from "@/components/VerbConstructionReference";

export const dynamic = "force-dynamic";

export default function ConjugationTool({ searchParams }: { searchParams: { mode?: string } }) {
  const mode = searchParams.mode === "game" ? "game" : searchParams.mode === "constructions" ? "constructions" : "reference";

  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>Conjugation</h1>
      <p className="lead">{VERBS.length} verbs across all {TENSES.length} tenses — browse the full conjugation tables, then test yourself in the practice game.</p>

      <div className="tabs" role="tablist">
        <Link href="/tools/conjugation?mode=reference" className={`tab ${mode === "reference" ? "active" : ""}`} role="tab" aria-selected={mode === "reference"}>
          Conjugation tables
        </Link>
        <Link href="/tools/conjugation?mode=constructions" className={`tab ${mode === "constructions" ? "active" : ""}`} role="tab" aria-selected={mode === "constructions"}>
          Verb constructions
        </Link>
        <Link href="/tools/conjugation?mode=game" className={`tab ${mode === "game" ? "active" : ""}`} role="tab" aria-selected={mode === "game"}>
          Practice game
        </Link>
      </div>

      {mode === "reference" ? <ConjugationTable /> : mode === "constructions" ? <VerbConstructionReference /> : (
        <>
          <div className="special-game-grid conjugation-game-links">
            <Link className="card feature-card" href="/games/play?scope=conjugation&key=prepositions&mode=verb-prepositions"><span className="card-code">3 LIVES</span><h3>Verb Prepositions</h3><p>Complete the construction required by each verb.</p></Link>
            <Link className="card feature-card" href="/games/play?scope=conjugation&key=y-en&mode=y-en"><span className="card-code">3 LIVES</span><h3>Y or En</h3><p>Replace complements and put each pronoun in the right place.</p></Link>
          </div>
          <h2>Conjugation challenge</h2>
          <ConjugationGame />
        </>
      )}
    </>
  );
}
