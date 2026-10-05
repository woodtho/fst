import {
  getConceptLibrary,
  getItems,
  getItemsByConcept,
  getItemsByDomain,
  getItemsByTheme,
  getItemsForOfRange,
  getLexiconQuestions,
  getObjective,
  getObjectives,
  getVerbGameItems,
  type Item,
} from "./content.ts";
import { buildSession } from "./session.ts";
import type { ArcadeItem, GameAvailability, GameScope, GameScopeType } from "./gameTypes.ts";

const MCQ_TYPES = new Set(["mcq_single", "listening_mcq", "dialogue_complete"]);

export type ResolvedGameScope = { scope: GameScope; items: Item[] };

export function resolveGameScope(type: GameScopeType, id: string): ResolvedGameScope | null {
  if (type === "all") {
    return { scope: { type, id: "all", label: "All objectives" }, items: getObjectives().flatMap((objective) => getItems(objective.id)) };
  }
  if (type === "objective") {
    const objective = getObjective(id);
    return objective ? { scope: { type, id, label: `${objective.id} · ${objective.titleFr}` }, items: getItems(id) } : null;
  }
  if (type === "grammar") {
    const concept = getConceptLibrary()[id];
    return concept ? { scope: { type, id, label: concept.nameFr }, items: getItemsByConcept(id) } : null;
  }
  if (type === "lexicon") {
    return { scope: { type, id: "all", label: "Lexicon" }, items: getLexiconQuestions() };
  }
  if (type === "workplace") {
    const combined = [
      ...getItemsByDomain("workplace"),
      ...getItemsByDomain("government"),
      ...getItemsByDomain("administration"),
      ...getItemsByTheme(["workplace", "meetings", "scheduling", "telephone", "government_terminology", "public_service"]),
    ];
    const seen = new Set<string>();
    return { scope: { type, id: "all", label: "Government & workplace" }, items: combined.filter((item) => seen.has(item.id) ? false : (seen.add(item.id), true)) };
  }
  if (type === "consolidation") {
    const match = /^(\d+)-(\d+)$/.exec(id);
    if (!match) return null;
    const from = Number(match[1]);
    const to = Number(match[2]);
    if (from < 1 || to > 40 || from > to) return null;
    return { scope: { type, id, label: `Consolidation OF ${from}–${to}` }, items: getItemsForOfRange(from, to) };
  }
  if (type === "conjugation" && (id === "prepositions" || id === "y-en")) {
    return {
      scope: { type, id, label: id === "prepositions" ? "Verb prepositions" : "Y or en" },
      items: getVerbGameItems(id),
    };
  }
  return null;
}

export function getGameAvailability(items: Item[]): GameAvailability {
  return {
    survival: items.filter((item) => MCQ_TYPES.has(item.type) || item.type === "fill_blank").length,
    sprint: items.filter((item) => MCQ_TYPES.has(item.type)).length,
    typed: items.filter((item) => item.type === "fill_blank").length,
    match: items.filter((item) => item.type === "matching").length,
  };
}

export function buildArcadeSession(items: Item[], mode: "survival" | "sprint" | "typed" | "match" | "verb-prepositions" | "y-en"): ArcadeItem[] {
  if (mode === "verb-prepositions" || mode === "y-en") {
    const mcq = buildSession(items.filter((item) => MCQ_TYPES.has(item.type)), 9, "shuffle");
    const typed = buildSession(items.filter((item) => item.type === "fill_blank"), 9, "shuffle");
    return Array.from({ length: 9 }, (_, index) => [mcq[index], typed[index]]).flat().filter(Boolean) as ArcadeItem[];
  }
  const eligible = items.filter((item) => {
    if (mode === "survival") return MCQ_TYPES.has(item.type) || item.type === "fill_blank";
    if (mode === "sprint") return MCQ_TYPES.has(item.type);
    if (mode === "typed") return item.type === "fill_blank";
    return item.type === "matching";
  });
  const limit = mode === "sprint" ? 40 : mode === "survival" ? 18 : mode === "typed" ? 15 : 8;
  return buildSession(eligible, limit, "shuffle") as ArcadeItem[];
}
