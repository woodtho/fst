/**
 * Extract source questions/activities from the PFL2 self-evaluation and consolidation booklets.
 *
 * The source PDFs use mixed formats: self-evaluation booklets have numbered written prompts with
 * answer keys; consolidation booklets mix written questions, charts, oral tasks, and integration
 * activities. This script preserves every source activity as an extracted prompt record and creates
 * gradeable items only where a numbered self-evaluation prompt can be paired with its answer key.
 *
 * Run: node --experimental-strip-types scripts/extract-supplement-questions.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "sources", "manifest.json"), "utf8"));
const curriculum = JSON.parse(readFileSync(join(ROOT, "content", "curriculum.json"), "utf8"));
const OUT_DIR = join(ROOT, "content", "supplements");

type Supplement = {
  kind: "consolidation" | "self_eval";
  booklet: number;
  ofRange: [number, number];
  catalogue: string;
  pdf: string;
  text: string;
};

type SourceQuestion = {
  id: string;
  sourceKind: "self_eval" | "consolidation";
  booklet: number;
  source: { catalogue: string; pdf: string; text: string };
  ofRange: [number, number];
  objectiveId?: string;
  capsule?: string;
  activity?: number;
  title: string;
  promptFr: string;
  promptEn?: string;
  answer?: string;
  answerAlternatives?: string[];
  gradeable: boolean;
};

type Item = {
  id: string;
  objectiveId: string;
  skill: string;
  difficulty: "easy" | "medium" | "advanced";
  type: string;
  theme?: string;
  grammarConcepts?: string[];
  vocabDomains?: string[];
  estTimeSec: number;
  prompt: any;
  answer: { type: string; accepted: string[]; normalizer?: string; regex?: string | null };
  distractors?: { value: string; tag: string }[];
  explanation: any;
  tip: any;
};

function readSource(rel: string) {
  return readFileSync(join(ROOT, "sources", ...rel.split(/[\\/]/)), "utf8");
}

function clean(value: string) {
  return value
    .replace(/\f/g, "\n")
    .replace(/[•]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function oneLine(value: string) {
  return clean(value).replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
}

function objectiveIdForCapsule(capsule?: string) {
  if (!capsule) return undefined;
  const of = Number(capsule.split(".")[0]);
  return curriculum.objectives.find((o: any) => o.of === of)?.id;
}

function sourceMeta(supp: Supplement) {
  return { catalogue: supp.catalogue, pdf: supp.pdf, text: supp.text };
}

function bodyBeforeAnswerKey(text: string) {
  const firstKey = text.search(/\n\s*Corrigé\s*\n/i);
  return firstKey >= 0 ? text.slice(0, firstKey) : text;
}

function answerKeyText(text: string) {
  const firstKey = text.search(/\n\s*Corrigé\s*\n/i);
  return firstKey >= 0 ? text.slice(firstKey) : "";
}

function splitSelfEvalSections(body: string) {
  const matches = [...body.matchAll(/\n\s*(\d{1,2}\.\d+)\s+([GNSL])\s*\n/g)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? body.length : body.length;
    const capsule = match[1];
    return {
      capsule,
      label: `${capsule} ${match[2]}`,
      text: clean(body.slice(start, end))
    };
  });
}

function extractQuestionContext(section: string, number: number) {
  const marker = new RegExp(`\\(${number}\\)\\s*[_—-]+`);
  const match = marker.exec(section);
  if (!match || match.index == null) return "";
  const start = Math.max(0, section.lastIndexOf("\n", match.index - 1));
  let end = section.indexOf("\n", match.index + match[0].length);
  if (end < 0) end = section.length;
  let context = section.slice(start, end);

  // If several numbered blanks are on one line, keep the local phrase around this number.
  const previousNumber = context.lastIndexOf(`(${number - 1})`);
  if (previousNumber >= 0) context = context.slice(previousNumber + String(number - 1).length + 2);
  const nextNumber = context.indexOf(`(${number + 1})`);
  if (nextNumber >= 0) context = context.slice(0, nextNumber);

  return oneLine(context).replace(marker, "_____");
}

function splitAlternatives(answer: string) {
  const compact = oneLine(answer)
    .replace(/^Corrigé\s*/i, "")
    .replace(/^Numéro\s*/i, "")
    .trim();
  const parts = compact
    .split(/\s+(?:\/|;|\bou\b|\bor\b)\s+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length > 1 ? parts : [compact];
}

