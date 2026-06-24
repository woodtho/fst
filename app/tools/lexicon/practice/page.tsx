import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseRunner from "@/components/ExerciseRunner";
import { getLexiconLearn, getLexiconQuestions } from "@/lib/content";
import { buildSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default function LexiconPracticePage() {
  const learn = getLexiconLearn();
  const items = getLexiconQuestions();
  if (!learn || items.length === 0) notFound();

  const sanitized = buildSession(items, 20, "shuffle");

  return (
    <>
      <p className="muted"><Link href="/tools/lexicon">← Lexicon</Link></p>
      <h1 style={{ marginBottom: 4 }}>Lexicon Practice</h1>
      <p className="lead">
        20 random questions from {items.length.toLocaleString()} PFL2 source lexicon questions.
      </p>
      <ExerciseRunner
        items={sanitized}
        backHref="/tools/lexicon"
        backLabel="Back to lexicon"
      />
    </>
  );
}
