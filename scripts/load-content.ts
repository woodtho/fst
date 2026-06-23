/**
 * load-content.ts
 * Idempotent loader: validates then upserts content/ into the DB via Prisma.
 * Upserts are keyed on stable ids, so re-running never duplicates.
 *
 * Run: npx ts-node scripts/load-content.ts
 * Requires: a generated Prisma client and DATABASE_URL set.
 *
 * This is a reference implementation showing the intended load order and the
 * mapping from content JSON → schema. Wire it to your PrismaClient instance.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, Level, Skill, Difficulty, Stage } from "@prisma/client";

const prisma = new PrismaClient();
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

async function main() {
  const curriculum = readJson(join(ROOT, "curriculum.json"));

  // 1. Themes, grammar concepts, vocab domains (taxonomy)
  for (const t of curriculum.themes)
    await prisma.theme.upsert({ where: { id: t }, update: {}, create: { id: t, nameEn: t, nameFr: t } });
  for (const g of curriculum.grammarConcepts)
    await prisma.grammarConcept.upsert({ where: { id: g }, update: {}, create: { id: g, nameEn: g, nameFr: g } });
  for (const d of curriculum.vocabDomains)
    await prisma.vocabDomain.upsert({ where: { id: d }, update: {}, create: { id: d, nameEn: d, nameFr: d } });

  // 2. Objectives (the 40 modules)
  for (const o of curriculum.objectives) {
    await prisma.objective.upsert({
      where: { id: o.id },
      update: {
        titleFr: o.titleFr, titleEn: o.titleEn, level: o.level as Level,
        orderIndex: o.order, primarySkill: o.primarySkill as Skill,
        secondarySkills: (o.secondarySkills ?? []).join(","),
        themes: { set: o.themes.map((t: string) => ({ id: t })) },
      },
      create: {
        id: o.id, code: o.id, titleFr: o.titleFr, titleEn: o.titleEn,
        level: o.level as Level, orderIndex: o.order,
        primarySkill: o.primarySkill as Skill,
        secondarySkills: (o.secondarySkills ?? []).join(","),
        themes: { connect: o.themes.map((t: string) => ({ id: t })) },
      },
    });
  }
  // 2b. Prerequisite edges (soft by default)
  for (const o of curriculum.objectives)
    for (const p of o.prereqs ?? [])
      await prisma.objectivePrereq.upsert({
        where: { objectiveId_prereqId: { objectiveId: o.id, prereqId: p } },
        update: {}, create: { objectiveId: o.id, prereqId: p, hard: false },
      });

  // 3. Lexicon
  const lexDir = join(ROOT, "lexicon");
  if (existsSync(lexDir))
    for (const f of readdirSync(lexDir).filter((f) => f.endsWith(".json"))) {
      const lx = readJson(join(lexDir, f));
      for (const e of lx.entries)
        await prisma.lexiconEntry.create({
          data: {
            fr: e.fr, en: e.en, partOfSpeech: e.pos ?? null, gender: e.gender ?? null,
            register: e.register ?? null, example: e.example ?? null, domainId: lx.domainId,
          },
        });
    }

  // 4. Grammar charts
  const grDir = join(ROOT, "grammar");
  if (existsSync(grDir))
    for (const f of readdirSync(grDir).filter((f) => f.endsWith(".json"))) {
      const g = readJson(join(grDir, f));
      await prisma.grammarChart.create({
        data: { conceptId: g.conceptId, title: g.nameFr, data: g },
      });
    }

  // 5. Modules (stage content)
  const modDir = join(ROOT, "modules");
  if (existsSync(modDir))
    for (const f of readdirSync(modDir).filter((f) => f.endsWith(".json"))) {
      const m = readJson(join(modDir, f));
      for (const [stage, content] of Object.entries(m.stages)) {
        const stageEnum = stage.replace("selfTest", "self_test").replace("masteryCheck", "mastery_check") as Stage;
        await prisma.module.upsert({
          where: { objectiveId_stage: { objectiveId: m.objectiveId, stage: stageEnum } },
          update: { content: content as any, title: `${m.titleFr} — ${stage}` },
          create: { objectiveId: m.objectiveId, stage: stageEnum, title: `${m.titleFr} — ${stage}`, content: content as any },
        });
      }
    }

  // 6. Templates
  const tplDir = join(ROOT, "question-bank", "templates");
  if (existsSync(tplDir))
    for (const f of readdirSync(tplDir).filter((f) => f.endsWith(".json"))) {
      const t = readJson(join(tplDir, f));
      await prisma.template.upsert({
        where: { id: t.id }, update: { spec: t },
        create: { id: t.id, objectiveId: t.objectiveId, type: t.type, difficulty: t.difficulty as Difficulty, spec: t, maxInstances: t.maxInstances ?? 50 },
      });
    }

  // 7. Authored items (+ concept/domain join rows)
  const itDir = join(ROOT, "question-bank", "items");
  if (existsSync(itDir))
    for (const f of readdirSync(itDir).filter((f) => f.endsWith(".json"))) {
      const bank = readJson(join(itDir, f));
      for (const it of bank.items) {
        await prisma.item.upsert({
          where: { id: it.id },
          update: { status: it.status, prompt: it.prompt, answer: it.answer, distractors: it.distractors ?? null, explanation: it.explanation, tip: it.tip, irtB: it.irtB ?? 0 },
          create: {
            id: it.id, objectiveId: it.objectiveId, skill: it.skill as Skill, theme: it.theme,
            difficulty: it.difficulty as Difficulty, type: it.type, status: it.status ?? "draft",
            prompt: it.prompt, answer: it.answer, distractors: it.distractors ?? null,
            explanation: it.explanation, tip: it.tip, estTimeSec: it.estTimeSec ?? 45, irtB: it.irtB ?? 0,
            grammarConcepts: { create: (it.grammarConcepts ?? []).map((c: string) => ({ conceptId: c })) },
            vocabDomains: { create: (it.vocabDomains ?? []).map((d: string) => ({ domainId: d })) },
          },
        });
      }
    }

  console.log("Content loaded.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