function extractSelfEvalAnswers(key: string) {
  const answers = new Map<string, Map<number, string[]>>();
  const capsuleMatches = [...key.matchAll(/\n\s*(\d{1,2}\.\d+)\s*\n/g)];
  for (let i = 0; i < capsuleMatches.length; i++) {
    const capsule = capsuleMatches[i][1];
    const start = (capsuleMatches[i].index ?? 0) + capsuleMatches[i][0].length;
    const end = i + 1 < capsuleMatches.length ? capsuleMatches[i + 1].index ?? key.length : key.length;
    const block = key.slice(start, end);
    const map = answers.get(capsule) ?? new Map<number, string[]>();
    const numberMatches = [...block.matchAll(/\((\d+)\)/g)];
    for (let j = 0; j < numberMatches.length; j++) {
      const number = Number(numberMatches[j][1]);
      const ansStart = (numberMatches[j].index ?? 0) + numberMatches[j][0].length;
      const ansEnd = j + 1 < numberMatches.length ? numberMatches[j + 1].index ?? block.length : block.length;
      let raw = block.slice(ansStart, ansEnd);
      raw = raw.split(/\n\s*Explications\b/i)[0];
      raw = raw.split(/\n\s*École de la fonction publique du Canada\b/i)[0];
      raw = raw.split(/\n\s*Autoévaluation - Activités écrites\b/i)[0];
      const alternatives = splitAlternatives(raw)
        .filter((answer) => answer.length > 0)
        .filter((answer) => !/^Numéro\b/i.test(answer))
        .slice(0, 8);
      if (alternatives.length) map.set(number, alternatives);
    }
    answers.set(capsule, map);
  }
  return answers;
}

function extractSelfEval(supp: Supplement) {
  const text = readSource(supp.text);
  const body = bodyBeforeAnswerKey(text);
  const answers = extractSelfEvalAnswers(answerKeyText(text));
  const sourceQuestions: SourceQuestion[] = [];
  const items: Item[] = [];

  for (const section of splitSelfEvalSections(body)) {
    const objectiveId = objectiveIdForCapsule(section.capsule);
    const nums = [...new Set([...section.text.matchAll(/\((\d+)\)\s*[_—-]+/g)].map((m) => Number(m[1])))]
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    for (const number of nums) {
      const promptFr = extractQuestionContext(section.text, number);
      if (!promptFr || promptFr.length < 8) continue;
      const accepted = answers.get(section.capsule)?.get(number) ?? [];
      const idBase = `SE${supp.booklet}-${section.capsule.replace(".", "-")}-${number}`;
      const sourceQuestion: SourceQuestion = {
        id: idBase,
        sourceKind: "self_eval",
        booklet: supp.booklet,
        source: sourceMeta(supp),
        ofRange: supp.ofRange,
        objectiveId,
        capsule: section.capsule,
        title: `Autoévaluation ${supp.booklet} — ${section.label}, question ${number}`,
        promptFr,
        answer: accepted[0],
        answerAlternatives: accepted,
        gradeable: accepted.length > 0 && !!objectiveId
      };
      sourceQuestions.push(sourceQuestion);
      if (sourceQuestion.gradeable && objectiveId) {
        items.push({
          id: `supp-${idBase}`,
          objectiveId,
          skill: "grammar",
          difficulty: "medium",
          type: "fill_blank",
          theme: "self-evaluation",
          grammarConcepts: [section.capsule],
          vocabDomains: [],
          estTimeSec: 50,
          prompt: {
            fr: promptFr,
            en: `Complete source self-evaluation question ${number} from ${section.capsule}. Write the full corrected French answer when the answer key gives a full phrase.`
          },
          answer: { type: "string", accepted, normalizer: "fr_accent_insensitive_trim_lower", regex: null },
          explanation: {
            correct_why: `This matches the answer key for Autoévaluation ${supp.booklet}, capsule ${section.capsule}, question ${number}.`,
            distractor_why: {},
            grammar_rule: `Review capsule ${section.capsule} in the self-evaluation booklet ${supp.catalogue}.`,
            vocab_notes: "Source-extracted self-evaluation item.",
            common_mistakes: ["Check agreement, verb endings, pronouns, and word order before submitting."]
          },
          tip: {
            memory_aid: `Use the pattern from capsule ${section.capsule}.`,
            pattern: promptFr,
            similar: accepted.slice(0, 3)
          }
        });
      }
    }
  }
  return { sourceQuestions, items };
}

