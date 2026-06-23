/**
 * extract-source-activities.ts
 * Extracts the VERBATIM written fill-in-the-blank activities (with their published answer
 * keys / CORRIGÉ) from the PFL2 source OF documents into gradable fill_blank items.
 *
 * For each OF it scans for every "CORRIGÉ – ACT n", matches the activity's numbered
 * sentences (blank = ___), keeps only items whose answer is a short word/phrase, infers the
 * grammar concept from the activity instruction (falling back to the OF's primary concept),
 * and builds a full explanation contract using the concept library's rule/tip.
 *
 * Items are tagged source.verbatim=true. Output: content/question-bank/source/OFn.json
 * (merged into the bank by build-modules.ts).
 *
 * Run:  node --experimental-strip-types scripts/extract-source-activities.ts
 *       node --experimental-strip-types scripts/extract-source-activities.ts survey
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "content", "question-bank", "source");
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const curriculum = JSON.parse(readFileSync(join(ROOT, "content", "curriculum.json"), "utf8"));
const library = JSON.parse(readFileSync(join(ROOT, "content", "_concepts", "library.json"), "utf8")).concepts;

// ---- block parsing --------------------------------------------------------
const isFooter = (l: string) =>
  /École de la fonction publique/i.test(l) || /^\s*\d+\s*$/.test(l) || /^\s*Objectif de formation\s+\d+\s*:/.test(l);
const SEARCH_STOP = /ACTIVIT[ÉE]\s+\d|CORRIG[ÉE]\s*[–-]\s*ACT|TRANSCRIPTION/;
const COLLECT_STOP = /ACTIVIT[ÉE]\s+\d|CORRIG[ÉE]\s*[–-]\s*ACT|TRANSCRIPTION|^\s*\d+\.\d+\s*[–-]/;
const numbered = (l: string) => /(^|\s)1\.\s+\S/.test(l);

function collectBlock(lines: string[], headerRe: RegExp): string | null {
  for (let i = 0; i < lines.length; i++) {
    if (!headerRe.test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !numbered(lines[j]) && !SEARCH_STOP.test(lines[j])) j++;
    if (j >= lines.length || SEARCH_STOP.test(lines[j])) continue;
    const buf: string[] = [];
    for (let k = j; k < lines.length; k++) {
      if (COLLECT_STOP.test(lines[k])) break;
      if (isFooter(lines[k]) || lines[k].trim() === "") continue;
      buf.push(lines[k].trim());
      if (buf.join(" ").length > 3000) break;
    }
    return buf.join(" ");
  }
  return null;
}
const activityBlock = (lines: string[], act: number) => collectBlock(lines, new RegExp(`ACTIVIT[ÉE]\\s+${act}\\b`));
const corrigeBlock = (lines: string[], act: number) => collectBlock(lines, new RegExp(`CORRIG[ÉE]\\s*[–-]\\s*ACT\\s+${act}\\b`));

function splitNumbered(line: string): Record<number, string> {
  const out: Record<number, string> = {};
  const re = /(\d{1,2})\.\s+(.+?)(?=\s+\d{1,2}\.\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out[parseInt(m[1], 10)] = m[2].trim();
  return out;
}
// the instruction is the "ff …" line just before the activity's numbered block
function activityInstruction(lines: string[], act: number): string {
  const re = new RegExp(`ACTIVIT[ÉE]\\s+${act}\\b`);
  for (let i = 0; i < lines.length; i++) {
    if (!re.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
      const t = lines[j].replace(/^(ff|XX)\s*/, "").trim();
      if (/^(Complétez|Mettez|Conjuguez|Transformez|Écrivez|Remplacez|Choisissez|Placez|Reliez|Indiquez|Utilisez|Donnez)/i.test(t)) return t;
    }
  }
  return "";
}

