import Link from "next/link";
import LocalScoreboard from "@/components/LocalScoreboard";
import { getConceptLibrary, getConsolidationBooklets, getObjectives } from "@/lib/content";
import { getGameAvailability, resolveGameScope } from "@/lib/games";
import type { GameScopeType } from "@/lib/gameTypes";

export const dynamic = "force-dynamic";

const SHARED_MODES = [
  { id: "survival", label: "Survival", description: "Three lives, mixed questions, and streak bonuses." },
  { id: "sprint", label: "Speed Sprint", description: "A rapid 60-second multiple-choice round." },
  { id: "typed", label: "Typed Challenge", description: "Produce exact French answers with three lives." },
  { id: "match", label: "Match-Up", description: "Complete matching boards for big point bonuses." },
] as const;
const VALID_SCOPES = new Set<GameScopeType>(["all", "objective", "grammar", "lexicon", "workplace", "consolidation", "conjugation"]);

export default function GamesHub({ searchParams }: { searchParams: { scope?: string; key?: string } }) {
  const requestedType = VALID_SCOPES.has(searchParams.scope as GameScopeType) ? searchParams.scope as GameScopeType : "all";
  const requestedKey = searchParams.key || "all";
  const resolved = resolveGameScope(requestedType, requestedKey) ?? resolveGameScope("all", "all")!;
  const availability = getGameAvailability(resolved.items);
  const objectives = getObjectives();
  const concepts = Object.entries(getConceptLibrary()).sort(([, a], [, b]) => String(a.nameFr).localeCompare(String(b.nameFr), "fr"));
  const booklets = getConsolidationBooklets();

  return (
    <>
      <section className="games-hero">
        <div>
          <span className="eyebrow">FRENCH ARCADE</span>
          <h1>Games</h1>
          <p className="lead">Choose a topic, build a streak, and beat your best score. Results stay private in this browser.</p>
        </div>
        <Link className="btn" href="/games/play?scope=all&key=all&mode=survival">Quick Play</Link>
      </section>

      <section className="panel game-scope-panel">
        <div className="section-head"><div><h2>Choose the question pool</h2><p className="muted">Current topic: <strong>{resolved.scope.label}</strong> · {resolved.items.length.toLocaleString()} questions</p></div></div>
        <div className="quick-scope-grid">
          <Link className={`card scope-card ${resolved.scope.type === "all" ? "selected" : ""}`} href="/games"><strong>All content</strong><span>Questions from every objective</span></Link>
          <Link className={`card scope-card ${resolved.scope.type === "lexicon" ? "selected" : ""}`} href="/games?scope=lexicon&key=all"><strong>Vocabulary</strong><span>Words from the full lexicon</span></Link>
          <Link className={`card scope-card ${resolved.scope.type === "workplace" ? "selected" : ""}`} href="/games?scope=workplace&key=all"><strong>Workplace</strong><span>Government and office French</span></Link>
        </div>
        <div className="scope-select-grid">
          <form action="/games" className="scope-select-form"><input type="hidden" name="scope" value="objective" /><label htmlFor="objective-game">Module</label><select id="objective-game" name="key" defaultValue={resolved.scope.type === "objective" ? resolved.scope.id : objectives[0]?.id}>{objectives.map((objective) => <option key={objective.id} value={objective.id}>OF {objective.of} · {objective.titleFr}</option>)}</select><button className="btn small secondary">Use module</button></form>
          <form action="/games" className="scope-select-form"><input type="hidden" name="scope" value="grammar" /><label htmlFor="grammar-game">Grammar concept</label><select id="grammar-game" name="key" defaultValue={resolved.scope.type === "grammar" ? resolved.scope.id : concepts[0]?.[0]}>{concepts.map(([id, concept]) => <option key={id} value={id}>{concept.nameFr}</option>)}</select><button className="btn small secondary">Use concept</button></form>
        </div>
        <div className="chiprow" aria-label="Consolidation game ranges">{booklets.map((booklet) => { const id = `${booklet.ofRange[0]}-${booklet.ofRange[1]}`; return <Link key={id} className={`chip ${resolved.scope.type === "consolidation" && resolved.scope.id === id ? "active" : ""}`} href={`/games?scope=consolidation&key=${id}`}>OF {booklet.ofRange[0]}–{booklet.ofRange[1]}</Link>; })}</div>
      </section>

      <section aria-labelledby="arcade-modes-title">
        <div className="section-head"><div><h2 id="arcade-modes-title">Arcade modes</h2><p className="muted">Each game uses fixed rules so scores for this topic stay comparable.</p></div></div>
        <div className="game-mode-grid">
          {SHARED_MODES.map((game) => {
            const count = availability[game.id];
            const href = `/games/play?scope=${resolved.scope.type}&key=${encodeURIComponent(resolved.scope.id)}&mode=${game.id}`;
            return <article className={`card game-mode-card ${count === 0 ? "unavailable" : ""}`} key={game.id}><span className="card-code">{count} available</span><h3>{game.label}</h3><p>{game.description}</p>{count ? <Link className="btn small" href={href}>Play {game.label}</Link> : <span className="muted">Unavailable for this topic</span>}</article>;
          })}
        </div>
      </section>

      <section aria-labelledby="specialized-games-title">
        <div className="section-head"><div><h2 id="specialized-games-title">Specialized games</h2><p className="muted">Purpose-built practice for numbers, vocabulary, and verb forms.</p></div></div>
        <div className="special-game-grid">
          <Link className="card feature-card" href="/tools/numbers?view=games"><span className="card-code">7 MODES</span><h3>Numbers arcade</h3><p>Spell, compare, format, calculate, and solve French number sequences.</p></Link>
          <Link className="card feature-card" href="/tools/lexicon/game"><span className="card-code">60 SECONDS</span><h3>Lexicon sprint</h3><p>Race through French and English vocabulary.</p></Link>
          <Link className="card feature-card" href="/tools/conjugation?mode=game"><span className="card-code">CUSTOM</span><h3>Conjugation game</h3><p>Choose tenses and verbs, then produce the correct forms.</p></Link>
          <Link className="card feature-card" href="/games/play?scope=conjugation&key=prepositions&mode=verb-prepositions"><span className="card-code">18 QUESTIONS</span><h3>Verb Prepositions</h3><p>Practise complete verb constructions with à, de, direct objects, and other prepositions.</p></Link>
          <Link className="card feature-card" href="/games/play?scope=conjugation&key=y-en&mode=y-en"><span className="card-code">18 QUESTIONS</span><h3>Y or En</h3><p>Replace complements and master pronoun placement, including imperatives.</p></Link>
        </div>
      </section>

      <LocalScoreboard />
    </>
  );
}
