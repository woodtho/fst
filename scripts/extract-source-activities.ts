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
  // first-wins: multi-part activities repeat 1.,2.,… (e.g. Partie A then B). Keep Part A so
  // the prompt and its answer key stay aligned.
  while ((m = re.exec(line))) { const k = parseInt(m[1], 10); if (!(k in out)) out[k] = m[2].trim(); }
  return out;
}
// Parse a "choose a/b/c" item: split the stem from the labelled options (a.… b.… c.…).
function parseOptions(text: string): { stem: string; opts: Record<string, string> } {
  let aIdx = -1;
  // lookbehind on space/start avoids false matches inside accented words (e.g. the "a." in "ça.")
  const re = /(?<=\s|^)a\.\s*\S/g; let mm: RegExpExecArray | null;
  while ((mm = re.exec(text))) { if (/(?<=\s)b\.\s*\S/.test(text.slice(mm.index))) { aIdx = mm.index; break; } }
  if (aIdx < 0) return { stem: text, opts: {} };
  const stem = text.slice(0, aIdx).replace(/[–-]\s*[a-e](?=\s|$)/g, " ").replace(/_{2,}/g, "___").replace(/\s+/g, " ").trim();
  const opts: Record<string, string> = {};
  const ore = /([a-e])\.\s*(.+?)(?=\s+[a-e]\.|$)/g; let o: RegExpExecArray | null;
  while ((o = ore.exec(text.slice(aIdx)))) opts[o[1].toLowerCase()] = o[2].trim();
  return { stem, opts };
}
// Matching activities: a numbered left column + a single sequential lettered list (a. b. c. …).
function findListStart(text: string): number {
  const are = /(?<=\s|^)a\.\s*\S/g; let m: RegExpExecArray | null;
  while ((m = are.exec(text))) { const tail = text.slice(m.index); if (/(?<=\s)b\.\s*\S/.test(tail) && /(?<=\s)c\.\s*\S/.test(tail)) return m.index; }
  return -1;
}
function parseLettered(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  const lre = /(?<=\s|^)([a-z])\.\s*(.+?)(?=\s+[a-z]\.\s|$)/g; let r: RegExpExecArray | null;
  while ((r = lre.exec(text))) map[r[1].toLowerCase()] = r[2].trim().replace(/^[a-z]\.\s*/, "");
  return map;
}
// the instruction is the "ff …" line just before the activity's numbered block
const INSTR_KW = /(Complétez|Mettez|Conjuguez|Transformez|Écrivez|Remplacez|Choisissez|Placez|Reliez|Indiquez|Utilisez|Donnez|Interrogez|Posez|Récrivez|Refaites|Répondez|Niez|Rédigez|Formulez|Associez|Jumelez|Changez|Trouvez)/i;
function activityInstruction(lines: string[], act: number): string {
  const re = new RegExp(`ACTIVIT[ÉE]\\s+${act}\\b`);
  for (let i = 0; i < lines.length; i++) {
    if (!re.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(i + 16, lines.length); j++) {
      const t = lines[j].replace(/^(ff|XX|[A-D]\.)\s*/, "").trim();
      const m = t.match(new RegExp(`(${INSTR_KW.source}[^.?!]*[.?!])`, "i"));
      if (m) return m[1].trim();
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
  else if (has("interrog", "est-ce que", "inversion", "poser des questions")) concept = "question_formation";
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
const ENGLISH = /\b(the|what|is|are|this|these|your|you|how|please|name|with|office|pencil|stapler|supplies|aren't|it's|here|there|good|afternoon|morning|hello|thank|thanks|welcome|sorry|goodbye|yes|day|week|my)\b/i;
// answer must be a short word/phrase (skip full-sentence transforms, blanks, page noise, English)
const goodAnswer = (a: string) =>
  a.length >= 1 && a.length <= 24 && !/_{2,}/.test(a) && !/^\d+$/.test(a) && !ENGLISH.test(a) &&
  !/\s[A-ZÀ-ÖØ-Ý]/.test(a); // reject concatenated alternatives (e.g. "C'est Ce sont")
const cleanPrompt = (p: string) => (p.match(/___/g) || []).length === 1 && !ENGLISH.test(p);
// fraction of the prompt's content words that reappear in the answer (a genuine transform keeps most words)
function wordOverlap(prompt: string, answer: string): number {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, " ");
  const pw = [...new Set(norm(prompt).split(/\s+/).filter((w) => w.length > 2))];
  if (!pw.length) return 0;
  const a = norm(answer);
  return pw.filter((w) => a.includes(w)).length / pw.length;
}

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
    const sents = splitNumbered(block), keys = splitNumbered(key);
    const instruction = activityInstruction(lines, act);
    const { concept, tenseLabel } = inferConcept(instruction, obj?.grammarConcepts ?? []);
    const lib = library[concept] ?? {};
    const ruleFr = (lib.rules && lib.rules[0]) || lib.summaryFr || "Point de grammaire du programme PFL2.";
    const tip = lib.items?.[0]?.tip ?? { memory_aid: "Relisez la règle de l'objectif.", pattern: "Appliquez le point de grammaire de l'OF.", similar: [] };
    const sourceNote = `Exercice authentique du programme PFL2 (${obj?.source?.catalogue ?? id}, activité ${act}).`;
    const newItemId = (num: number | string) => `itm_${id.toLowerCase()}_src_a${act}_${num}`;

    const keyVals = Object.values(keys);
    const letterKey = keyVals.length >= 2 && keyVals.every((v) => /^[a-z]$/i.test(v.trim()));
    const embedded = /\sa\.\s*\S/.test(block) && /\sb\.\s*\S/.test(block);

    // ---- MATCHING (numbered left column + single lettered list, answer key = letters) ----
    const listStart = findListStart(block);
    if (letterKey && listStart > 0) {
      const leftItems = splitNumbered(block.slice(0, listStart));
      const rightMap = parseLettered(block.slice(listStart));
      const leftN = Object.keys(leftItems).length, rightN = Object.keys(rightMap).length;
      if (leftN >= 4 && rightN >= 5 && rightN >= leftN * 0.6) {
        const pairs: [string, string][] = [];
        for (const nStr of Object.keys(leftItems)) {
          const n = +nStr; const L = (keys[n] || "").toLowerCase(); const rv = rightMap[L];
          // strip stray answer markers bleeding into the left label (e.g. "the manager c. l'agent", "… b")
          const lv = leftItems[n].split(/\s+[a-z]\.\s/)[0].replace(/\s+[a-z]$/i, "").replace(/_{2,}/g, "").replace(/\s+/g, " ").trim();
          // short terms only — long sentence-matching wraps unreliably in the extracted text
          if (!rv || !lv || lv.length > 40 || rv.length > 40 || ENGLISH.test(rv) || /[a-zàâçéèêëîïôûù]\s+[A-ZÀ-Ý]/.test(lv)) continue;
          if (!/[A-Za-zÀ-ÿ]{2,}/.test(lv) || !/[A-Za-zÀ-ÿ]{2,}/.test(rv)) continue; // must contain real words, not just "2." / numbers
          pairs.push([lv, rv]);
        }
        let made = 0;
        for (let c = 0; c < pairs.length; c += 5) {
          const chunk = pairs.slice(c, c + 5);
          if (chunk.length < 3) break;
          const left = chunk.map((p) => p[0]), right = chunk.map((p) => p[1]);
          if (new Set(right).size !== right.length) continue; // ambiguous (duplicate options)
          items.push({
            id: newItemId(`m${made}`), objectiveId: id, skill: "vocabulary", grammarConcepts: [],
            vocabDomains: obj?.vocabDomains ?? [], theme: obj?.themes?.[0] ?? "workplace",
            difficulty: "medium", type: "matching", status: "live", estTimeSec: 55, irtB: 0,
            prompt: { fr: "Associez chaque élément à sa correspondance.", instructions_en: "Match each item to its correct pair. (verbatim PFL2 source exercise)", left, right },
            answer: { type: "sequence", accepted: [right.join(" ")], normalizer: "fr_accent_insensitive_trim_lower" },
            distractors: [],
            explanation: { correct_why: chunk.map((p) => `« ${p[0]} » → « ${p[1]} »`).join("; ") + ".", distractor_why: {}, grammar_rule: "Exercice d'association du programme PFL2.", vocab_notes: sourceNote, common_mistakes: ["confondre des correspondances proches"] },
            tip: { memory_aid: "Reliez chaque paire enseignée dans cet objectif.", pattern: "élément ↔ correspondance.", similar: chunk.slice(0, 2).map((p) => p[0]) },
            source: { verbatim: true, catalogue: obj?.source?.catalogue, activity: act, concept: "matching" },
          });
          made++;
        }
        if (made) continue;
      }
    }

    if (letterKey && embedded) {
      // ---- CHOOSE a/b/c multiple-choice ----
      for (const numStr of Object.keys(sents)) {
        const num = +numStr;
        const { stem, opts } = parseOptions(sents[num]);
        const strip = (v: string) => (v || "").replace(/^[a-e]\.\s*/, "").trim();
        const letter = (keys[num] || "").toLowerCase();
        const correct = strip(opts[letter]);
        const optList = Object.values(opts).map(strip).filter((v) => v && v.length <= 90 && !ENGLISH.test(v));
        if (!correct || ENGLISH.test(correct) || optList.length < 2 || stem.length < 6 || ENGLISH.test(stem)) continue;
        const others = optList.filter((v) => v !== correct).slice(0, 3);
        if (!others.length) continue;
        const dWhy: Record<string, string> = {};
        others.forEach((o, i) => { dWhy[`d${i}`] = `« ${o} » ne complète pas correctement cet énoncé.`; });
        items.push({
          id: newItemId(num), objectiveId: id, skill: "grammar", grammarConcepts: [concept],
          vocabDomains: obj?.vocabDomains ?? [], theme: obj?.themes?.[0] ?? "workplace",
          difficulty: "medium", type: "mcq_single", status: "live", estTimeSec: 30, irtB: 0.1,
          prompt: { fr: stem, instructions_en: "Choose the option that correctly completes it. (verbatim PFL2 source exercise)" },
          answer: { type: "choice", accepted: [correct], normalizer: "fr_accent_insensitive_trim_lower" },
          distractors: [{ value: correct, tag: "correct" }, ...others.map((o, i) => ({ value: o, tag: `d${i}` }))],
          explanation: { correct_why: `La bonne réponse est « ${correct} ». ${ruleFr}`, distractor_why: dWhy, grammar_rule: ruleFr, vocab_notes: sourceNote, common_mistakes: ["choisir une formule qui ne convient pas au contexte"] },
          tip, source: { verbatim: true, catalogue: obj?.source?.catalogue, activity: act, concept },
        });
      }
      continue;
    }

    // ---- FILL-IN-THE-BLANK ----
    const beforeFill = items.length;
    if ((block.match(/_{2,}/g) || []).length >= 2) {
      for (const numStr of Object.keys(sents)) {
        const num = +numStr;
        const sentence = sents[num];
        if (!/_{2,}/.test(sentence)) continue;
        const ans = keys[num];
        if (!ans || !goodAnswer(ans)) continue;
        const prompt = sentence.replace(/_{2,}/g, "___").replace(/\s+/g, " ").trim();
        if (prompt.length < 6 || !cleanPrompt(prompt)) continue;
        const accepted = ans.split(/\s*[,/]\s*/).map((x) => x.trim()).filter(goodAnswer);
        if (!accepted.length) continue;
        const inf = (sentence.match(/\(([a-zàâçéèêëîïôûùüÿœ' ]+?)\)/i) || [])[1] || null;
        const correct_why = inf
          ? `${tenseLabel || "Forme attendue"} : « ${inf.trim()} » donne « ${accepted[0]} » avec ce sujet.`
          : `La réponse attendue est « ${accepted[0]} ». ${ruleFr}`;
        items.push({
          id: newItemId(num), objectiveId: id, skill: "writing", grammarConcepts: [concept],
          vocabDomains: obj?.vocabDomains ?? [], theme: obj?.themes?.[0] ?? "workplace",
          difficulty: "medium", type: "fill_blank", status: "live", estTimeSec: 30, irtB: 0,
          prompt: { fr: prompt, instructions_en: "Complete the blank (verbatim PFL2 source exercise)." },
          answer: { type: "text", accepted: Array.from(new Set(accepted)), normalizer: "fr_accent_insensitive_trim_lower" },
          distractors: [],
          explanation: { correct_why, distractor_why: {}, grammar_rule: ruleFr, vocab_notes: sourceNote, common_mistakes: ["se tromper de forme selon le contexte"] },
          tip, source: { verbatim: true, catalogue: obj?.source?.catalogue, activity: act, concept },
        });
      }
    }
    if (items.length > beforeFill) continue;

    // ---- TRANSFORM (answer key is full sentences; rewrite the source sentence) ----
    const sentenceKey = keyVals.length >= 3 &&
      keyVals.filter((v) => v.length >= 12 && /\s/.test(v) && !/^[a-z]$/i.test(v.trim())).length >= keyVals.length * 0.6;
    if (sentenceKey) {
      for (const numStr of Object.keys(sents)) {
        const num = +numStr;
        // skip mid-sentence fills (real words after the blank) — those aren't whole-sentence transforms
        const tail = sents[num].split(/_{2,}/).slice(1).join(" ").replace(/_/g, " ").trim();
        if (/[A-Za-zÀ-ÿ]{3,}/.test(tail)) continue;
        let orig = sents[num].split(/_{2,}/)[0].replace(/\s+/g, " ").trim();
        const fm = orig.match(/^[^?.!]*[?.!]/); if (fm) orig = fm[0].trim();          // first sentence only
        const forms = (keys[num] || "").split(/(?<=[?.!])\s+/).map((s) => s.replace(/^[a-z]\.\s*/, "").trim());
        const accepted = forms.filter((a) => a.length >= 8 && a.length <= 70 && !ENGLISH.test(a) && /[A-Za-zÀ-ÿ]{3,}/.test(a) && !/:/.test(a) && !/^partie\b/i.test(a) && !/^[A-D]\.\s/.test(a));
        if (!orig || orig.length < 8 || orig.length > 80 || ENGLISH.test(orig) || !accepted.length) continue;
        if (!/^[A-ZÀ-Ý«]/.test(orig) || !/[?.!»]$/.test(orig)) continue;               // complete sentence (proper start + end)
        if (/:/.test(orig) || /,\s*,/.test(orig)) continue;                            // categorization labels / empty-blank artifacts
        if (/[a-zàâçéèêëîïôûù]\s+[A-ZÀ-Ý]/.test(orig.replace(/^[A-ZÀ-Ý]/, "x"))) continue; // looks like merged sentences
        const nrm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
        if (nrm(orig) === nrm(accepted[0])) continue;                                  // prompt == answer (no real transform)
        if (wordOverlap(orig, accepted[0]) < 0.6) continue;                            // answer must be a transform of the prompt
        items.push({
          id: newItemId(num), objectiveId: id, skill: "writing", grammarConcepts: [concept],
          vocabDomains: obj?.vocabDomains ?? [], theme: obj?.themes?.[0] ?? "workplace",
          difficulty: "advanced", type: "fill_blank", status: "live", estTimeSec: 45, irtB: 0.5,
          prompt: { fr: orig, instructions_en: `Rewrite the sentence as the exercise requires. (verbatim PFL2 source exercise${instruction ? " — " + instruction.slice(0, 90) : ""})` },
          answer: { type: "text", accepted: Array.from(new Set(accepted)), normalizer: "fr_accent_insensitive_trim_lower" },
          distractors: [],
          explanation: { correct_why: `Transformation attendue : « ${accepted[0]} »${accepted[1] ? ` (ou « ${accepted[1]} »)` : ""}. ${ruleFr}`, distractor_why: {}, grammar_rule: ruleFr, vocab_notes: sourceNote, common_mistakes: ["ne pas appliquer correctement la transformation demandée"] },
          tip, source: { verbatim: true, catalogue: obj?.source?.catalogue, activity: act, concept },
        });
      }
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
