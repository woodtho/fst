/**
 * build-modules.ts
 * Generates content/modules/OFn.json + content/question-bank/items/OFn.json for every
 * objective EXCEPT the hand-authored ones (OF1, OF13), by mapping each OF's grammar
 * concepts (derived from the PFL2 source documents) onto the hand-authored concept library.
 *
 * - Module Learn: concept blurb + grammar notes assembled from the library; the full PFL2
 *   source vocabulary is rendered automatically by the app from content/lexicon/by-of/.
 * - Question bank: each concept contributes its item pool (rotated per OF for variety),
 *   each item already carrying the full explanation contract.
 * - Consolidation / Self-test: linked to the real source booklets via sources/manifest.json.
 *
 * Deterministic: re-running overwrites with identical output.
 * Run: node --experimental-strip-types scripts/build-modules.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const curriculum = read("content/curriculum.json");
const library = read("content/_concepts/library.json").concepts as Record<string, any>;
const manifest = read("sources/manifest.json");

const SKIP = new Set(["OF1", "OF13"]); // hand-authored in full depth

function booklet(kind: "consolidation" | "selfEvaluation", of: number) {
  const list = manifest.supplements?.[kind] ?? [];
  return list.find((b: any) => of >= b.ofRange[0] && of <= b.ofRange[1]) ?? null;
}

function rotate<T>(arr: T[], by: number): T[] {
  const n = arr.length;
  if (n === 0) return arr;
  const k = ((by % n) + n) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

let modCount = 0;
let itemCount = 0;

for (const obj of curriculum.objectives) {
  if (SKIP.has(obj.id)) continue;

  const concepts: string[] = (obj.grammarConcepts ?? []).filter((c: string) => library[c]);
  if (concepts.length === 0) continue;

  const ofLower = obj.id.toLowerCase();
  const theme = obj.themes?.[0] ?? "workplace";
  const vocabDomains = obj.vocabDomains ?? [];

  // ---- assemble items (rotated per OF for variety across OFs sharing a concept) ----
  const items: any[] = [];
  const setsByConcept: Record<string, string[]> = {};
  let n = 1;
  for (const concept of concepts) {
    const pool = rotate(library[concept].items, obj.of);
    setsByConcept[concept] = [];
    for (const tpl of pool) {
      const id = `itm_${ofLower}_${concept}_${n++}`;
      setsByConcept[concept].push(id);
      items.push({
        id,
        objectiveId: obj.id,
        skill: tpl.skill,
        grammarConcepts: [concept],
        vocabDomains,
        theme,
        difficulty: tpl.difficulty,
        type: tpl.type,
        status: "live",
        estTimeSec: tpl.estTimeSec ?? 35,
        irtB: tpl.irtB ?? 0,
        prompt: tpl.prompt,
        answer: tpl.answer,
        distractors: tpl.distractors ?? [],
        explanation: tpl.explanation,
        tip: tpl.tip,
      });
    }
  }
  itemCount += items.length;

  writeFileSync(
    join(ROOT, "content", "question-bank", "items", `${obj.id}.json`),
    JSON.stringify({ schema: "items/v1", objectiveId: obj.id, source: { catalogue: obj.source?.catalogue, generated: true, note: "Generated from the concept library mapped to this OF's source-derived grammar scope. Full explanation contract on every item." }, items }, null, 2)
  );

  // ---- module ----
  const conceptNamesEn = concepts.map((c) => library[c].nameEn).join(", ");
  const conceptNamesFr = concepts.map((c) => library[c].nameFr).join(", ");
  const fn = obj.titleEn.replace(/^To\s+/, "").trim();

  const points: string[] = [];
  for (const c of concepts) {
    points.push(`${library[c].nameFr} (${library[c].nameEn}) — ${library[c].summaryFr}`);
    for (const r of library[c].rules ?? []) points.push(`· ${r}`);
  }

  const cons = booklet("consolidation", obj.of);
  const self = booklet("selfEvaluation", obj.of);

  const byBand = (b: string) => items.filter((it) => it.difficulty === b).length;

  const module = {
    schema: "module/v1",
    objectiveId: obj.id,
    titleFr: obj.titleFr,
    titleEn: obj.titleEn,
    level: obj.level,
    estMinutes: 40,
    generated: true,
    source: obj.source ?? null,
    stages: {
      learn: {
        conceptExplanation: {
          en: `${obj.id} — ${obj.titleEn}. This objective develops the language needed to ${fn[0].toLowerCase() + fn.slice(1)} in a Government of Canada workplace. Grammar focus: ${conceptNamesEn}. Study the PFL2 source vocabulary (panel below), review the grammar notes, then practise and consolidate with workplace tasks.`,
          fr: `${obj.titleFr}. Objectif communicatif appuyé par : ${conceptNamesFr}. Étudiez le lexique source (ci-dessous), révisez les points de grammaire, puis pratiquez et consolidez.`,
        },
        vocabularyNote: "The full PFL2 source vocabulary for this objective is shown in the 'Lexicon — PFL2 source vocabulary' panel below (from SC102-2/1-2-2005F).",
        grammarNotes: {
          summary: `Grammar focus for this objective: ${conceptNamesEn}.`,
          charts: [],
          points,
        },
        pronunciation: {
          points: [
            "Listen to and repeat the source vocabulary aloud; French final consonants are often silent and vowels are pure.",
            "Liaison links a final consonant to a following vowel (e.g. vous‿êtes, nous‿avons).",
          ],
        },
        dialogues: [],
        exampleTexts: [],
      },
      practice: {
        exerciseSets: concepts.map((c) => ({
          title: `${library[c].nameFr}`,
          itemRefs: setsByConcept[c],
          type: "mixed",
        })),
      },
      consolidation: {
        sourceBooklet: cons ? { kind: cons.kind, booklet: cons.booklet, ofRange: cons.ofRange, catalogue: cons.catalogue } : null,
        tasks: [
          {
            title: `Tâche de consolidation — ${obj.titleFr}`,
            type: "scenario",
            promptFr: `Dans un contexte de travail, mettez en pratique la fonction « ${obj.titleFr.toLowerCase()} ». Rédigez ou jouez un court échange (3 à 4 phrases) en employant : ${conceptNamesFr}.`,
            promptEn: `In a workplace context, practise the function "${obj.titleEn}". Produce a short exchange (3–4 sentences) using: ${conceptNamesEn}.`,
            rubric: ["addresses the communicative function", "uses the target grammar correctly", "workplace register (vous)"],
          },
        ],
      },
      selfTest: {
        sourceBooklet: self ? { kind: self.kind, booklet: self.booklet, ofRange: self.ofRange, catalogue: self.catalogue } : null,
        timedSeconds: Math.max(180, items.length * 35),
        blueprint: { easy: byBand("easy"), medium: byBand("medium"), advanced: byBand("advanced") },
        drawFrom: [obj.id],
      },
      masteryCheck: { threshold: 0.8, concepts },
    },
  };

  writeFileSync(join(ROOT, "content", "modules", `${obj.id}.json`), JSON.stringify(module, null, 2));
  modCount++;
}

console.log(`Generated ${modCount} modules and ${itemCount} items (OF2–OF40, excluding hand-authored OF1/OF13).`);
