import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjective, getItems, sanitize } from "@/lib/content";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

export default function PracticePage({ params }: { params: { id: string } }) {
  const objective = getObjective(params.id);
  const items = getItems(params.id);
  if (!objective || items.length === 0) notFound();

  // Order easy → medium → advanced (progressive difficulty), then sanitize for the client.
  const order = { easy: 0, medium: 1, advanced: 2 } as const;
  const sanitized = [...items]
    .sort((a, b) => order[a.difficulty] - order[b.difficulty])
    .map(sanitize);

  return (
    <>
      <p className="muted"><Link href={`/learn/${objective.id}`}>← {objective.id} hub</Link></p>
      <h1 style={{ marginBottom: 4 }}>Practice — {objective.id}</h1>
      <p className="lead">{objective.titleFr}</p>
      <ExerciseRunner items={sanitized} objectiveId={objective.id} />
    </>
  );
}
