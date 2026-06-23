import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjective, getModule, getItems, sanitize, type Item } from "@/lib/content";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function SelfTestPage({ params }: { params: { id: string } }) {
  const objective = getObjective(params.id);
  const mod = getModule(params.id);
  const items = getItems(params.id);
  if (!objective || items.length === 0) notFound();

  const bp = mod?.stages?.selfTest?.blueprint ?? { easy: 6, medium: 4, advanced: 2 };
  const timed: number = mod?.stages?.selfTest?.timedSeconds ?? Math.max(180, items.length * 35);

  // Draw per blueprint from the OF's full bank, then present in random order.
  const byBand = (b: string) => shuffle(items.filter((it) => it.difficulty === b));
  const chosen: Item[] = [
    ...byBand("easy").slice(0, bp.easy ?? 0),
    ...byBand("medium").slice(0, bp.medium ?? 0),
    ...byBand("advanced").slice(0, bp.advanced ?? 0),
  ];
  const session = shuffle(chosen.length ? chosen : items.slice(0, 18)).map(sanitize);

  return (
    <>
      <p className="muted"><Link href={`/learn/${objective.id}`}>← {objective.id} hub</Link></p>
      <h1 style={{ marginBottom: 2 }}>Self-test — {objective.id}</h1>
      <p className="lead">{objective.titleFr}</p>
      <div className="note">
        Exam mode: {session.length} questions, {Math.round(timed / 60)} min. Feedback and the full
        review are shown at the end (not after each question).
        {mod?.stages?.selfTest?.sourceBooklet && <> Mirrors the PFL2 self-evaluation booklet <code>{mod.stages.selfTest.sourceBooklet.catalogue}</code>.</>}
      </div>
      <ExerciseRunner items={session} examMode timeLimitSec={timed} backHref={`/learn/${objective.id}`} backLabel="Back to module" />
    </>
  );
}
