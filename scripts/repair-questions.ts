/**
 * repair-questions.ts
 * Fixes two question-quality defects in the per-OF item banks (content/question-bank/items):
 *   1. "a/b" MCQs where the real options are embedded in prompt.fr ("Phrase A. / Phrase B.")
 *      but the choices render as bare letters → rebuilt into a proper MCQ with the real text.
 *   2. MCQs whose options are ONLY bare letters with no recoverable text (comprehension items
 *      whose choices were never captured) → removed (unanswerable as shown).
 *   3. Cosmetic: strips grammatical-category annotations ((adj. m.), (n. f.), (tél.), …) from
 *      the DISPLAYED French term of vocabulary prompts; the English answer is untouched.
 *
 * Run: node --experimental-strip-types scripts/repair-questions.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const isLetters = (ds: any[]) => ds && ds.length >= 2 && ds.every((d) => /^[a-e]$/.test(d.value));

// French stem for the rebuilt MCQs, by the English instruction
function stemFor(instr: string): string {
  const i = (instr || "").toLowerCase();
  if (i.includes("intention")) return "Quelle phrase exprime l’intention le plus fortement?";
  if (i.includes("differs")) return "Quelle expression a un sens différent des deux autres?";
  if (i.includes("polite") || i.includes("formal")) return "Quelle formule est la plus polie?";
  return "Choisissez la bonne réponse.";
}

// category annotations safe to drop from the displayed term (NOT semantic ones like (conditionnel))
const CATEGORY = /\s*\((?:adj\.?(?:\s*[mf]\.?)?|n\.?(?:\s*[mf]\.?)?|v\.?|adv\.?|prép\.?|loc\.?(?:\s*\w+\.?)?|tél\.?|pl\.?|fam\.?|sing\.?|art\.?|pron\.?)\)\s*/gi;

let fixed = 0, removed = 0, cleaned = 0;
const report: Record<string, { fixed: number; removed: number; cleaned: number }> = {};

for (let of = 1; of <= 40; of++) {
  const path = join(ROOT, "content", "question-bank", "items", `OF${of}.json`);
  const bank = JSON.parse(readFileSync(path, "utf8"));
  let f = 0, r = 0, c = 0, e = 0;
  const out: any[] = [];

  for (const it of bank.items) {
    // (0) strip leftover bare-letter answer references from any explanation
    if (it.explanation?.correct_why) {
      const cw = it.explanation.correct_why.replace(/La (?:bonne réponse|réponse correcte) est « [a-e] »\.\s*/gi, "").trim();
      if (cw !== it.explanation.correct_why) { it.explanation.correct_why = cw; e++; }
    }
    // (3) clean vocabulary prompt annotations
    if (it.skill === "vocabulary" && it.prompt?.fr && CATEGORY.test(it.prompt.fr)) {
      const before = it.prompt.fr;
      it.prompt.fr = it.prompt.fr.replace(CATEGORY, " ").replace(/«\s+/g, "« ").replace(/\s+»/g, " »").replace(/\s{2,}/g, " ").trim();
      if (it.prompt.fr !== before) c++;
    }

    if (it.type === "mcq_single" && isLetters(it.distractors)) {
      const parts = String(it.prompt.fr || "").split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
      const realText = parts.length === it.distractors.length && parts.every((p) => p.length > 2 && /[a-zà-ÿ]/i.test(p));
      if (realText) {
        // (1) rebuild into a proper MCQ
        const correctIdx = Math.max(0, it.distractors.findIndex((d: any) => d.tag === "correct"));
        const correct = parts[correctIdx];
        const dWhy: Record<string, string> = {};
        const newDistractors = parts.map((p, i) => {
          if (i === correctIdx) return { value: p, tag: "correct" };
          const tag = `d${i}`;
          dWhy[tag] = `« ${p} » n’est pas la réponse attendue ici.`;
          return { value: p, tag };
        });
        it.prompt = { fr: stemFor(it.prompt.instructions_en), instructions_en: it.prompt.instructions_en };
        it.answer = { type: "choice", accepted: [correct], normalizer: it.answer?.normalizer ?? "fr_accent_insensitive_trim_lower" };
        it.distractors = newDistractors;
        it.explanation = {
          correct_why: `La bonne réponse est « ${correct} ». ${it.explanation?.correct_why?.replace(/^La bonne réponse est « [a-e] »\.\s*/, "") ?? ""}`.trim(),
          distractor_why: dWhy,
          grammar_rule: it.explanation?.grammar_rule ?? "Exercice du programme PFL2.",
          vocab_notes: it.explanation?.vocab_notes ?? "",
          common_mistakes: it.explanation?.common_mistakes ?? ["choisir une formulation au sens différent"],
        };
        if (it.tip) it.tip.similar = parts.slice(0, 2);
        f++; out.push(it); continue;
      } else {
        // (2) unrecoverable bare-letter MCQ → drop
        r++; continue;
      }
    }
    out.push(it);
  }

  if (f || r || c || e) {
    bank.items = out;
    // refresh header counts if present
    if (bank.source?.counts) {
      bank.source.counts.source = out.filter((i) => i.source).length;
      bank.source.counts.vocab = out.filter((i) => i.skill === "vocabulary").length;
    }
    writeFileSync(path, JSON.stringify(bank));
    report[`OF${of}`] = { fixed: f, removed: r, cleaned: c };
    fixed += f; removed += r; cleaned += c;
  }
}

console.log(`Repaired item banks. Rebuilt MCQs: ${fixed} · removed unanswerable: ${removed} · vocab prompts cleaned: ${cleaned}`);
console.log(JSON.stringify(report, null, 1));