// ---- grammar-concept inference from the activity instruction ---------------
function inferConcept(instruction: string, ofConcepts: string[]): { concept: string; tenseLabel: string } {
  const s = instruction.toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => s.includes(w));
  let concept = ofConcepts[0] ?? "present";
  if (has("passé composé")) concept = "passe_compose";
  else if (has("imparfait")) concept = "imparfait";
  else if (has("plus-que-parfait", "futur antérieur")) concept = "compound_tenses";
  else if (has("futur")) concept = "futur_simple";
  else if (has("conditionnel")) concept = "conditionnel";
  else if (has("subjonctif")) concept = "subjonctif";
  else if (has("impératif")) concept = "imperative";
  else if (has("gérondif", "adverbe")) concept = "adverbs_manner";
  else if (has("pronominal", "pronominaux")) concept = "pronominal_verbs";
  else if (has("être", "verbe", "présent", "conjug")) concept = "present";
  else if (has("pronom relatif")) concept = "pronouns";
  else if (has("pronom")) concept = "pronouns";
  else if (has("article")) concept = "articles";
  else if (has("possessif")) concept = "possessives";
  else if (has("démonstratif", "nombre", "ordinal", "cardinal")) concept = "numbers";
  else if (has("adjectif")) concept = "adjectives";
  else if (has("préposition", "à, de", "contract")) concept = "prepositions";
  else if (has("négati")) concept = "negation";
  else if (has("comparatif", "superlatif")) concept = "comparatives";
  else if (has("quantité", "beaucoup", "peu de")) concept = "quantity";
  if (!library[concept]) concept = ofConcepts[0] ?? "present";
  const tenseLabel: Record<string, string> = {
    present: "Au présent", passe_compose: "Au passé composé", imparfait: "À l'imparfait",
    futur_simple: "Au futur", conditionnel: "Au conditionnel", subjonctif: "Au subjonctif",
    compound_tenses: "Au temps composé", imperative: "À l'impératif",
  };
  return { concept, tenseLabel: tenseLabel[concept] ?? "" };
}

// English text bleeds in from the bilingual source layout — reject it.
const ENGLISH = /\b(the|what|is|are|this|these|your|you|how|please|name|with|office|pencil|stapler|supplies|aren't|it's|here|there)\b/i;
// answer must be a short word/phrase (skip full-sentence transforms, blanks, page noise, English)
const goodAnswer = (a: string) =>
  a.length >= 1 && a.length <= 24 && !/_{2,}/.test(a) && !/^\d+$/.test(a) && !ENGLISH.test(a) &&
  !/\s[A-ZÀ-ÖØ-Ý]/.test(a); // reject concatenated alternatives (e.g. "C'est Ce sont")
const cleanPrompt = (p: string) => (p.match(/___/g) || []).length === 1 && !ENGLISH.test(p);

// ---- survey mode ----------------------------------------------------------
if (process.argv.includes("survey")) {
  for (let of = 1; of <= 40; of++) {
    const lines = readFileSync(join(ROOT, "sources", "text", `OF${String(of).padStart(2, "0")}.txt`), "utf8").split(/\r?\n/);
    const acts = new Set<number>();
    for (const l of lines) { const m = l.match(/CORRIG[ÉE]\s*[–-]\s*ACT\s+(\d{1,2})/); if (m) acts.add(+m[1]); }
    const fill: string[] = [];
    for (const a of [...acts].sort((x, y) => x - y)) {
      const block = activityBlock(lines, a), key = corrigeBlock(lines, a);
      if (!block || !key) continue;
      const blanks = (block.match(/_{2,}/g) || []).length;
      if (blanks >= 2 && Object.keys(splitNumbered(key)).length >= 2) fill.push(`act${a}(${blanks})`);
    }
    console.log(`OF${of}: ${fill.length ? fill.join(" ") : "—"}`);
  }
  process.exit(0);
}

