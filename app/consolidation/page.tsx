import Link from "next/link";
import { getConsolidationBooklets, getConsolidationQuestionsForRange, getObjectives, getItemsForOfRange } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function ConsolidationHub() {
  const booklets = getConsolidationBooklets();
  const objectives = getObjectives();

  return (
    <>
      <h1>Consolidation review</h1>
      <p className="lead">
        Mixed review across multiple objectives, following the PFL2 consolidation booklets. Each
        session pulls questions from every objective in the range so you integrate what you&apos;ve learned.
      </p>
      <div className="grid">
        {booklets.map((b) => {
          const [from, to] = b.ofRange;
          const ofs = objectives.filter((o) => o.of >= from && o.of <= to);
          const count = getItemsForOfRange(from, to).length;
          const sourceCount = getConsolidationQuestionsForRange(from, to).length;
          const level = to <= 20 ? "A" : from >= 21 ? "B" : "A/B";
          return (
            <Link key={b.booklet} href={`/consolidation/${from}-${to}`} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="card-code">OF {from}–{to}</span>
                <span className="tag">Level {level}</span>
              </div>
              <div className="card-title">Consolidation {b.booklet}</div>
              <div className="card-sub">{ofs.length} objectives · {count} practice questions · {sourceCount} answer-keyed source activities · source {b.catalogue}</div>
              <div className="tags">{ofs.slice(0, 8).map((o) => <span key={o.id} className="tag">{o.id}</span>)}{ofs.length > 8 && <span className="tag">…</span>}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
