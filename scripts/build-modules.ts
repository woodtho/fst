/**
 * build-modules.ts  (SOURCE-FIDELITY MODE)
 * Generates content/modules/OFn.json + content/question-bank/items/OFn.json for all 40 OFs
 * using ONLY content that is directly traceable to the Government of Canada PFL2 source
 * materials. NO generic generation, NO concept-library examples, NO conjugation drills, NO
 * padding to a target count.
 *
 * For each objective the generator first identifies (from the source-derived metadata):
 *   level, training objective, source document, taught vocabulary (the OF's Lexique section)
 *   and taught grammar concepts (curriculum.json, derived from the OF document).
 * Then, and only then, it assembles the question bank from:
 *   1. Verbatim source activities  (content/question-bank/source/OFn.json — real exercises +
 *      answer keys extracted from the OF document).
 *   2. Source-vocabulary questions (French↔English MCQs + matching) built ONLY from that OF's
 *      own Lexique entries — no untaught vocabulary, no vocabulary from other modules.
 * Every item carries a `trace` block (source document, OF, page, topic, vocabulary set,
 * grammar concepts). If the source yields no questions, the bank is left small/empty by
 * design — the system must not invent content.
 *
 * Run: node --experimental-strip-types scripts/build-modules.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const curriculum = read("content/curriculum.json");
const manifest = read("sources/manifest.json");
const LEXIQUE = "SC102-2/1-2-2005F"; // the PFL2 Lexique source document

function booklet(kind: "consolidation" | "selfEvaluation", of: number) {
  return (manifest.supplements?.[kind] ?? []).find((b: any) => of >= b.ofRange[0] && of <= b.ofRange[1]) ?? null;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle<T>(r: () => number, arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function sample<T>(r: () => number, arr: T[], n: number): T[] { return shuffle(r, arr).slice(0, n); }

// taught-vocabulary cleaning: dedupe by English, drop function-word noise
const EN_STOP = new Set(["the", "a", "an", "to", "at", "of", "in", "some", "with", "and", "or", "this", "that", "these"]);
const frBare = (fr: string) => fr.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
function cleanEntries(entries: { fr: string; en: string }[]) {
  const seen = new Set<string>();
  const out: { fr: string; en: string }[] = [];
  for (const e of entries) {
    const k = e.en.trim().toLowerCase();
    if (!e.fr || !e.en) continue;
    if (frBare(e.fr).length < 2) continue;
    if (EN_STOP.has(k)) continue;
    if (seen.has(k)) continue;
    if (frBare(e.fr).toLowerCase() === k) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

let modCount = 0, itemTotal = 0;
const report: Record<string, { source: number; vocab: number; total: number }> = {};

for (const obj of curriculum.objectives) {
  // ---- identify the source elements for this objective (required before generation) ----
  const id: string = obj.id;
  const of: number = obj.of;
  const ofLower = id.toLowerCase();
  const grammarConcepts: string[] = obj.grammarConcepts ?? [];
  const sourceDoc: string = obj.source?.catalogue ?? id;
  const lex = read(`content/lexicon/by-of/${id}.json`);
  const taughtVocab = cleanEntries(lex.entries ?? []); // ONLY this OF's own taught vocabulary
  const r = rng(of * 7919 + 13);

  const items: any[] = [];
  const counts = { source: 0, vocab: 0 };

  const trace = (extra: any) => ({
    sourceDocument: extra.sourceDocument ?? sourceDoc,
    trainingObjective: id,
    level: obj.level,
    page: extra.page ?? null,
    topicFr: obj.titleFr,
    topicEn: obj.titleEn,
    vocabularySet: extra.vocabularySet ?? null,
    grammarConcepts: extra.grammarConcepts ?? [],
  });

  // 1. Verbatim source activities (real exercises + answer keys from the OF document)
  const srcPath = join(ROOT, "content", "question-bank", "source", `${id}.json`);
  if (existsSync(srcPath)) {
    for (const it of read(`content/question-bank/source/${id}.json`).items) {
      items.push({
        ...it,
        trace: trace({ page: it.source?.page ?? null, topicFr: `activité ${it.source?.activity}`, grammarConcepts: it.grammarConcepts ?? [] }),
      });
      counts.source++;
    }
  }

  // 2. Source-vocabulary questions — ONLY from this OF's own Lexique entries
  const vTrace = (concepts: string[] = []) => trace({ sourceDocument: LEXIQUE, vocabularySet: `Lexique — OF${of}`, grammarConcepts: concepts });
  if (taughtVocab.length >= 4) {
    let n = 1;
    const newId = (t: string) => `itm_${ofLower}_${t}_${n++}`;
    // French → English
    for (const e of taughtVocab) {
      const others = sample(r, taughtVocab.filter((x) => x.en !== e.en), 3);
      if (others.length < 3) continue;
      const dWhy: Record<string, string> = {};
      others.forEach((o, i) => { dWhy[`d${i}`] = `'${o.en}' est le sens de « ${o.fr} », pas de « ${e.fr} ».`; });
      items.push({
        id: newId("voc_fe"), objectiveId: id, skill: "vocabulary", grammarConcepts: [], vocabDomains: obj.vocabDomains ?? [], theme: obj.themes?.[0] ?? "workplace",
        difficulty: "easy", type: "mcq_single", status: "live", estTimeSec: 18, irtB: -0.8,
        prompt: { fr: `« ${e.fr} »`, instructions_en: "What does this mean in English? (PFL2 source vocabulary)" },
        answer: { type: "choice", accepted: [e.en], normalizer: "trim_lower" },
        distractors: [{ value: e.en, tag: "correct" }, ...others.map((o, i) => ({ value: o.en, tag: `d${i}` }))],
        explanation: { correct_why: `« ${e.fr} » signifie '${e.en}'.`, distractor_why: dWhy, grammar_rule: "Vocabulaire du programme PFL2 (Lexique).", vocab_notes: `Lexique OF${of} (${LEXIQUE}).`, common_mistakes: [`confondre « ${e.fr} » avec un terme proche`] },
        tip: { memory_aid: `« ${frBare(e.fr)} » ↔ '${e.en}'.`, pattern: "Vocabulaire enseigné dans cet objectif.", similar: sample(r, taughtVocab.filter((x) => x.fr !== e.fr), 2).map((x) => x.fr) },
        trace: vTrace(),
      });
      counts.vocab++;
    }
    // English → French
    for (const e of taughtVocab) {
      const others = sample(r, taughtVocab.filter((x) => x.fr !== e.fr), 3);
      if (others.length < 3) continue;
      const dWhy: Record<string, string> = {};
      others.forEach((o, i) => { dWhy[`d${i}`] = `« ${o.fr} » signifie '${o.en}', pas '${e.en}'.`; });
      items.push({
        id: newId("voc_ef"), objectiveId: id, skill: "vocabulary", grammarConcepts: [], vocabDomains: obj.vocabDomains ?? [], theme: obj.themes?.[0] ?? "workplace",
        difficulty: "easy", type: "mcq_single", status: "live", estTimeSec: 18, irtB: -0.6,
        prompt: { fr: `'${e.en}'`, instructions_en: "How do you say this in French? (PFL2 source vocabulary)" },
        answer: { type: "choice", accepted: [e.fr], normalizer: "fr_accent_insensitive_trim_lower" },
        distractors: [{ value: e.fr, tag: "correct" }, ...others.map((o, i) => ({ value: o.fr, tag: `d${i}` }))],
        explanation: { correct_why: `'${e.en}' se dit « ${e.fr} » en français.`, distractor_why: dWhy, grammar_rule: "Vocabulaire du programme PFL2 (Lexique).", vocab_notes: `Lexique OF${of} (${LEXIQUE}).`, common_mistakes: [`confondre « ${e.fr} » avec un synonyme proche`] },
        tip: { memory_aid: `'${e.en}' → « ${frBare(e.fr)} ».`, pattern: "Vocabulaire enseigné dans cet objectif.", similar: sample(r, taughtVocab.filter((x) => x.fr !== e.fr), 2).map((x) => x.fr) },
        trace: vTrace(),
      });
      counts.vocab++;
    }
    // Matching (5 taught terms)
    if (taughtVocab.length >= 5) {
      const groups = Math.min(8, Math.floor(taughtVocab.length / 5));
      const seenKey = new Set<string>();
      let g = 0, guard = 0;
      while (g < groups && guard < 200) {
        guard++;
        const five = sample(r, taughtVocab, 5);
        const key = five.map((e) => e.fr).sort().join("|");
        if (seenKey.has(key)) continue;
        seenKey.add(key);
        items.push({
          id: newId("voc_match"), objectiveId: id, skill: "vocabulary", grammarConcepts: [], vocabDomains: obj.vocabDomains ?? [], theme: obj.themes?.[0] ?? "workplace",
          difficulty: "medium", type: "matching", status: "live", estTimeSec: 55, irtB: 0,
          prompt: { fr: "Associez chaque terme français à son sens anglais.", instructions_en: "Match each French term to its English meaning. (PFL2 source vocabulary)", left: five.map((e) => e.fr), right: five.map((e) => e.en) },
          answer: { type: "sequence", accepted: [five.map((e) => e.en).join(" ")], normalizer: "fr_accent_insensitive_trim_lower" },
          distractors: [],
          explanation: { correct_why: five.map((e) => `« ${e.fr} » = ${e.en}`).join("; ") + ".", distractor_why: {}, grammar_rule: "Vocabulaire du programme PFL2 (Lexique).", vocab_notes: `Lexique OF${of}.`, common_mistakes: ["confondre des termes proches"] },
          tip: { memory_aid: "Révisez le lexique de l'objectif.", pattern: "terme français ↔ sens anglais.", similar: five.slice(0, 2).map((e) => e.fr) },
          trace: vTrace(),
        });
        counts.vocab++; g++;
      }
    }
  }

  itemTotal += items.length;
  report[id] = { source: counts.source, vocab: counts.vocab, total: items.length };
  writeFileSync(
    join(ROOT, "content", "question-bank", "items", `${id}.json`),
    JSON.stringify({ schema: "items/v2", objectiveId: id, sourceFidelity: true, source: { sourceDocument: sourceDoc, lexique: LEXIQUE, counts }, items })
  );

  // ---- module (learning material; grammar notes describe the OF's taught concepts) ----
  const cons = booklet("consolidation", of);
  const self = booklet("selfEvaluation", of);
  const byBand = (b: string) => items.filter((it) => it.difficulty === b).length;
  const coverageNote = items.length === 0
    ? "No auto-extractable written questions in this objective's source materials (its activities are oral/listening/open-ended). Per the source-fidelity policy, no questions are generated here."
    : `${items.length} questions, all traceable to the PFL2 source (${counts.source} verbatim source activities + ${counts.vocab} from the OF${of} Lexique).`;

  const module = {
    schema: "module/v2", objectiveId: id, titleFr: obj.titleFr, titleEn: obj.titleEn, level: obj.level,
    estMinutes: 40, sourceFidelity: true, source: obj.source ?? null,
    stages: {
      learn: {
        conceptExplanation: {
          en: `${id} — ${obj.titleEn}. Source document ${sourceDoc}. Grammar taught: ${grammarConcepts.join(", ") || "(see source)"}. Vocabulary: the OF${of} section of the PFL2 Lexique. ${coverageNote}`,
          fr: `${obj.titleFr}. Document source ${sourceDoc}. Grammaire enseignée : ${grammarConcepts.join(", ") || "(voir source)"}. Vocabulaire : section OF${of} du Lexique PFL2.`,
        },
        vocabularyNote: "The taught vocabulary for this objective is the OF section of the PFL2 Lexique, shown in the 'Lexicon' panel below.",
        grammarNotes: { summary: `Grammar concepts taught in this objective (from the source document): ${grammarConcepts.join(", ")}.`, charts: [], points: [] },
        pronunciation: { points: [] },
        dialogues: [], exampleTexts: [],
      },
      practice: {
        sourceFidelity: true,
        coverage: coverageNote,
        exerciseSets: [
          ...(counts.source ? [{ title: "Activités du programme PFL2 (verbatim)", count: counts.source }] : []),
          ...(counts.vocab ? [{ title: "Vocabulaire du Lexique PFL2", count: counts.vocab }] : []),
        ],
        totalQuestions: items.length,
      },
      consolidation: {
        sourceBooklet: cons ? { kind: cons.kind, booklet: cons.booklet, ofRange: cons.ofRange, catalogue: cons.catalogue } : null,
        note: cons ? `Consolidation review (OF ${cons.ofRange[0]}–${cons.ofRange[1]}) draws only from the source-traceable banks of the objectives in this range.` : null,
        tasks: [],
      },
      selfTest: {
        sourceBooklet: self ? { kind: self.kind, booklet: self.booklet, ofRange: self.ofRange, catalogue: self.catalogue } : null,
        timedSeconds: Math.max(180, Math.min(items.length, 16) * 35),
        blueprint: { easy: Math.min(byBand("easy"), 8), medium: Math.min(byBand("medium"), 6), advanced: Math.min(byBand("advanced"), 4) },
        drawFrom: [id],
      },
      masteryCheck: { threshold: 0.8, concepts: grammarConcepts },
    },
  };
  writeFileSync(join(ROOT, "content", "modules", `${id}.json`), JSON.stringify(module, null, 2));
  modCount++;
}

const empty = Object.entries(report).filter(([, v]) => v.total === 0).map(([k]) => k);
const withQ = Object.entries(report).filter(([, v]) => v.total > 0);
console.log(`Generated ${modCount} modules, ${itemTotal} source-traceable items.`);
console.log(`OFs with questions: ${withQ.length}/40 · OFs with NO source questions: ${empty.length} (${empty.join(", ") || "none"})`);
console.log("Per-OF (source verbatim / vocab / total):");
for (const [k, v] of Object.entries(report)) console.log(`  ${k}: ${v.source} / ${v.vocab} / ${v.total}`);
