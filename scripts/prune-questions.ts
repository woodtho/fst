/**
 * prune-questions.ts
 * Removes objectively un-useful source-extracted items from the question banks so the self-test
 * and consolidation only draw answerable, on-concept questions. It targets degenerate extractions,
 * never the hand-authored `generated: true` items. Categories removed:
 *
 *   1. Discrimination shells — MCQs whose entire option set is {oui/non}, {vrai/faux},
 *      {same/different M/D}, or bare letters {a..e}. These came from listening activities and are
 *      unanswerable as self-contained text questions (the sentence/audio they judge isn't present).
 *   2. Duplicate-option MCQs — a 4-choice question with a repeated distractor (really 3 options).
 *   3. Instruction/leftover prompts — prompts that are activity rubric, page references, or a bare
 *      "A./B." stem with no real sentence.
 *
 * Dry run (report only):  node --experimental-strip-types scripts/prune-questions.ts
 * Apply the removals:     node --experimental-strip-types scripts/prune-questions.ts --apply
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const norm = (v: unknown) => String(v).toLowerCase().trim();

const DISCRIMINATION = /^(oui|non|vrai|faux|m|d|s|[a-e])$/;

function reason(it: any): string | null {
  if (it.generated) return null;
  const fr: string = it.prompt?.fr ?? "";
  const opts: string[] = Array.isArray(it.distractors) ? it.distractors.map((d: any) => norm(d.value)) : [];

  if (opts.length) {
    // 1. discrimination shell (all options are yes/no/true/false/same-different/bare letters)
    if (opts.every((v) => DISCRIMINATION.test(v))) return "discrimination-shell";
    // 2. duplicate options
    if (new Set(opts).size !== opts.length) return "duplicate-options";
  }
  // 3. instruction / leftover / page-reference prompt (NB: short English-cue vocab prompts like
  //    "pen → un stylo" are legitimate and intentionally NOT pruned).
  if (/\b(Activité|Partie [AB]|Consultez votre|voir l[’']activité)\b/.test(fr)) return "instruction-leftover";
  if (/\bp\.\s?\d|page \d/i.test(fr)) return "page-reference";
  return null;
}

const summary: Record<string, number> = {};
const perOf: Record<string, number> = {};
let totalBefore = 0, removed = 0;

for (let of = 1; of <= 40; of++) {
  const p = join(ROOT, "content", "question-bank", "items", `OF${of}.json`);
  let bank: any;
  try { bank = JSON.parse(readFileSync(p, "utf8")); } catch { continue; }
  const before = bank.items.length;
  totalBefore += before;
  const kept = bank.items.filter((it: any) => {
    const r = reason(it);
    if (r) { summary[r] = (summary[r] ?? 0) + 1; perOf[`OF${of}`] = (perOf[`OF${of}`] ?? 0) + 1; removed++; return false; }
    return true;
  });
  if (APPLY && kept.length !== before) {
    bank.items = kept;
    if (bank.source?.counts) bank.source.counts.total = kept.length;
    writeFileSync(p, JSON.stringify(bank));
  }
}

console.log(`${APPLY ? "REMOVED" : "WOULD REMOVE"} ${removed} of ${totalBefore} items.`);
console.log("By reason:", JSON.stringify(summary, null, 0));
console.log("Most affected OFs:", JSON.stringify(
  Object.entries(perOf).sort((a, b) => b[1] - a[1]).slice(0, 12).reduce((o, [k, v]) => (o[k] = v, o), {} as Record<string, number>)
));
if (!APPLY) console.log("\n(dry run — re-run with --apply to remove)");
