import type { ArcadeMode, GameScope } from "./gameTypes.ts";

export const GAME_SCORE_STORAGE_KEY = "fsl-trainer:game-scores:v1";

export type LocalGameScore = {
  key: string;
  scope: GameScope;
  mode: ArcadeMode;
  modeLabel: string;
  highScore: number;
  bestStreak: number;
  gamesPlayed: number;
  lastPlayedAt: string;
};

export type GameScoreStore = {
  version: 1;
  scores: Record<string, LocalGameScore>;
};

export type CompletedGame = {
  scope: GameScope;
  mode: ArcadeMode;
  modeLabel: string;
  score: number;
  bestStreak: number;
  playedAt?: string;
};

export const emptyGameScoreStore = (): GameScoreStore => ({ version: 1, scores: {} });

export function gameScoreKey(scope: GameScope, mode: ArcadeMode): string {
  return `${scope.type}:${scope.id}:${mode}`;
}

export function parseGameScoreStore(raw: string | null): GameScoreStore {
  if (!raw) return emptyGameScoreStore();
  try {
    const parsed = JSON.parse(raw) as GameScoreStore;
    if (parsed?.version !== 1 || !parsed.scores || typeof parsed.scores !== "object" || Array.isArray(parsed.scores)) return emptyGameScoreStore();
    const scores: Record<string, LocalGameScore> = {};
    for (const [key, candidate] of Object.entries(parsed.scores)) {
      if (!candidate || typeof candidate !== "object") continue;
      const validScope = candidate.scope && typeof candidate.scope.type === "string" && typeof candidate.scope.id === "string" && typeof candidate.scope.label === "string";
      if (!validScope || typeof candidate.mode !== "string" || typeof candidate.modeLabel !== "string") continue;
      if (![candidate.highScore, candidate.bestStreak, candidate.gamesPlayed].every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0)) continue;
      if (typeof candidate.lastPlayedAt !== "string") continue;
      scores[key] = { ...candidate, key };
    }
    return { version: 1, scores };
  } catch {
    return emptyGameScoreStore();
  }
}

export function mergeGameScore(store: GameScoreStore, completed: CompletedGame): GameScoreStore {
  const key = gameScoreKey(completed.scope, completed.mode);
  const previous = store.scores[key];
  const next: LocalGameScore = {
    key,
    scope: completed.scope,
    mode: completed.mode,
    modeLabel: completed.modeLabel,
    highScore: Math.max(0, previous?.highScore ?? 0, Math.round(completed.score)),
    bestStreak: Math.max(0, previous?.bestStreak ?? 0, Math.round(completed.bestStreak)),
    gamesPlayed: (previous?.gamesPlayed ?? 0) + 1,
    lastPlayedAt: completed.playedAt ?? new Date().toISOString(),
  };
  return { version: 1, scores: { ...store.scores, [key]: next } };
}

export function sortedGameScores(store: GameScoreStore, scope?: GameScope, limit = 10): LocalGameScore[] {
  return Object.values(store.scores)
    .filter((entry) => !scope || (entry.scope.type === scope.type && entry.scope.id === scope.id))
    .sort((a, b) => b.highScore - a.highScore || b.bestStreak - a.bestStreak || b.lastPlayedAt.localeCompare(a.lastPlayedAt))
    .slice(0, limit);
}

export function scoreArcadeAnswer(mode: "survival" | "sprint" | "typed" | "match", correct: boolean, streak: number, secondsLeft = 0): number {
  if (!correct) return mode === "sprint" ? -25 : 0;
  const streakBonus = Math.min(streak, 10) * (mode === "typed" || mode === "match" ? 25 : 20);
  if (mode === "sprint") return 100 + streakBonus + Math.min(60, Math.max(0, secondsLeft));
  if (mode === "typed") return 150 + streakBonus;
  if (mode === "match") return 250 + streakBonus;
  return 100 + streakBonus;
}
