import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemsForOfRange, getConsolidationBooklets, getObjectives } from "@/lib/content";
import { buildSession } from "@/lib/session";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

export default function ConsolidationRange({ params, searchParams }: { params: { range: string }; searchParams: { mode?: string } }) {
  const m = params.range.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) notFound();
  const from = parseInt(m[1], 10), to = parseInt(m[2], 10);

  const items = getItemsForOfRange(from, to);
  if (items.length === 0) notFound();

  const booklet = getConsolidationBooklets().find((b) => b.ofRange[0] === from && b.ofRange[1] === to);
  const ofs = getObjectives().filter((o) => o.of >= from && o.of <= to);
  const exam = searchParams.mode === "exam";

  // Mixed review: shuffle across the whole range (no difficulty ramp, like a real consolidation).
  const session = buildSession(items, 20, "shuffle");

  return (
    <>
      <p className="muted"><Link href="/consolidation">← Consolidation</Link></p>
      <h1 style={{ marginBottom: 2 }}>Consolidation — OF {from}–{to}</h1>
      <p className="lead">Mixed review across {ofs.length} objectives{booklet ? ` · source ${booklet.catalogue}` : ""}.</p>
      <div className="filterbar">
        <Link href={`/consolidation/${from}-${to}`} className={`chip ${!exam ? "active" : ""}`}>Study (feedback each)</Link>
        <Link href={`/consolidation/${from}-${to}?mode=exam`} className={`chip ${exam ? "active" : ""}`}>Exam (feedback at end)</Link>
      </div>
      <ExerciseRunner items={session} examMode={exam} backHref="/consolidation" backLabel="Back to consolidation" />
    </>
  );
}
