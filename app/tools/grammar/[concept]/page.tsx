import Link from "next/link";
import { notFound } from "next/navigation";
import { getConceptLibrary, getItemsByConcept } from "@/lib/content";
import { buildSession } from "@/lib/session";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

export default function ConceptPractice({ params }: { params: { concept: string } }) {
  const lib = getConceptLibrary();
  const info = lib[params.concept];
  if (!info) notFound();

  const items = getItemsByConcept(params.concept);
  const session = buildSession(items, 16, "ramp");

  return (
    <>
      <p className="muted"><Link href="/tools/grammar">← Grammar tool</Link></p>
      <h1 className="fr" style={{ marginBottom: 2 }}>{info.nameFr}</h1>
      <p className="lead">{info.nameEn}</p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Rules</h2>
        <p>{info.summaryEn}</p>
        <ul>{(info.rules ?? []).map((r: string, i: number) => <li key={i} className="fr">{r}</li>)}</ul>
      </div>

      {session.length > 0 ? (
        <ExerciseRunner items={session} backHref="/tools/grammar" backLabel="Back to grammar" />
      ) : (
        <div className="panel"><p className="muted">No questions found for this concept yet.</p></div>
      )}
    </>
  );
}
