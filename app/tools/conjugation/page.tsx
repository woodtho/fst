import Link from "next/link";
import { VERBS, TENSES, PERSONS, type Tense } from "@/lib/conjugation";
import ConjugationRunner from "@/components/ConjugationRunner";

export const dynamic = "force-dynamic";

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

export default function ConjugationTool({ searchParams }: { searchParams: { tense?: string; group?: string } }) {
  const tenseKey = (searchParams.tense as Tense) || "present";
  const isMix = searchParams.tense === "mix";
  const group = searchParams.group; // er | ir | re | irr | undefined

  const verbPool = group ? VERBS.filter((v) => v.group === group) : VERBS;

  // Build 12 prompts (no answers — graded server-side via /api/conjugate).
  const prompts = Array.from({ length: 12 }, () => {
    const v = pick(verbPool);
    const t = isMix ? pick(TENSES).key : tenseKey;
    const p = pick(PERSONS);
    const tInfo = TENSES.find((x) => x.key === t)!;
    return { inf: v.inf, en: v.en, tense: t, tenseFr: tInfo.fr, person: p.key, personDisplay: p.display };
  });

  const tenseLink = (key: string, label: string) => (
    <Link href={`/tools/conjugation?tense=${key}${group ? `&group=${group}` : ""}`} className={`chip ${(searchParams.tense ?? "present") === key ? "active" : ""}`}>{label}</Link>
  );

  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>Conjugation tool</h1>
      <p className="lead">Type the verb form (without the pronoun). Subjunctive answers may include or omit « que ».</p>

      <div className="filterbar" role="group" aria-label="Choose a tense">
        {TENSES.map((t) => tenseLink(t.key, t.fr))}
        {tenseLink("mix", "Mix")}
      </div>
      <div className="filterbar" role="group" aria-label="Filter verbs">
        <Link href={`/tools/conjugation?tense=${searchParams.tense ?? "present"}`} className={`chip ${!group ? "active" : ""}`}>All verbs</Link>
        {["er", "ir", "re", "irr"].map((g) => (
          <Link key={g} href={`/tools/conjugation?tense=${searchParams.tense ?? "present"}&group=${g}`} className={`chip ${group === g ? "active" : ""}`}>
            {g === "irr" ? "Irregular" : `-${g}`}
          </Link>
        ))}
      </div>

      <ConjugationRunner prompts={prompts} />

      <div className="panel" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Verbs in this tool</h3>
        <p className="muted" style={{ fontSize: ".9rem" }}>
          {VERBS.map((v) => `${v.inf} (${v.en})`).join(" · ")}
        </p>
      </div>
    </>
  );
}
