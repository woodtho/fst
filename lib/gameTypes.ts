export type GameScopeType = "all" | "objective" | "grammar" | "lexicon" | "workplace" | "consolidation" | "numbers" | "conjugation";

export type ArcadeMode =
  | "survival"
  | "sprint"
  | "typed"
  | "match"
  | "verb-prepositions"
  | "y-en"
  | "numbers-write"
  | "numbers-read"
  | "numbers-special"
  | "numbers-math"
  | "numbers-formats"
  | "numbers-compare"
  | "numbers-sequence"
  | "lexicon"
  | "conjugation";

export type GameScope = {
  type: GameScopeType;
  id: string;
  label: string;
};

export type ArcadeItem = {
  id: string;
  type: string;
  difficulty: string;
  skill: string;
  estTimeSec: number;
  prompt: { fr?: string; en?: string; instructions_en?: string; media?: unknown };
  options?: string[];
  tokens?: string[];
  left?: string[];
};

export type GameAvailability = Record<"survival" | "sprint" | "typed" | "match", number>;
