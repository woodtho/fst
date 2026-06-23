import Link from "next/link";
import { getItemsByDomain, getItemsByTheme } from "@/lib/content";
import { buildSession } from "@/lib/session";
import ExerciseRunner from "@/components/ExerciseRunner";

export const dynamic = "force-dynamic";

const FOCI: Record<string, { label: string; domains: string[]; themes: string[]; blurb: string }> = {
  workplace: { label: "Workplace", domains: ["workplace"], themes: ["workplace", "meetings", "scheduling", "telephone"], blurb: "Day-to-day office language: tasks, meetings, scheduling, email, the telephone." },
  government: { label: "Government / public service", domains: ["government", "administration"], themes: ["government_terminology", "public_service"], blurb: "Public-service terminology: departments, directives, briefing notes, procedures, reports." },
};

export default function WorkplaceTool({ searchParams }: { searchParams: { focus?: string } }) {
  const focusKey = searchParams.focus === "government" ? "government" : "workplace";
  const focus = FOCI[focusKey];

  // union of items by vocab domain and by theme, de-duplicated
  const byDomain = focus.domains.flatMap((d) => getItemsByDomain(d));
  const byTheme = getItemsByTheme(focus.themes);
  const seen = new Set<string>();
  const items = [...byDomain, ...byTheme].filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
  const session = buildSession(items, 18, "ramp");

  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>Government &amp; workplace practice</h1>
      <p className="lead">Targeted practice on the language of the Government of Canada workplace.</p>

      <div className="filterbar" role="group" aria-label="Choose a focus">
        {Object.entries(FOCI).map(([k, f]) => (
          <Link key={k} href={`/tools/workplace?focus=${k}`} className={`chip ${focusKey === k ? "active" : ""}`}>{f.label}</Link>
        ))}
      </div>
      <p className="muted">{focus.blurb} · {items.length} questions in this pool.</p>

      {session.length > 0 ? (
        <ExerciseRunner items={session} backHref="/tools" backLabel="Back to tools" />
      ) : (
        <div className="panel"><p className="muted">No questions in this pool yet.</p></div>
      )}
    </>
  );
}
