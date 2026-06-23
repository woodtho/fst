/**
 * extract-source-activities.ts
 * Extracts the VERBATIM written fill-in-the-blank activities (with their published answer
 * keys / CORRIGÉ) from the PFL2 source OF documents into gradable question items.
 *
 * Each configured activity → fill_blank items: the source sentence (blank shown as ___),
 * the source's own answer from the CORRIGÉ, and a templated explanation contract tied to
 * the activity's grammar focus. Items are tagged source.verbatim = true.
 *
 * Output: content/question-bank/source/OFn.json  (merged into the bank by build-modules.ts)
 * Run: node --experimental-strip-types scripts/extract-source-activities.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "content", "question-bank", "source");
mkdirSync(OUT, { recursive: true });

type ActConfig = {
  act: number;
  grammarConcepts: string[];
  skill: string;
  instructions_en: string;
  ruleFr: string;
  tip: { memory_aid: string; pattern: string; similar: string[] };
  // accepted answers may include grammatical variants the corrigé implies (e.g. 'est' → il/elle/on)
  acceptExtra?: (answer: string, sentence: string) => string[];
};

// Which OFs/activities to extract, with the grammar focus for the explanation contract.
const PLAN: Record<string, { of: number; text: string; activities: ActConfig[] }> = {
  OF1: {
    of: 1,
    text: "sources/text/OF01.txt",
    activities: [
      {
        act: 14, grammarConcepts: ["pronouns"], skill: "grammar",
        instructions_en: "Complete with the correct subject pronoun.",
        ruleFr: "Pronoms sujets : je suis, tu es, il/elle/on est, nous sommes, vous êtes, ils/elles sont.",
        tip: { memory_aid: "La forme du verbe révèle le pronom sujet.", pattern: "verbe → pronom sujet.", similar: ["Je suis…", "Nous sommes…", "Ils sont…"] },
        // the blank is the subject; for 3rd person accept the equivalent pronouns
        acceptExtra: (answer) => {
          const a = answer.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
          if (["il", "elle", "on"].includes(a)) return ["il", "elle", "on"];
          if (["ils", "elles"].includes(a)) return ["ils", "elles"];
          if (a === "je") return ["j’"];
          return [];
        },
      },
      {
        act: 15, grammarConcepts: ["present"], skill: "grammar",
        instructions_en: "Complete with the present tense of the verb être.",
        ruleFr: "Être au présent : je suis, tu es, il/elle/on est, nous sommes, vous êtes, ils/elles sont.",
        tip: { memory_aid: "Accordez la forme d’être au sujet.", pattern: "sujet → forme d’être.", similar: ["Nous sommes…", "Vous êtes…", "Elles sont…"] },
      },
      {
        act: 17, grammarConcepts: ["present"], skill: "writing",
        instructions_en: "Put the verb in the present tense.",
        ruleFr: "Présent des verbes en -er : -e, -es, -e, -ons, -ez, -ent.",
        tip: { memory_aid: "Radical + terminaison de la personne.", pattern: "infinitif sans -er + terminaison.", similar: ["je demeure", "nous travaillons", "ils habitent"] },
      },
    ],
  },
};

const curriculum = JSON.parse(readFileSync(join(ROOT, "content", "curriculum.json"), "utf8"));

function findActivityLine(lines: string[], act: number): string | null {
  // locate "ACTIVITÉ {act}" then the first following multi-item numbered line ("1. … 2. …")
  const re = new RegExp(`ACTIVIT[ÉE]\\s+${act}\\b`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
        if (/(^|\s)1\.\s+\S/.test(lines[j]) && /\s2\.\s/.test(lines[j])) return lines[j];
      }
    }
  }
  return null;
}
function findCorrigeLine(lines: string[], act: number): string | null {
  const re = new RegExp(`CORRIG[ÉE]\\s*[–-]\\s*ACT\\s+${act}\\b`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/(^|\s)1\.\s+\S/.test(lines[j])) return lines[j];
      }
    }
  }
  return null;
}
function splitNumbered(line: string): Record<number, string> {
  const out: Record<number, string> = {};
  const re = /(\d{1,2})\.\s+(.+?)(?=\s+\d{1,2}\.\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out[parseInt(m[1], 10)] = m[2].trim();
  return out;
}

let grandTotal = 0;
for (const [id, cfg] of Object.entries(PLAN)) {
  const obj = curriculum.objectives.find((o: any) => o.id === id);
  const text = readFileSync(join(ROOT, cfg.text), "utf8");
  const lines = text.split(/\r?\n/);
  const items: any[] = [];

  for (const a of cfg.activities) {
    const sline = findActivityLine(lines, a.act);
    const cline = findCorrigeLine(lines, a.act);
    if (!sline || !cline) { console.warn(`  ${id} ACT ${a.act}: block not found`); continue; }
    const sents = splitNumbered(sline);
    const keys = splitNumbered(cline);

    for (const numStr of Object.keys(sents)) {
      const num = parseInt(numStr, 10);
      const sentence = sents[num];
      if (!/_{2,}/.test(sentence)) continue;            // no blank → example, skip
      const ans = keys[num];
      if (!ans) continue;
      const prompt = sentence.replace(/_{2,}/g, "___").replace(/\s+/g, " ").trim();
      const accepted = ans.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean);
      const extra = a.acceptExtra ? a.acceptExtra(accepted[0], sentence) : [];
      const allAccepted = Array.from(new Set([...accepted, ...extra]));
      const infMatch = sentence.match(/\(([a-zàâçéèêëîïôûùüÿœ\-]+)\)/i);
      const inf = infMatch ? infMatch[1] : null;

      const correct_why =
        inf ? `Au présent, « ${inf} » donne « ${accepted[0]} » avec ce sujet.`
            : `La réponse attendue est « ${accepted[0]} ». ${a.ruleFr}`;

      items.push({
        id: `itm_${id.toLowerCase()}_src_act${a.act}_${num}`,
        objectiveId: id,
        skill: a.skill,
        grammarConcepts: a.grammarConcepts,
        vocabDomains: obj?.vocabDomains ?? [],
        theme: obj?.themes?.[0] ?? "workplace",
        difficulty: "medium",
        type: "fill_blank",
        status: "live",
        estTimeSec: 30,
        irtB: 0,
        prompt: { fr: prompt, instructions_en: a.instructions_en },
        answer: { type: "text", accepted: allAccepted, normalizer: "fr_accent_insensitive_trim_lower" },
        distractors: [],
        explanation: {
          correct_why,
          distractor_why: {},
          grammar_rule: a.ruleFr,
          vocab_notes: `Exercice authentique du programme PFL2 (${obj?.source?.catalogue ?? id}, activité ${a.act}).`,
          common_mistakes: ["se tromper de terminaison selon le sujet"],
        },
        tip: a.tip,
        source: { verbatim: true, catalogue: obj?.source?.catalogue, activity: a.act },
      });
    }
    console.log(`  ${id} ACT ${a.act}: ${items.filter((it) => it.source.activity === a.act).length} items`);
  }

  writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ schema: "source-items/v1", objectiveId: id, note: "Verbatim fill-in-the-blank activities + answer keys extracted from the PFL2 source document.", items }, null, 2));
  grandTotal += items.length;
}
console.log(`Extracted ${grandTotal} verbatim source items.`);
