import Link from "next/link";

const TOOLS = [
  { href: "/games", title: "Games arcade", desc: "Survival, speed, typed, and matching games across every learning topic." },
  { href: "/tools/grammar", title: "Grammar tool", desc: "The 16 grammar concepts with rules and cross-OF practice." },
  { href: "/tools/conjugation", title: "Conjugation tool", desc: "Drill verb conjugations across six tenses, regular and irregular." },
  { href: "/tools/numbers", title: "French numbers & math", desc: "Learn number rules, convert everyday formats, play games and build custom tests." },
  { href: "/tools/lexicon", title: "Lexicon tool", desc: "Search 1,400+ PFL2 vocabulary entries, French ↔ English, by objective." },
  { href: "/tools/workplace", title: "Government & workplace", desc: "Targeted practice on workplace and public-service language." },
  { href: "/consolidation", title: "Consolidation review", desc: "Mixed review across multiple objectives (OF 1–12, 13–22, 23–32, 33–40)." },
];

export default function ToolsHub() {
  return (
    <>
      <h1>Practice tools</h1>
      <p className="lead">Cross-cutting tools that pull from all 40 objectives and the PFL2 source materials.</p>
      <div className="grid">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card">
            <div className="card-title">{t.title}</div>
            <div className="card-sub">{t.desc}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
