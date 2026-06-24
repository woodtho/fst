// Server-side content layer. Reads the authored JSON in /content directly so the
// app runs with no database. (The Prisma schema + loader remain the production path;
// this slice swaps the data source, not the shapes.)
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CONTENT = join(process.cwd(), "content");
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

export type Objective = {
  id: string;
  of: number;
  level: "A" | "B";
  order: number;
  titleFr: string;
  titleEn: string;
  primarySkill: string;
  secondarySkills: string[];
  themes: string[];
  grammarConcepts: string[];
  vocabDomains: string[];
  prereqs: string[];
};

export type Item = {
  id: string;
  objectiveId: string;
  skill: string;
  difficulty: "easy" | "medium" | "advanced";
  type: string;
  theme?: string;
  grammarConcepts?: string[];
  vocabDomains?: string[];
  estTimeSec: number;
  prompt: any;
  answer: { type: string; accepted: string[]; normalizer?: string; regex?: string | null };
  distractors?: { value: string; tag: string }[];
  explanation: any;
  tip: any;
};

let _curriculum: any = null;
function curriculum() {
  if (!_curriculum) _curriculum = read(join(CONTENT, "curriculum.json"));
  return _curriculum;
}

export function getObjectives(): Objective[] {
  return curriculum().objectives as Objective[];
}

export function getObjective(id: string): Objective | undefined {
  return getObjectives().find((o) => o.id === id);
}

export function getModule(id: string): any | null {
  const p = join(CONTENT, "modules", `${id}.json`);
  return existsSync(p) ? read(p) : null;
}

export function getCoverage(id: string): any | null {
  const p = join(CONTENT, "coverage", `${id}.json`);
  return existsSync(p) ? read(p) : null;
}

export function getItems(objectiveId: string): Item[] {
  const p = join(CONTENT, "question-bank", "items", `${objectiveId}.json`);
  if (!existsSync(p)) return [];
  return read(p).items as Item[];
}

export function getItem(itemId: string): Item | undefined {
  const dir = join(CONTENT, "question-bank", "items");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const bank = read(join(dir, f));
      const hit = (bank.items as Item[]).find((it) => it.id === itemId);
      if (hit) return hit;
    }
  }
  const lexiconHit = getLexiconQuestions().find((it) => it.id === itemId);
  if (lexiconHit) return lexiconHit;
  return undefined;
}

/** Which objectives actually have authored learn/practice content available in this slice. */
export function getAvailability(id: string) {
  return {
    hasModule: !!getModule(id),
    itemCount: getItems(id).length,
  };
}

// ---- PFL2 source lexicon (parsed by OF) ------------------------------------

export type LexEntry = { fr: string; en: string };
export type LexiconByOf = {
  objectiveId: string;
  of: number;
  titleFr: string;
  titleEn: string;
  source: { catalogue: string; text: string };
  count: number;
  entries: LexEntry[];
};

export function getLexiconByOf(id: string): LexiconByOf | null {
  const p = join(CONTENT, "lexicon", "by-of", `${id}.json`);
  return existsSync(p) ? read(p) : null;
}

export function getLexiconLearn(): any | null {
  const p = join(CONTENT, "lexicon", "learn.json");
  return existsSync(p) ? read(p) : null;
}

export function getLexiconQuestions(): Item[] {
  const p = join(CONTENT, "lexicon", "questions.json");
  if (!existsSync(p)) return [];
  return read(p).items as Item[];
}

export function getSupplementalLexicon(): any | null {
  const p = join(CONTENT, "lexicon", "supplemental-digital.json");
  return existsSync(p) ? read(p) : null;
}

export type LexiconSearchEntry = LexEntry & {
  of: number;
  objectiveId: string;
  titleFr?: string;
  level?: "A" | "B" | "Supplemental";
  sourceKind: "source" | "supplemental";
  category?: string;
};

let _allLex: LexiconSearchEntry[] | null = null;
/** Every lexicon entry across all OFs, tagged with its objective (for the lexicon tool). */
export function getAllLexicon() {
  if (_allLex) return _allLex;
  const out: LexiconSearchEntry[] = [];
  for (const o of getObjectives()) {
    const lx = getLexiconByOf(o.id);
    if (lx) {
      for (const e of lx.entries) {
        out.push({
          ...e,
          of: o.of,
          objectiveId: o.id,
          titleFr: o.titleFr,
          level: o.of <= 20 ? "A" : "B",
          sourceKind: "source"
        });
      }
    }
  }
  const supplemental = getSupplementalLexicon();
  if (supplemental) {
    for (const e of supplemental.entries ?? []) {
      out.push({
        fr: e.fr,
        en: e.en,
        of: supplemental.of,
        objectiveId: supplemental.objectiveId,
        titleFr: supplemental.titleFr,
        level: "Supplemental",
        sourceKind: "supplemental",
        category: e.category
      });
    }
  }
  _allLex = out;
  return out;
}

