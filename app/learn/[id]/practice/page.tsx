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

  // Sample up to 16, ramped easy → advanced. Re-shuffles each visit, so a large bank
  // surfaces different examples each time.
  const sanitized = buildSession(items, 16, "ramp");

  return (
    <>
      <p className="muted"><Link href={`/learn/${objective.id}`}>← {objective.id} hub</Link></p>
      <h1 style={{ marginBottom: 4 }}>Practice — {objective.id}</h1>
      <p className="lead">{objective.titleFr}</p>
      <ExerciseRunner items={sanitized} objectiveId={objective.id} />
    </>
  );
}
