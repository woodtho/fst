/**
 * validate-content.ts
 * Validates seed content against the structural rules promised in the docs:
 *  - every Item carries the full explanation contract (5 fields) + tip (3 fields)
 *  - every MCQ-family distractor `tag` (except "correct") has a matching
 *    `explanation.distractor_why` entry
 *  - referenced objectives exist in curriculum.json
 *  - module `itemRefs` resolve to real items
 *
 * Run: npx ts-node scripts/validate-content.ts   (exits non-zero on any error)
 * No external deps; uses only Node fs/path.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const errors: string[] = [];
const warn: string[] = [];
const err = (m: string) => errors.push(m);

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const MCQ_TYPES = new Set([
  "mcq_single", "mcq_multi", "listening_mcq", "dialogue_complete",
]);
const EXPLANATION_FIELDS = [
  "correct_why", "distractor_why", "grammar_rule", "vocab_notes", "common_mistakes",
];
const TIP_FIELDS = ["memory_aid", "pattern", "similar"];

// ---- load curriculum (objective registry) -------------------------------
const curriculum = readJson(join(ROOT, "curriculum.json"));
const objectiveIds = new Set<string>(curriculum.objectives.map((o: any) => o.id));
if (objectiveIds.size !== 40) {
  warn.push(`curriculum.json has ${objectiveIds.size} objectives (expected 40).`);
}

// ---- validate items ------------------------------------------------------
const itemIds = new Set<string>();
const itemsDir = join(ROOT, "question-bank", "items");
for (const file of readdirSync(itemsDir).filter((f) => f.endsWith(".json"))) {
  const data = readJson(join(itemsDir, file));
  for (const it of data.items ?? []) {
    const id = it.id ?? "(missing id)";
    itemIds.add(id);

    if (!objectiveIds.has(it.objectiveId))
      err(`[${file}] item ${id}: unknown objectiveId "${it.objectiveId}"`);

    // explanation contract
    if (!it.explanation) err(`[${file}] item ${id}: missing explanation block`);
    else for (const f of EXPLANATION_FIELDS)
      if (it.explanation[f] == null || it.explanation[f] === "")
        err(`[${file}] item ${id}: explanation.${f} is required`);

    // tip contract
    if (!it.tip) err(`[${file}] item ${id}: missing tip block`);
    else for (const f of TIP_FIELDS)
      if (it.tip[f] == null || (Array.isArray(it.tip[f]) ? it.tip[f].length === 0 : it.tip[f] === ""))
        err(`[${file}] item ${id}: tip.${f} is required`);

    // distractor → explanation linkage (MCQ family)
    if (MCQ_TYPES.has(it.type)) {
      const tags = (it.distractors ?? []).map((d: any) => d.tag).filter((t: string) => t !== "correct");
      if (tags.length < 1)
        err(`[${file}] item ${id}: MCQ-type needs ≥1 non-"correct" distractor`);
      const dw = it.explanation?.distractor_why ?? {};
      for (const t of tags)
        if (!(t in dw))
          err(`[${file}] item ${id}: distractor tag "${t}" has no explanation.distractor_why entry`);
    }

    // answer presence
    if (!it.answer || !it.answer.accepted || it.answer.accepted.length === 0)
      err(`[${file}] item ${id}: answer.accepted must be non-empty`);

    // band sanity
    if (!["easy", "medium", "advanced"].includes(it.difficulty))
      err(`[${file}] item ${id}: invalid difficulty "${it.difficulty}"`);
  }
}

// ---- validate module itemRefs resolve ------------------------------------
const modulesDir = join(ROOT, "modules");
if (existsSync(modulesDir)) {
  for (const file of readdirSync(modulesDir).filter((f) => f.endsWith(".json"))) {
    const mod = readJson(join(modulesDir, file));
    if (!objectiveIds.has(mod.objectiveId))
      err(`[modules/${file}]: unknown objectiveId "${mod.objectiveId}"`);
    const refs: string[] = [];
    const stages = mod.stages ?? {};
    for (const set of stages.practice?.exerciseSets ?? []) refs.push(...(set.itemRefs ?? []));
    for (const task of stages.consolidation?.tasks ?? []) refs.push(...(task.itemRefs ?? []));
    for (const r of refs)
      if (!itemIds.has(r))
        warn.push(`[modules/${file}]: itemRef "${r}" not found in seed item bank (author it before go-live).`);
  }
}

// ---- report --------------------------------------------------------------
console.log(`Checked ${itemIds.size} items across ${objectiveIds.size} objectives.`);
if (warn.length) {
  console.log(`\n${warn.length} warning(s):`);
  warn.forEach((w) => console.log("  ! " + w));
}
if (errors.length) {
  console.error(`\n${errors.length} ERROR(s):`);
  errors.forEach((e) => console.error("  ✗ " + e));
  process.exit(1);
}
console.log("\n✓ Content valid: explanation contract and distractor linkage satisfied.");
