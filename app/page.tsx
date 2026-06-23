import Link from "next/link";
import { getObjectives, getAvailability } from "@/lib/content";

const SKILL_LABEL: Record<string, string> = {
  speaking: "Speaking", listening: "Listening", reading: "Reading",
  writing: "Writing", grammar: "Grammar", vocabulary: "Vocabulary",
};

export default function CatalogPage({
  searchParams,
}: {
  searchParams: { level?: string };
}) {
  const level = searchParams.level;
  const objectives = getObjectives()
    .filter((o) => !level || o.level === level)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <h1>Training objectives</h1>
      <p className="lead">
        The 40 PFL2 communicative objectives. Modules with authored content are playable now;
        the rest are scaffolded from <code>content/curriculum.json</code>.
      </p>

      <div className="filterbar" role="group" aria-label="Filter by level">
        <Link href="/" className={`chip ${!level ? "active" : ""}`}>All</Link>
        <Link href="/?level=A" className={`chip ${level === "A" ? "active" : ""}`}>Level A</Link>
        <Link href="/?level=B" className={`chip ${level === "B" ? "active" : ""}`}>Level B</Link>
      </div>

      <div className="grid">
        {objectives.map((o) => {
          const { hasModule, itemCount } = getAvailability(o.id);
          const playable = hasModule || itemCount > 0;
          const card = (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="card-code">{o.id}</span>
                <span className={`pill ${playable ? "available" : "soon"}`}>
                  {playable ? "Available" : "Scaffolded"}
                </span>
              </div>
              <div className="card-title fr">{o.titleFr}</div>
              <div className="card-sub en">{o.titleEn}</div>
              <div className="tags">
                <span className="tag">Level {o.level}</span>
                <span className="tag">{SKILL_LABEL[o.primarySkill] ?? o.primarySkill}</span>
                {o.grammarConcepts.slice(0, 1).map((g) => (
                  <span key={g} className="tag">{g.replace(/_/g, " ")}</span>
                ))}
                {itemCount > 0 && <span className="tag">{itemCount} questions</span>}
              </div>
            </>
          );
          return playable ? (
            <Link key={o.id} href={`/learn/${o.id}`} className="card">{card}</Link>
          ) : (
            <div key={o.id} className="card locked" aria-disabled="true">{card}</div>
          );
        })}
      </div>
    </>
  );
}