// ---- extraction -----------------------------------------------------------
let grandTotal = 0;
const perOf: Record<string, number> = {};
for (let of = 1; of <= 40; of++) {
  const id = `OF${of}`;
  const obj = curriculum.objectives.find((o: any) => o.id === id);
  const lines = readFileSync(join(ROOT, "sources", "text", `OF${String(of).padStart(2, "0")}.txt`), "utf8").split(/\r?\n/);
  const acts = new Set<number>();
  for (const l of lines) { const m = l.match(/CORRIG[ÉE]\s*[–-]\s*ACT\s+(\d{1,2})/); if (m) acts.add(+m[1]); }

  const items: any[] = [];
  for (const act of [...acts].sort((x, y) => x - y)) {
    const block = activityBlock(lines, act), key = corrigeBlock(lines, act);
    if (!block || !key) continue;
    if ((block.match(/_{2,}/g) || []).length < 2) continue; // not a fill-blank activity
    const sents = splitNumbered(block), keys = splitNumbered(key);
    const instruction = activityInstruction(lines, act);
    const { concept, tenseLabel } = inferConcept(instruction, obj?.grammarConcepts ?? []);
    const lib = library[concept] ?? {};
    const ruleFr = (lib.rules && lib.rules[0]) || lib.summaryFr || "Point de grammaire du programme PFL2.";

    for (const numStr of Object.keys(sents)) {
      const num = +numStr;
      const sentence = sents[num];
      if (!/_{2,}/.test(sentence)) continue;
      const ans = keys[num];
      if (!ans || !goodAnswer(ans)) continue;
      const prompt = sentence.replace(/_{2,}/g, "___").replace(/\s+/g, " ").trim();
      if (prompt.length < 6 || !cleanPrompt(prompt)) continue;        // single blank, no English
      const accepted = ans.split(/\s*[,/]\s*/).map((x) => x.trim()).filter(goodAnswer);
      if (!accepted.length) continue;
      const inf = (sentence.match(/\(([a-zàâçéèêëîïôûùüÿœ' ]+?)\)/i) || [])[1] || null;
      const correct_why = inf
        ? `${tenseLabel || "Forme attendue"} : « ${inf.trim()} » donne « ${accepted[0]} » avec ce sujet.`
        : `La réponse attendue est « ${accepted[0]} ». ${ruleFr}`;

      items.push({
        id: `itm_${id.toLowerCase()}_src_a${act}_${num}`,
        objectiveId: id, skill: "writing", grammarConcepts: [concept],
        vocabDomains: obj?.vocabDomains ?? [], theme: obj?.themes?.[0] ?? "workplace",
        difficulty: "medium", type: "fill_blank", status: "live", estTimeSec: 30, irtB: 0,
        prompt: { fr: prompt, instructions_en: "Complete the blank (verbatim PFL2 source exercise)." },
        answer: { type: "text", accepted: Array.from(new Set(accepted)), normalizer: "fr_accent_insensitive_trim_lower" },
        distractors: [],
        explanation: {
          correct_why, distractor_why: {}, grammar_rule: ruleFr,
          vocab_notes: `Exercice authentique du programme PFL2 (${obj?.source?.catalogue ?? id}, activité ${act}).`,
          common_mistakes: ["se tromper de forme selon le contexte"],
        },
        tip: lib.items?.[0]?.tip ?? { memory_aid: "Relisez la règle de l'objectif.", pattern: "Appliquez le point de grammaire de l'OF.", similar: [] },
        source: { verbatim: true, catalogue: obj?.source?.catalogue, activity: act, concept },
      });
    }
  }

  if (items.length) {
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ schema: "source-items/v1", objectiveId: id, note: "Verbatim fill-in-the-blank activities + answer keys extracted from the PFL2 source document.", items }, null, 2));
    perOf[id] = items.length;
    grandTotal += items.length;
  }
}
console.log("Per-OF verbatim source items:", JSON.stringify(perOf));
console.log(`Extracted ${grandTotal} verbatim source items across ${Object.keys(perOf).length} OFs.`);
