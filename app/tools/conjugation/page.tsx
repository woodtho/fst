import Link from "next/link";
import { VERBS, TENSES } from "@/lib/conjugation";
import ConjugationTable from "@/components/ConjugationTable";
import ConjugationGame from "@/components/ConjugationGame";

export const dynamic = "force-dynamic";

export default function ConjugationTool({ searchParams }: { searchParams: { mode?: string } }) {
  const mode = searchParams.mode === "game" ? "game" : "reference";

  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>Conjugation</h1>
      <p className="lead">{VERBS.length} verbs across all {TENSES.length} tenses — browse the full conjugation tables, then test yourself in the practice game.</p>

      <div className="tabs" role="tablist">
        <Link href="/tools/conjugation?mode=reference" className={`tab ${mode === "reference" ? "active" : ""}`} role="tab" aria-selected={mode === "reference"}>
          Conjugation tables
        </Link>
        <Link href="/tools/conjugation?mode=game" className={`tab ${mode === "game" ? "active" : ""}`} role="tab" aria-selected={mode === "game"}>
          Practice game
        </Link>
      </div>

      {mode === "reference" ? <ConjugationTable /> : <ConjugationGame />}
    </>
  );
}