function extractConsolidation(supp: Supplement) {
  const text = clean(readSource(supp.text));
  const firstCorrige = text.search(new RegExp(`Consolidation\\s+${supp.booklet}\\s+[–-]\\s+Corrigé`, "i"));
  const activityText = firstCorrige >= 0 ? text.slice(0, firstCorrige) : text;
  const keyText = firstCorrige >= 0 ? text.slice(firstCorrige) : "";
  const keyedActivities = extractCorrectedActivityNumbers(text);
  const answerBlocks = extractConsolidationAnswerBlocks(keyText);
  const activityBlocks = extractConsolidationActivityBlocks(activityText);
  const sourceQuestions: SourceQuestion[] = [];
  for (const [activity, rawBlock] of activityBlocks) {
    if (!keyedActivities.has(activity)) continue;
    if (!isUsefulConsolidationActivity(rawBlock)) continue;
    const lines = clean(rawBlock)
      .split("\n")
      .map(oneLine)
      .filter((line) =>
        line.length > 0 &&
        !/^École de la fonction publique du Canada$/i.test(line) &&
        !/^\d+\s*$/.test(line)
      );
    const titleLine = lines.find((line) => !/^ACTIVITÉ\s+\d+$/i.test(line)) ?? `Activité ${activity}`;
    const promptFr = trimPrompt(lines.slice(0, 34).join("\n"));
    if (!promptFr || promptFr.length < 12) continue;
    const answer = trimAnswer(answerBlocks.get(activity) ?? "");
    if (!answer) continue;
    sourceQuestions.push({
      id: `CON${supp.booklet}-${activity}`,
      sourceKind: "consolidation",
      booklet: supp.booklet,
      source: sourceMeta(supp),
      ofRange: supp.ofRange,
      activity,
      title: `Consolidation ${supp.booklet} — Activité ${activity}: ${titleLine}`,
      promptFr,
      answer,
      gradeable: false
    });
  }
  return { sourceQuestions, items: [] as Item[] };
}

function extractCorrectedActivityNumbers(text: string) {
  const menu = text.slice(0, 14000);
  const match = menu.match(/Corrigé des activités\s+([\s\S]{0,220})/i);
  const numbers = new Set<number>();
  for (const n of match?.[1]?.match(/\d+/g) ?? []) numbers.add(Number(n));
  return numbers;
}

function extractConsolidationActivityBlocks(text: string) {
  const matches = [...text.matchAll(/^ACTIVITÉ\s+(\d+)\b/gm)];
  const blocks = new Map<number, string>();
  for (let i = 0; i < matches.length; i++) {
    const activity = Number(matches[i][1]);
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const block = text.slice(start, end);
    const existing = blocks.get(activity);
    blocks.set(activity, existing ? `${existing}\n${block}` : block);
  }
  return blocks;
}

