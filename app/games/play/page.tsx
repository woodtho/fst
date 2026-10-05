import Link from "next/link";
import { notFound } from "next/navigation";
import ArcadeGame from "@/components/ArcadeGame";
import { buildArcadeSession, resolveGameScope } from "@/lib/games";
import type { ArcadeMode, GameScopeType } from "@/lib/gameTypes";

export const dynamic = "force-dynamic";

const VALID_SCOPES = new Set<GameScopeType>(["all", "objective", "grammar", "lexicon", "workplace", "consolidation", "conjugation"]);
const VALID_MODES = new Set<ArcadeMode>(["survival", "sprint", "typed", "match", "verb-prepositions", "y-en"]);

export default function PlayGame({ searchParams }: { searchParams: { scope?: string; key?: string; mode?: string } }) {
  const scopeType = VALID_SCOPES.has(searchParams.scope as GameScopeType) ? searchParams.scope as GameScopeType : "all";
  const mode = VALID_MODES.has(searchParams.mode as ArcadeMode) ? searchParams.mode as "survival" | "sprint" | "typed" | "match" | "verb-prepositions" | "y-en" : "survival";
  if ((mode === "verb-prepositions" && (scopeType !== "conjugation" || searchParams.key !== "prepositions")) || (mode === "y-en" && (scopeType !== "conjugation" || searchParams.key !== "y-en"))) notFound();
  const resolved = resolveGameScope(scopeType, searchParams.key || "all");
  if (!resolved) notFound();
  const session = buildArcadeSession(resolved.items, mode);

  return (
    <>
      <p className="muted"><Link href={`/games?scope=${resolved.scope.type}&key=${encodeURIComponent(resolved.scope.id)}`}>← Games</Link></p>
      <div className="game-page-title"><div><span className="eyebrow">{mode.toUpperCase()}</span><h1>{resolved.scope.label}</h1></div><span className="pill available">{session.length} questions</span></div>
      {session.length ? <ArcadeGame key={`${resolved.scope.type}:${resolved.scope.id}:${mode}`} items={session} mode={mode} scope={resolved.scope} /> : <section className="panel empty-state"><h2>This mode needs a different question type</h2><p>Choose another game for this topic, or broaden the question pool.</p><Link className="btn" href={`/games?scope=${resolved.scope.type}&key=${encodeURIComponent(resolved.scope.id)}`}>Choose another mode</Link></section>}
    </>
  );
}
