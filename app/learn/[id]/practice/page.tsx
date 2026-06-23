import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjective, getItems } from "@/lib/content";
import { buildSession } from "@/lib/session";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

export default function PracticePage({ params }: { params: { id: string } }) {
  const objective = getObjective(params.id);
  const items = getItems(params.id);
  if (!objective || items.length === 0) notFound();

  // Draw 20 questions at random from the OF's full bank (100+ items). Re-shuffles every
  // visit, so each practice session shows a different random set, in random order.
  const sanitized = buildSession(items, 20, "shuffle");

  return (
    <>
      <p className="muted"><Link href={`/learn/${objective.id}`}>← {objective.id} hub</Link></p>
      <h1 style={{ marginBottom: 4 }}>Practice — {objective.id}</h1>
      <p className="lead">{objective.titleFr}</p>
      <ExerciseRunner items={sanitized} objectiveId={objective.id} />
    </>
  );
}