function extractConsolidationAnswerBlocks(keyText: string) {
  const matches = [...keyText.matchAll(/^ACTIVITÉ\s+(\d+)\b/gm)];
  const blocks = new Map<number, string>();
  for (let i = 0; i < matches.length; i++) {
    const activity = Number(matches[i][1]);
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? keyText.length : keyText.length;
    let block = keyText.slice(start, end);
    block = block.split(/\n\s*École de la fonction publique du Canada\b/i)[0];
    block = block.split(new RegExp(`\\n\\s*Consolidation\\s+\\d+\\s+[–-]\\s+Corrigé`, "i")).join("\n");
    const existing = blocks.get(activity);
    blocks.set(activity, existing ? `${existing}\n${block}` : block);
  }
  return blocks;
}

function isUsefulConsolidationActivity(block: string) {
  const compact = oneLine(block).toLocaleLowerCase("fr-CA");
  const hasVisibleTask =
    /_{3,}/.test(block) ||
    /\b(complétez|mettez|répondez|traduisez|transformez|corrigez|choisissez|remplacez|formulez|posez|associez|classez|conjuguez)\b/i.test(block) ||
    /\?\s*/.test(block);
  if (!hasVisibleTask) return false;

  const hiddenOrClassroomOnly = [
    "illustration",
    "illustrations",
    "image",
    "images",
    "fiches préalablement",
    "matériel :",
    "en équipe",
    "en équipes",
    "en groupe",
    "formez des équipes",
    "groupe classe",
    "salle de classe",
    "écoutez",
    "audio",
    "votre professeur",
    "découpées",
    "préparées par le professeur"
  ];
  if (hiddenOrClassroomOnly.some((term) => compact.includes(term))) return false;

  const mostlyReadingOrOralOnly =
    compact.includes("prenez connaissance du tableau") ||
    compact.includes("lisez à haute voix") ||
    compact.includes("oralement") ||
    compact.includes("à tour de rôle");
  if (mostlyReadingOrOralOnly && !/_{3,}/.test(block) && !/\?\s*/.test(block)) return false;

  return true;
}

function trimPrompt(prompt: string) {
  return prompt
    .replace(/\nConsolidation\s+\d+\s+[–-]\s+.+$/gis, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function trimAnswer(answer: string) {
  return clean(answer)
    .replace(/\nConsolidation\s+\d+\s+[–-]\s+Corrigé/gi, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !/^\d+$/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function writeJson(path: string, data: any) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const selfEvalSources: SourceQuestion[] = [];
const selfEvalItems: Item[] = [];
for (const supp of manifest.supplements.selfEvaluation as Supplement[]) {
  const extracted = extractSelfEval(supp);
  selfEvalSources.push(...extracted.sourceQuestions);
  selfEvalItems.push(...extracted.items);
}

const consolidationSources: SourceQuestion[] = [];
for (const supp of manifest.supplements.consolidation as Supplement[]) {
  const extracted = extractConsolidation(supp);
  consolidationSources.push(...extracted.sourceQuestions);
}

writeJson(join(OUT_DIR, "self-evaluation-questions.json"), {
  schema: "supplement-source-questions/v1",
  sourceKind: "self_eval",
  count: selfEvalSources.length,
  gradeableCount: selfEvalItems.length,
  questions: selfEvalSources,
  items: selfEvalItems
});

writeJson(join(OUT_DIR, "consolidation-questions.json"), {
  schema: "supplement-source-questions/v1",
  sourceKind: "consolidation",
  count: consolidationSources.length,
  gradeableCount: 0,
  questions: consolidationSources,
  items: []
});

console.log(`Self-evaluation: ${selfEvalSources.length} source questions, ${selfEvalItems.length} gradeable items.`);
console.log(`Consolidation: ${consolidationSources.length} source activities/questions.`);
