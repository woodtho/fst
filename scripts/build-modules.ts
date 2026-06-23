/**
 * build-modules.ts
 * Generates content/modules/OFn.json + content/question-bank/items/OFn.json for ALL 40 OFs,
 * with AT LEAST 100 questions each, drawn from authentic sources:
 *
 *   1. Vocabulary (the bulk): the OF's PFL2 source lexicon (content/lexicon/by-of) → French↔
 *      English multiple-choice items + matching sets. Real, source-grounded vocabulary.
 *   2. Grammar: the hand-authored concept library (base + extra) for the OF's grammar concepts.
 *   3. Conjugation: for each tense concept, correct + explained fill-in items produced by the
 *      conjugation engine (lib/conjugation.ts) over many verb × person combinations.
 *   4. Padding: additional random vocabulary-matching sets until the OF reaches the target.
 *
 * Every item carries the full explanation contract. Deterministic (seeded RNG) so re-runs
 * are reproducible. Item banks are written compact (one OF per file) to keep size down.
 *
 * Run: node --experimental-strip-types scripts/build-modules.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { VERBS, PERSONS, TENSES, conjugateRaw, conjugate, type Tense, type PersonKey } from "../lib/conjugation.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const curriculum = read("content/curriculum.json");
const library = read("content/_concepts/library.json").concepts as Record<string, any>;
const extra = existsSync(join(ROOT, "content/_concepts/library-extra.json"))
  ? (read("content/_concepts/library-extra.json").concepts as Record<string, any>)
  : {};
const manifest = read("sources/manifest.json");

const TARGET = 110; // at least 100 per OF, with margin

function poolFor(concept: string): any[] {
  return [...(library[concept]?.items ?? []), ...(extra[concept]?.items ?? [])];
}
function booklet(kind: "consolidation" | "selfEvaluation", of: number) {
  return (manifest.supplements?.[kind] ?? []).find((b: any) => of >= b.ofRange[0] && of <= b.ofRange[1]) ?? null;
}

// ---- deterministic RNG (mulberry32) ---------------------------------------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle<T>(r: () => number, arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function sample<T>(r: () => number, arr: T[], n: number): T[] { return shuffle(r, arr).slice(0, n); }

// ---- tense templates for conjugation items --------------------------------
const TENSE_RULE: Record<string, string> = {
  present: "Présent : -er → -e/-es/-e/-ons/-ez/-ent ; être/avoir/aller/faire sont irréguliers.",
  passe_compose: "Passé composé = auxiliaire (avoir/être) au présent + participe passé (accord avec être).",
  imparfait: "Imparfait = radical du « nous » présent (sans -ons) + -ais/-ais/-ait/-ions/-iez/-aient.",
  futur_simple: "Futur simple = infinitif (radical) + -ai/-as/-a/-ons/-ez/-ont ; radicaux irréguliers (ser-, aur-, ir-, fer-).",
  conditionnel: "Conditionnel = radical du futur + terminaisons de l’imparfait (-ais/-ait/-ions…).",
  subjonctif: "Subjonctif présent (après « que ») : radical du « ils » présent + -e/-es/-e/-ions/-iez/-ent ; irréguliers (sois, aie, fasse, aille…).",
};
const TENSE_TIP: Record<string, { memory_aid: string; pattern: string }> = {
  present: { memory_aid: "Identifiez le groupe (-er/-ir/-re) puis la personne.", pattern: "radical + terminaison de la personne." },
  passe_compose: { memory_aid: "Auxiliaire + participe (collés).", pattern: "avoir/être au présent + participe passé." },
  imparfait: { memory_aid: "Radical = « nous » présent sans -ons.", pattern: "nous-radical + -ais/-ait…" },
  futur_simple: { memory_aid: "Radical du futur = l’infinitif (sauf irréguliers).", pattern: "infinitif + -ai/-ons…" },
  conditionnel: { memory_aid: "Futur stem + terminaisons de l’imparfait.", pattern: "radical futur + -ais/-ait…" },
  subjonctif: { memory_aid: "Déclencheur (il faut que, vouloir que…) → subjonctif.", pattern: "que + sujet + subjonctif." },
};
const CONCEPT_TO_TENSE: Record<string, Tense> = {
  present: "present", passe_compose: "passe_compose", imparfait: "imparfait",
  futur_simple: "futur_simple", conditionnel: "conditionnel", subjonctif: "subjonctif",
};
const PERSON_DISPLAY: Record<PersonKey, string> = { je: "je", tu: "tu", il: "il", nous: "nous", vous: "vous", ils: "ils" };

// ---- vocabulary helpers ---------------------------------------------------
const EN_STOP = new Set(["the", "a", "an", "to", "at", "of", "in", "some", "with", "and", "or", "this", "that", "these"]);
function frBare(fr: string) { return fr.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim(); }
function cleanList(entries: { fr: string; en: string }[]) {
  const out: { fr: string; en: string }[] = [];
  for (const e of entries) {
    if (!e.fr || !e.en) continue;
    if (frBare(e.fr).length < 2) continue;
    if (EN_STOP.has(e.en.trim().toLowerCase())) continue;
    if (frBare(e.fr).toLowerCase() === e.en.trim().toLowerCase()) continue;
    out.push(e);
  }
  return out;
}

// Cleaned source entries per OF, then a CUMULATIVE vocab pool (the OF's own vocabulary +
// earlier OFs' — vocabulary is cumulative). Guarantees a large pool even for OFs whose own
// lexicon section is short (e.g. OF35 has only 3 new terms). Deduped by English meaning.
const cleanedByOf: Record<number, { fr: string; en: string }[]> = {};
for (const o of curriculum.objectives) {
  const lx = read(`content/lexicon/by-of/${o.id}.json`);
  cleanedByOf[o.of] = cleanList(lx.entries ?? []);
}
const VOCAB_POOL_MAX = 36;
function vocabPool(of: number) {
  const seenEn = new Set<string>();
  const pool: { fr: string; en: string }[] = [];
  const add = (list: { fr: string; en: string }[]) => {
    for (const e of list) {
      if (pool.length >= VOCAB_POOL_MAX) return;
      const k = e.en.trim().toLowerCase();
      if (!seenEn.has(k)) { seenEn.add(k); pool.push(e); }
    }
  };
  add(cleanedByOf[of] ?? []);                                   // the OF's own vocabulary first
  for (let k = of - 1; k >= 1 && pool.length < VOCAB_POOL_MAX; k--) add(cleanedByOf[k] ?? []); // then earlier OFs
  return pool;
}

// ---------------------------------------------------------------------------
let modCount = 0, itemCount = 0;

for (const obj of curriculum.objectives) {
  const concepts: string[] = (obj.grammarConcepts ?? []).filter((c: string) => library[c] || extra[c]);
  const ofLower = obj.id.toLowerCase();
  const theme = obj.themes?.[0] ?? "workplace";
  const vocabDomains = obj.vocabDomains ?? [];
  const r = rng(obj.of * 7919 + 13);

  const lex = read(`content/lexicon/by-of/${obj.id}.json`);
  const entries = vocabPool(obj.of);
  const items: any[] = [];
  const counts = { vocab: 0, grammar: 0, conjugation: 0 };
  let n = 1;
  const newId = (tag: string) => `itm_${ofLower}_${tag}_${n++}`;

  // 1. Vocabulary — French → English MCQ
  for (const e of entries) {
    const others = sample(r, entries.filter((x) => x.en !== e.en), 3);
    if (others.length < 3) continue;
    const distractors = [{ value: e.en, tag: "correct" }, ...others.map((o, i) => ({ value: o.en, tag: `d${i}` }))];
    const dWhy: Record<string, string> = {};
    others.forEach((o, i) => { dWhy[`d${i}`] = `'${o.en}' is the meaning of « ${o.fr} », not « ${e.fr} ».`; });
    items.push({
      id: newId("vocfe"), objectiveId: obj.id, skill: "vocabulary", grammarConcepts: [], vocabDomains, theme,
      difficulty: "easy", type: "mcq_single", status: "live", estTimeSec: 18, irtB: -0.8,
      prompt: { fr: `« ${e.fr} »`, instructions_en: "What does this mean in English?" },
      answer: { type: "choice", accepted: [e.en], normalizer: "trim_lower" },
      distractors,
      explanation: { correct_why: `« ${e.fr} » means '${e.en}'.`, distractor_why: dWhy, grammar_rule: "Vocabulary item (PFL2 source lexicon).", vocab_notes: `From the OF${obj.of} lexicon (${lex.source?.catalogue ?? "SC102-2/1-2-2005F"}).`, common_mistakes: [`confusing « ${e.fr} » with similar terms`] },
      tip: { memory_aid: `Link « ${frBare(e.fr)} » ↔ '${e.en}'.`, pattern: "Build your personal glossary from the source lexicon.", similar: sample(r, entries.filter((x) => x.fr !== e.fr), 2).map((x) => x.fr) },
    });
    counts.vocab++;
  }

  // 2. Vocabulary — English → French MCQ
  for (const e of entries) {
    const others = sample(r, entries.filter((x) => x.fr !== e.fr), 3);
    if (others.length < 3) continue;
    const distractors = [{ value: e.fr, tag: "correct" }, ...others.map((o, i) => ({ value: o.fr, tag: `d${i}` }))];
    const dWhy: Record<string, string> = {};
    others.forEach((o, i) => { dWhy[`d${i}`] = `« ${o.fr} » means '${o.en}', not '${e.en}'.`; });
    items.push({
      id: newId("vocef"), objectiveId: obj.id, skill: "vocabulary", grammarConcepts: [], vocabDomains, theme,
      difficulty: "easy", type: "mcq_single", status: "live", estTimeSec: 18, irtB: -0.6,
      prompt: { fr: `'${e.en}'`, instructions_en: "How do you say this in French?" },
      answer: { type: "choice", accepted: [e.fr], normalizer: "fr_accent_insensitive_trim_lower" },
      distractors,
      explanation: { correct_why: `'${e.en}' is « ${e.fr} » in French.`, distractor_why: dWhy, grammar_rule: "Vocabulary item (PFL2 source lexicon).", vocab_notes: `From the OF${obj.of} lexicon (${lex.source?.catalogue ?? "SC102-2/1-2-2005F"}).`, common_mistakes: [`confusing « ${e.fr} » with near-synonyms`] },
      tip: { memory_aid: `'${e.en}' → « ${frBare(e.fr)} ».`, pattern: "Recall the French from the English meaning.", similar: sample(r, entries.filter((x) => x.fr !== e.fr), 2).map((x) => x.fr) },
    });
    counts.vocab++;
  }

  // 3. Grammar — concept library items (base + extra, all)
  for (const concept of concepts) {
    for (const tpl of poolFor(concept)) {
      items.push({
        id: newId(`lib_${concept}`), objectiveId: obj.id, skill: tpl.skill, grammarConcepts: [concept], vocabDomains, theme,
        difficulty: tpl.difficulty, type: tpl.type, status: "live", estTimeSec: tpl.estTimeSec ?? 35, irtB: tpl.irtB ?? 0,
        prompt: tpl.prompt, answer: tpl.answer, distractors: tpl.distractors ?? [], explanation: tpl.explanation, tip: tpl.tip,
      });
      counts.grammar++;
    }
  }

  // 4. Conjugation — for each tense concept, many verb × person fill-ins
  const tenseConcepts = concepts.filter((c) => CONCEPT_TO_TENSE[c]);
  for (const concept of tenseConcepts) {
    const tense = CONCEPT_TO_TENSE[concept];
    const tInfo = TENSES.find((t) => t.key === tense)!;
    const verbs = sample(r, VERBS, 6);
    for (const v of verbs) {
      for (const p of sample(r, PERSONS, 2)) {
        const raw = conjugateRaw(v, tense, p.key);
        const full = conjugate(v, tense, p.key);
        const subj = (tense === "subjonctif" ? "que " : "") + PERSON_DISPLAY[p.key];
        items.push({
          id: newId(`conj_${tense}`), objectiveId: obj.id, skill: "grammar", grammarConcepts: [concept], vocabDomains, theme,
          difficulty: tense === "present" || tense === "passe_compose" ? "medium" : "advanced", type: "fill_blank", status: "live", estTimeSec: 30, irtB: tense === "present" ? -0.2 : 0.4,
          prompt: { fr: `${subj} ___ (${v.inf})`, instructions_en: `Conjugate « ${v.inf} » in the ${tInfo.en.toLowerCase()} (type the verb form).` },
          answer: { type: "text", accepted: Array.from(new Set([raw, full])), normalizer: "fr_accent_insensitive_trim_lower" },
          distractors: [],
          explanation: { correct_why: `${tInfo.fr} de « ${v.inf} » à la personne « ${PERSON_DISPLAY[p.key]} » : « ${raw} ».`, distractor_why: {}, grammar_rule: TENSE_RULE[tense], vocab_notes: `${v.inf} = ${v.en}.`, common_mistakes: ["confondre les terminaisons des personnes", "oublier le radical irrégulier"] },
          tip: { memory_aid: TENSE_TIP[tense].memory_aid, pattern: TENSE_TIP[tense].pattern, similar: [conjugate(v, tense, "nous"), conjugate(v, tense, "ils")] },
        });
        counts.conjugation++;
      }
    }
  }

  // 5. Vocabulary matching sets (initial + padding to reach the target)
  const makeMatch = () => {
    const five = sample(r, entries, 5);
    if (five.length < 5) return null;
    const left = five.map((e) => e.fr), right = five.map((e) => e.en);
    return {
      id: newId("vocmatch"), objectiveId: obj.id, skill: "vocabulary", grammarConcepts: [], vocabDomains, theme,
      difficulty: "medium", type: "matching", status: "live", estTimeSec: 55, irtB: 0.0,
      prompt: { fr: "Associez chaque terme français à son sens anglais.", instructions_en: "Match each French term to its English meaning.", left, right },
      answer: { type: "sequence", accepted: [right.join(" ")], normalizer: "fr_accent_insensitive_trim_lower" },
      distractors: [],
      explanation: { correct_why: five.map((e) => `« ${e.fr} » = ${e.en}`).join("; ") + ".", distractor_why: {}, grammar_rule: "Vocabulary matching (PFL2 source lexicon).", vocab_notes: `From the OF${obj.of} lexicon.`, common_mistakes: ["confusing near-synonyms"] },
      tip: { memory_aid: "Group related terms when you revise.", pattern: "French term ↔ English meaning.", similar: five.slice(0, 2).map((e) => e.fr) },
    };
  };
  const seenMatch = new Set<string>();
  let guard = 0;
  while (items.length < TARGET && entries.length >= 5 && guard < 2000) {
    guard++;
    const m = makeMatch();
    if (!m) break;
    const key = (m.prompt.left as string[]).slice().sort().join("|");
    if (seenMatch.has(key)) continue;
    seenMatch.add(key);
    items.push(m);
    counts.vocab++;
  }

  itemCount += items.length;
  writeFileSync(
    join(ROOT, "content", "question-bank", "items", `${obj.id}.json`),
    JSON.stringify({ schema: "items/v1", objectiveId: obj.id, source: { catalogue: obj.source?.catalogue, generated: true, counts, note: "Generated from the OF source lexicon (vocabulary), the concept library (grammar) and the conjugation engine. Full explanation contract on every item." }, items })
  );

  // ---- module ----
  const conceptNamesEn = concepts.map((c) => (library[c] ?? extra[c]).nameEn).join(", ");
  const conceptNamesFr = concepts.map((c) => (library[c] ?? extra[c]).nameFr).join(", ");
  const fn = obj.titleEn.replace(/^To\s+/, "").trim();
  const points: string[] = [];
  for (const c of concepts) {
    const info = library[c] ?? extra[c];
    points.push(`${info.nameFr} (${info.nameEn}) — ${info.summaryFr}`);
    for (const rl of info.rules ?? []) points.push(`· ${rl}`);
  }
  const cons = booklet("consolidation", obj.of);
  const self = booklet("selfEvaluation", obj.of);
  const byBand = (b: string) => items.filter((it) => it.difficulty === b).length;

  const module = {
    schema: "module/v1", objectiveId: obj.id, titleFr: obj.titleFr, titleEn: obj.titleEn, level: obj.level,
    estMinutes: 40, generated: true, source: obj.source ?? null,
    stages: {
      learn: {
        conceptExplanation: {
          en: `${obj.id} — ${obj.titleEn}. This objective develops the language needed to ${fn[0].toLowerCase() + fn.slice(1)} in a Government of Canada workplace. Grammar focus: ${conceptNamesEn}. Study the PFL2 source vocabulary (panel below), review the grammar notes, then practise (${items.length} questions) and consolidate.`,
          fr: `${obj.titleFr}. Objectif communicatif appuyé par : ${conceptNamesFr}. Étudiez le lexique source (ci-dessous), révisez la grammaire, puis pratiquez (${items.length} questions).`,
        },
        vocabularyNote: "The full PFL2 source vocabulary for this objective is shown in the 'Lexicon — PFL2 source vocabulary' panel below (from SC102-2/1-2-2005F).",
        grammarNotes: { summary: `Grammar focus for this objective: ${conceptNamesEn}.`, charts: [], points },
        pronunciation: { points: ["Listen to and repeat the source vocabulary aloud; French final consonants are often silent and vowels are pure.", "Liaison links a final consonant to a following vowel (e.g. vous‿êtes, nous‿avons)."] },
        dialogues: [], exampleTexts: [],
      },
      practice: {
        // Categories only (the bank has 100+ items; the practice runner samples randomly).
        exerciseSets: [
          { title: "Vocabulaire (lexique source)", count: counts.vocab },
          ...(counts.grammar ? [{ title: "Grammaire", count: counts.grammar }] : []),
          ...(counts.conjugation ? [{ title: "Conjugaison", count: counts.conjugation }] : []),
        ],
        totalQuestions: items.length,
      },
      consolidation: {
        sourceBooklet: cons ? { kind: cons.kind, booklet: cons.booklet, ofRange: cons.ofRange, catalogue: cons.catalogue } : null,
        note: cons ? `Consolidation review for OF ${cons.ofRange[0]}–${cons.ofRange[1]} draws randomly from every objective in this range (including this OF's ${items.length} questions). See /consolidation/${cons.ofRange[0]}-${cons.ofRange[1]}.` : null,
        tasks: [
          { title: `Tâche de consolidation — ${obj.titleFr}`, type: "scenario",
            promptFr: `Dans un contexte de travail, mettez en pratique la fonction « ${obj.titleFr.toLowerCase()} ». Rédigez ou jouez un court échange (3 à 4 phrases) en employant : ${conceptNamesFr}.`,
            promptEn: `In a workplace context, practise the function "${obj.titleEn}". Produce a short exchange (3–4 sentences) using: ${conceptNamesEn}.`,
            rubric: ["addresses the communicative function", "uses the target grammar correctly", "workplace register (vous)"] },
        ],
      },
      selfTest: {
        sourceBooklet: self ? { kind: self.kind, booklet: self.booklet, ofRange: self.ofRange, catalogue: self.catalogue } : null,
        timedSeconds: 18 * 35,
        blueprint: { easy: Math.min(byBand("easy"), 8), medium: Math.min(byBand("medium"), 6), advanced: Math.min(byBand("advanced"), 4) },
        drawFrom: [obj.id],
      },
      masteryCheck: { threshold: 0.8, concepts },
    },
  };
  writeFileSync(join(ROOT, "content", "modules", `${obj.id}.json`), JSON.stringify(module, null, 2));
  modCount++;
}

console.log(`Generated ${modCount} modules and ${itemCount} items (${(itemCount / modCount).toFixed(0)} avg/OF, target ${TARGET}).`);
