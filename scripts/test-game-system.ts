import assert from "node:assert/strict";
import { getConceptLibrary, getConsolidationBooklets, getObjectives } from "../lib/content.ts";
import { buildArcadeSession, getGameAvailability, resolveGameScope } from "../lib/games.ts";
import { emptyGameScoreStore, mergeGameScore, parseGameScoreStore, scoreArcadeAnswer, sortedGameScores } from "../lib/gameScores.ts";
import type { ArcadeMode, GameScope } from "../lib/gameTypes.ts";

const scope: GameScope = { type: "objective", id: "of01", label: "OF 1" };
let scores = emptyGameScoreStore();
scores = mergeGameScore(scores, { scope, mode: "survival", modeLabel: "Survival", score: 500, bestStreak: 3, playedAt: "2026-01-01T00:00:00.000Z" });
scores = mergeGameScore(scores, { scope, mode: "survival", modeLabel: "Survival", score: 300, bestStreak: 7, playedAt: "2026-01-02T00:00:00.000Z" });
let entry = sortedGameScores(scores)[0];
assert.equal(entry.highScore, 500);
assert.equal(entry.bestStreak, 7);
assert.equal(entry.gamesPlayed, 2);
scores = mergeGameScore(scores, { scope, mode: "survival", modeLabel: "Survival", score: 900, bestStreak: 4 });
entry = sortedGameScores(scores)[0];
assert.equal(entry.highScore, 900);
assert.equal(entry.gamesPlayed, 3);
scores = mergeGameScore(scores, { scope: { type: "grammar", id: "articles", label: "Articles" }, mode: "survival", modeLabel: "Survival", score: 100, bestStreak: 1 });
assert.equal(sortedGameScores(scores).length, 2);
assert.deepEqual(parseGameScoreStore("not json"), emptyGameScoreStore());
assert.deepEqual(parseGameScoreStore('{"version":2,"scores":{}}'), emptyGameScoreStore());
assert.deepEqual(parseGameScoreStore('{"version":1,"scores":{"bad":{"highScore":"lots"}}}'), emptyGameScoreStore());

assert.equal(scoreArcadeAnswer("survival", true, 0), 100);
assert.equal(scoreArcadeAnswer("typed", true, 2), 200);
assert.equal(scoreArcadeAnswer("match", true, 1), 275);
assert.equal(scoreArcadeAnswer("sprint", false, 2), -25);
assert.equal(scoreArcadeAnswer("sprint", true, 2, 55), 195);

const objective = getObjectives().find((candidate) => resolveGameScope("objective", candidate.id)?.items.length);
assert.ok(objective);
const conceptId = Object.keys(getConceptLibrary()).find((id) => resolveGameScope("grammar", id)?.items.length);
assert.ok(conceptId);
const booklet = getConsolidationBooklets()[0];
assert.ok(booklet);
const rangeId = `${booklet.ofRange[0]}-${booklet.ofRange[1]}`;
const resolvedScopes = [
  resolveGameScope("all", "all"),
  resolveGameScope("objective", objective!.id),
  resolveGameScope("grammar", conceptId!),
  resolveGameScope("lexicon", "all"),
  resolveGameScope("workplace", "all"),
  resolveGameScope("consolidation", rangeId),
];
for (const resolved of resolvedScopes) {
  assert.ok(resolved);
  assert.ok(resolved!.items.length > 0, resolved!.scope.label);
  const availability = getGameAvailability(resolved!.items);
  assert.ok(availability.survival > 0, resolved!.scope.label);
}
assert.equal(resolveGameScope("objective", "missing"), null);
assert.equal(resolveGameScope("consolidation", "40-1"), null);

const all = resolveGameScope("all", "all")!;
for (const mode of ["survival", "sprint", "typed", "match"] as const) {
  const session = buildArcadeSession(all.items, mode);
  assert.ok(session.length > 0, mode);
  assert.equal(new Set(session.map((item) => item.id)).size, session.length, mode);
  for (const item of session) {
    assert.equal("answer" in item, false, `${mode}:${item.id}`);
    assert.equal("explanation" in item, false, `${mode}:${item.id}`);
    if (mode === "sprint") assert.ok(["mcq_single", "listening_mcq", "dialogue_complete"].includes(item.type));
    if (mode === "typed") assert.equal(item.type, "fill_blank");
    if (mode === "match") assert.equal(item.type, "matching");
  }
}

const scoreModes: ArcadeMode[] = ["survival", "sprint", "typed", "match", "verb-prepositions", "y-en", "numbers-formats", "lexicon", "conjugation"];
assert.equal(new Set(scoreModes).size, scoreModes.length);
console.log("Game system tests passed (scores, scopes, sanitized pools, and arcade modes).");