// ---- item aggregation for cross-cutting tools -----------------------------

let _allItems: Item[] | null = null;
function allItems(): Item[] {
  if (_allItems) return _allItems;
  const dir = join(CONTENT, "question-bank", "items");
  const out: Item[] = [];
  if (existsSync(dir))
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      for (const it of (read(join(dir, f)).items as Item[])) out.push(it);
    }
  _allItems = out;
  return out;
}

export function getItemsByConcept(concept: string): Item[] {
  return allItems().filter((it) => (it.grammarConcepts ?? []).includes(concept));
}

export function getItemsByDomain(domain: string): Item[] {
  return allItems().filter((it) => (it.vocabDomains ?? []).includes(domain));
}

export function getItemsByTheme(themes: string[]): Item[] {
  const set = new Set(themes);
  return allItems().filter((it) => it.theme != null && set.has(it.theme));
}

/** Items drawn from every objective whose OF number is within [from, to] (consolidation). */
export function getItemsForOfRange(from: number, to: number): Item[] {
  const ids = new Set(getObjectives().filter((o) => o.of >= from && o.of <= to).map((o) => o.id));
  return allItems().filter((it) => ids.has(it.objectiveId));
}

let _conceptLib: any = null;
export function getConceptLibrary(): Record<string, any> {
  if (!_conceptLib) _conceptLib = read(join(CONTENT, "_concepts", "library.json")).concepts;
  return _conceptLib;
}

// ---- Supplementary source booklets (consolidation / self-evaluation) -------

let _manifest: any = null;
function manifest() {
  if (!_manifest) {
    const p = join(process.cwd(), "sources", "manifest.json");
    _manifest = existsSync(p) ? read(p) : { supplements: {} };
  }
  return _manifest;
}

export type Supplement = {
  kind: "consolidation" | "self_eval";
  booklet: number;
  ofRange: [number, number];
  catalogue: string;
  pdf: string;
  text: string;
};

export function getConsolidationBooklets(): Supplement[] {
  return (manifest().supplements?.consolidation ?? []) as Supplement[];
}
export function getSelfEvalBooklets(): Supplement[] {
  return (manifest().supplements?.selfEvaluation ?? []) as Supplement[];
}

/** The consolidation + self-evaluation source booklets that cover a given objective. */
export function getSupplements(of: number): { consolidation?: Supplement; selfEval?: Supplement } {
  const s = manifest().supplements ?? {};
  const inRange = (b: any) => of >= b.ofRange[0] && of <= b.ofRange[1];
  return {
    consolidation: (s.consolidation ?? []).find(inRange),
    selfEval: (s.selfEvaluation ?? []).find(inRange),
  };
}

// ---- client-safe shapes (no answers / explanations leak to the browser) ----

export type SanitizedItem = {
  id: string;
  type: string;
  difficulty: string;
  skill: string;
  estTimeSec: number;
  prompt: { fr?: string; en?: string; instructions_en?: string; media?: any };
  options?: string[]; // MCQ family + matching right-side pool (shuffled)
  tokens?: string[]; // sentence_build (shuffled)
  left?: string[]; // matching: fixed-order prompts (left column)
};

const MCQ = new Set(["mcq_single", "mcq_multi", "listening_mcq", "dialogue_complete"]);

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function sanitize(item: Item): SanitizedItem {
  const base: SanitizedItem = {
    id: item.id,
    type: item.type,
    difficulty: item.difficulty,
    skill: item.skill,
    estTimeSec: item.estTimeSec,
    prompt: {
      fr: item.prompt.fr,
      en: item.prompt.en,
      instructions_en: item.prompt.instructions_en,
      media: item.prompt.media ?? null,
    },
  };
  if (MCQ.has(item.type) && item.distractors?.length) {
    base.options = shuffle(item.distractors.map((d) => d.value));
  }
  if (item.type === "sentence_build" && item.prompt.tokens) {
    base.tokens = shuffle(item.prompt.tokens as string[]);
  }
  if (item.type === "matching" && item.prompt.left && item.prompt.right) {
    base.left = item.prompt.left as string[];
    base.options = shuffle(item.prompt.right as string[]); // right-side pool, answers stay server-side
  }
  return base;
}
