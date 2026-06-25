/**
 * build-assessments.ts
 * Rebuilds the self-test and consolidation stages of every module from the LIVE item banks, so
 * both assessments actually use the current content (including the authored `generated: true`
 * questions).
 *
 *  - selfTest.blueprint: sized to each OF's real easy/medium/advanced distribution, targeting a
 *    ~16-question exam (or the whole bank if smaller). Shortfalls in one band are redistributed
 *    to bands that have a surplus, so generated-heavy OFs still get a full-length, varied exam.
 *  - selfTest.timedSeconds: ~35 s per drawn question.
 *  - consolidation: source booklet (from sources/manifest.json) + a coverage roll-up of the
 *    objectives and item counts that feed the range review.
 *
 * Idempotent. Run: node --experimental-strip-types scripts/build-assessments.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const curriculum = JSON.parse(readFileSync(join(ROOT, "content", "curriculum.json"), "utf8"));
const manifestPath = join(ROOT, "sources", "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { supplements: {} };
const consolidationBooklets: any[] = manifest.supplements?.consolidation ?? [];
const selfEvalBooklets: any[] = manifest.supplements?.selfEvaluation ?? [];

const EXAM_TARGET = 16;
const SHARE = { easy: 0.4, medium: 0.35, advanced: 0.25 };

function bankFor(of: number): any[] {
  const p = join(ROOT, "content", "question-bank", "items", `OF${of}.json`);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, "utf8")).items ?? [];
}

/** Choose how many to draw from each band to fill a target-size, varied exam. */
function blueprintFor(items: any[]) {
  const avail = { easy: 0, medium: 0, advanced: 0 } as Record<string, number>;
  for (const it of items) if (it.difficulty in avail) avail[it.difficulty]++;
  const total = items.length;
  const target = Math.min(EXAM_TARGET, total);

  const want: Record<string, number> = {
    easy: Math.min(avail.easy, Math.round(target * SHARE.easy)),
    medium: Math.min(avail.medium, Math.round(target * SHARE.medium)),
    advanced: Math.min(avail.advanced, Math.round(target * SHARE.advanced)),
  };
  // Redistribute any shortfall to bands that still have spare items.
  let short = target - (want.easy + want.medium + want.advanced);
  const order = ["medium", "easy", "advanced"]; // prefer topping up with grammar, then recognition
  while (short > 0) {
    const band = order.find((b) => want[b] < avail[b]);
    if (!band) break;
    want[band]++;
    short--;
  }
  return { blueprint: want, drawn: want.easy + want.medium + want.advanced, avail };
}

let touched = 0;
for (const o of curriculum.objectives) {
  const of = o.of;
  const modPath = join(ROOT, "content", "modules", `OF${of}.json`);
  if (!existsSync(modPath)) continue;
  const mod = JSON.parse(readFileSync(modPath, "utf8"));
  const items = bankFor(of);
  if (items.length === 0) continue;

  // ---- self-test ----
  const { blueprint, drawn } = blueprintFor(items);
  const selfEval = selfEvalBooklets.find((b) => of >= b.ofRange[0] && of <= b.ofRange[1]);
  mod.stages = mod.stages ?? {};
  mod.stages.selfTest = {
    ...(mod.stages.selfTest ?? {}),
    sourceBooklet: selfEval
      ? { kind: "self_eval", booklet: selfEval.booklet, ofRange: selfEval.ofRange, catalogue: selfEval.catalogue }
      : mod.stages.selfTest?.sourceBooklet,
    timedSeconds: Math.max(180, drawn * 35),
    blueprint,
    examQuestions: drawn,
    bankSize: items.length,
  };

  // ---- consolidation ----
  const cons = consolidationBooklets.find((b) => of >= b.ofRange[0] && of <= b.ofRange[1]);
  if (cons) {
    const [from, to] = cons.ofRange;
    const rangeOFs = curriculum.objectives.filter((x: any) => x.of >= from && x.of <= to);
    const rangeItems = rangeOFs.reduce((sum: number, x: any) => sum + bankFor(x.of).length, 0);
    mod.stages.consolidation = {
      ...(mod.stages.consolidation ?? {}),
      sourceBooklet: { kind: "consolidation", booklet: cons.booklet, ofRange: cons.ofRange, catalogue: cons.catalogue },
      note: `Mixed review across OF ${from}–${to}: a balanced session is drawn from the live banks of every objective in this range (${rangeOFs.length} objectives, ${rangeItems} questions).`,
      coverage: { ofRange: cons.ofRange, objectives: rangeOFs.length, items: rangeItems },
      tasks: mod.stages.consolidation?.tasks ?? [],
    };
  }

  writeFileSync(modPath, JSON.stringify(mod, null, 2));
  touched++;
}

console.log(`Assessments rebuilt for ${touched} modules (self-test blueprints sized to the live banks; consolidation coverage refreshed).`);
