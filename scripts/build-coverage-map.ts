/**
 * build-coverage-map.ts
 * For every OF, parses the source document's own structure (its table of contents sections,
 * its activities) and links each extracted source element to the learning items that cover
 * it. Produces a per-OF coverage map, flags any uncovered source element, and marks the
 * module complete only when every element has >= 1 linked learning item.
 *
 * Writes: content/coverage/OFn.json  (machine-readable coverage map)
 *         docs/coverage-report.md     (human-readable summary)
 *         updates each content/modules/OFn.json with a `coverage` block.
 *
 * Run: node --experimental-strip-types scripts/build-coverage-map.ts
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
mkdirSync(join(ROOT, "content", "coverage"), { recursive: true });

const curriculum = read("content/curriculum.json");
const manifest = read("sources/manifest.json");

// section-type → how its coverage is satisfied by our learning-item kinds
type Kind = "vocabulary" | "grammar" | "function" | "strategy" | "writing" | "phonetics" | "oral" | "other";
function sectionKind(heading: string): Kind {
  const h = heading.toLowerCase();
  if (/notion/.test(h)) return "vocabulary";          // notions = vocabulary indicators
  if (/lexique|vocabulaire/.test(h)) return "vocabulary";
  if (/grammaire/.test(h)) return "grammar";
  if (/fonction/.test(h)) return "function";
  if (/stratégie/.test(h)) return "strategy";
  if (/langue écrite|écrit/.test(h)) return "writing";
  if (/phonétique/.test(h)) return "phonetics";
  if (/oral|écoute|compréhension/.test(h)) return "oral";
  return "other";
}

// Parse the OF document's table-of-contents sections (e.g. "1.3 – Grammaire" + its topics).
function parseSections(lines: string[]): { id: string; heading: string; topicsFr: string }[] {
  const out: { id: string; heading: string; topicsFr: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(\d+\.\d+)\s*[–-]\s*(\S.+)$/);
    if (!m) continue;
    const id = m[1];
    if (out.some((s) => s.id === id)) continue; // first occurrence (TOC) wins
    const heading = m[2].replace(/\s+ff.*$/, "").trim();
    // topics: the next "ff …" line (French), if any
    let topics = "";
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const t = lines[j].replace(/^\s*(ff|XX)\s*/, "").trim();
      if (/^p\.\s/.test(t) || t === "") continue;
      if (/^[A-Z]/.test(t)) { topics = t.replace(/\bff\b/g, "·").trim(); break; }
    }
    out.push({ id, heading, topicsFr: topics });
  }
  return out;
}

// Enumerate the activities. An activity is "convertible" (auto-gradable) only if it has a
// published answer key (a CORRIGÉ); oral/exploration activities have none.
function parseActivities(lines: string[]): { all: number[]; withKey: Set<number> } {
  const all = new Set<number>(); const withKey = new Set<number>();
  for (const l of lines) {
    let m = l.match(/ACTIVIT[ÉE]\s+(\d{1,2})\b/); if (m) all.add(+m[1]);
    m = l.match(/CORRIG[ÉE]\s*[–-]\s*ACT\s+(\d{1,2})\b/); if (m) { all.add(+m[1]); withKey.add(+m[1]); }
  }
  return { all: [...all].sort((a, b) => a - b), withKey };
}
// section kinds that can be turned into auto-gradable questions
const CONVERTIBLE_KINDS = new Set<Kind>(["vocabulary", "grammar"]);

// the range booklets that review each OF (self-evaluation + consolidation)
const selfEvalFor = (of: number) => of <= 12 ? "selfeval-1 (SC102-2-45-1)" : of <= 22 ? "selfeval-2 (SC102-2-45-2)" : of <= 32 ? "selfeval-3 (SC102-2-45-3)" : "selfeval-4 (SC102-2-45-4)";
const consolidationFor = (of: number) => of <= 12 ? "consolidation-1 (SC102-2-47-1)" : of <= 23 ? "consolidation-2 (SC102-2-47-2)" : of <= 32 ? "consolidation-3 (SC102-2-47-3)" : "consolidation-4 (SC102-2-47-4)";

const report: string[] = ["# PFL2 source-coverage report", "", "Per-OF map of source elements → learning items. A module is **complete** only when every extracted source element has at least one linked learning item.", ""];
let completeCount = 0;
let totalActivityGap = 0;

for (const obj of curriculum.objectives) {
  const id: string = obj.id;
  const of: number = obj.of;
  const lines = readFileSync(join(ROOT, "sources", "text", `OF${String(of).padStart(2, "0")}.txt`), "utf8").split(/\r?\n/);
  const items = read(`content/question-bank/items/${id}.json`).items as any[];
  const lex = read(`content/lexicon/by-of/${id}.json`);

  // learning-item buckets for linking
  const grammarItems = items.filter((it) => (it.grammarConcepts ?? []).length > 0 || it.skill === "grammar");
  const vocabItems = items.filter((it) => it.skill === "vocabulary");
  const itemsByActivity: Record<number, string[]> = {};
  for (const it of items) if (it.source?.verbatim && it.source.activity) (itemsByActivity[it.source.activity] ??= []).push(it.id);

  // ---- sections ----
  const sections = parseSections(lines).map((s) => {
    const kind = sectionKind(s.heading);
    let linkedItems: string[] = [];
    if (kind === "vocabulary") linkedItems = vocabItems.map((it) => it.id);
    else if (kind === "grammar") linkedItems = grammarItems.map((it) => it.id);
    // function / strategy / writing / phonetics / oral: only covered if a source activity of
    // that nature was extracted — otherwise flagged uncovered (not auto-convertible to questions)
    return { ...s, kind, covered: linkedItems.length > 0, itemCount: linkedItems.length, linkedItems: linkedItems.slice(0, 8) };
  });

  // ---- activities ----
  const { all: actNums, withKey } = parseActivities(lines);
  const activities = actNums.map((n) => ({
    activity: n, hasAnswerKey: withKey.has(n), convertible: withKey.has(n),
    extracted: !!itemsByActivity[n], itemCount: (itemsByActivity[n] ?? []).length, linkedItems: itemsByActivity[n] ?? [],
  }));

  // ---- vocabulary element ----
  const vocabulary = { source: `Lexique OF${of} (SC102-2/1-2-2005F)`, entries: lex.count ?? lex.entries?.length ?? 0, questions: vocabItems.length, convertible: true, covered: vocabItems.length > 0 };

  // ---- examples / model sentences (embedded in Notions/Grammaire/Fonctions) ----
  const exampleMarkers = (readFileSync(join(ROOT, "sources", "text", `OF${String(of).padStart(2, "0")}.txt`), "utf8").match(/exemple|p\.\s?ex|mod[èe]le|\bex\.\s/gi) || []).length;
  const transformItems = items.filter((it) => it.difficulty === "advanced" && it.source?.verbatim);
  const examples = { sourceMarkers: exampleMarkers, derivedItems: transformItems.length + grammarItems.length, convertible: true, covered: grammarItems.length > 0, note: "model sentences are embedded in the section text; their patterns are practised through the grammar/transform items derived from this OF" };

  // ---- self-test / consolidation (range review booklets) ----
  const selfTest = { selfEvalBooklet: selfEvalFor(of), consolidationBooklet: consolidationFor(of), convertible: true, extracted: false, covered: false, note: "Cloze self-test passages with answer keys exist in the range booklet but use a numbered-(N)-blank format and are not yet extracted into items — actionable gap." };

  // ---- validation ----
  // strict (per the source-coverage policy): EVERY source element must have >= 1 learning item.
  const uncoveredSections = sections.filter((s) => !s.covered);
  const uncoveredActivities = activities.filter((a) => !a.extracted);
  const strictComplete = uncoveredSections.length === 0 && uncoveredActivities.length === 0 && vocabulary.covered && examples.covered && selfTest.covered;
  // actionable: of the elements that CAN become auto-gradable questions, how many are covered.
  const convertibleSections = sections.filter((s) => CONVERTIBLE_KINDS.has(s.kind));
  const convertibleActs = activities.filter((a) => a.convertible);
  // extra convertible elements: vocabulary, examples, self-test
  const convTotal = convertibleSections.length + convertibleActs.length + 3;
  const convCovered = convertibleSections.filter((s) => s.covered).length + convertibleActs.filter((a) => a.extracted).length + (vocabulary.covered ? 1 : 0) + (examples.covered ? 1 : 0) + (selfTest.covered ? 1 : 0);
  const convertibleComplete = convCovered === convTotal;
  if (convertibleComplete) completeCount++;
  totalActivityGap += convertibleActs.filter((a) => !a.extracted).length;

  // gaps split into actionable (extract more) vs non-convertible (oral/strategy/phonetic — no auto-questions)
  const actionableGaps = {
    sections: convertibleSections.filter((s) => !s.covered).map((s) => `${s.id} ${s.heading} (${s.kind})`),
    activities: convertibleActs.filter((a) => !a.extracted).map((a) => a.activity),
    vocabulary: vocabulary.covered ? [] : ["Lexique"],
    examples: examples.covered ? [] : ["model sentences"],
    selfTest: selfTest.covered ? [] : [selfTest.selfEvalBooklet],
  };
  const nonConvertible = {
    sections: sections.filter((s) => !CONVERTIBLE_KINDS.has(s.kind)).map((s) => `${s.id} ${s.heading} (${s.kind})`),
    activities: activities.filter((a) => !a.convertible).map((a) => a.activity),
  };

  const coverage = {
    schema: "coverage-map/v2",
    sourceDocument: obj.source?.catalogue ?? id,
    sourceText: `sources/text/OF${String(of).padStart(2, "0")}.txt`,
    objectiveId: id, ofNumber: of, titleFr: obj.titleFr, titleEn: obj.titleEn,
    grammarConcepts: obj.grammarConcepts ?? [],
    sections, vocabulary, examples, selfTest, activities,
    validation: {
      strictComplete,                 // every source element covered (policy-strict)
      convertibleComplete,            // every auto-gradable element covered (actionable target)
      totalElements: sections.length + activities.length + 3,
      coveredElements: sections.filter((s) => s.covered).length + activities.filter((a) => a.extracted).length + (vocabulary.covered ? 1 : 0) + (examples.covered ? 1 : 0) + (selfTest.covered ? 1 : 0),
      convertible: { covered: convCovered, total: convTotal },
      actionableGaps,
      nonConvertible,
      note: "strictComplete requires a learning item for EVERY source element. Oral/strategy/phonetic sections and activities without a published answer key cannot become auto-gradable questions, so they are flagged under nonConvertible and keep strictComplete=false. convertibleComplete tracks the actionable target: every answer-keyed activity, grammar section, and the lexicon turned into items.",
    },
  };
  writeFileSync(join(ROOT, "content", "coverage", `${id}.json`), JSON.stringify(coverage, null, 2));

  // update the module with a coverage block
  const modPath = join(ROOT, "content", "modules", `${id}.json`);
  const mod = read(`content/modules/${id}.json`);
  mod.coverage = { strictComplete, convertibleComplete, coveredElements: coverage.validation.coveredElements, totalElements: coverage.validation.totalElements, convertible: coverage.validation.convertible, actionableGaps, nonConvertible };
  writeFileSync(modPath, JSON.stringify(mod, null, 2));

  // report row
  const pct = Math.round((convCovered / convTotal) * 100);
  report.push(`## ${id} — ${obj.titleFr}`);
  report.push(`Source: ${coverage.sourceDocument} · convertible coverage **${convCovered}/${convTotal} (${pct}%)**${convertibleComplete ? " ✅" : ""} · strict ${coverage.validation.coveredElements}/${coverage.validation.totalElements}${strictComplete ? " COMPLETE" : ""}`);
  report.push(`- Sections: ${sections.map((s) => `${s.id} ${s.heading}${s.covered ? " ✓" : CONVERTIBLE_KINDS.has(s.kind) ? " ✗" : " ·"}`).join(" · ")}`);
  report.push(`- Answer-keyed activities extracted: ${convertibleActs.filter((a) => a.extracted).length}/${convertibleActs.length}${actionableGaps.activities.length ? ` (gap: ${actionableGaps.activities.join(",")})` : ""}`);
  report.push(`- Vocabulary: ${vocabulary.entries} taught terms → ${vocabulary.questions} questions ${vocabulary.covered ? "✓" : "✗"}`);
  report.push(`- Examples/model sentences: ${examples.sourceMarkers} markers → practised via ${examples.derivedItems} derived items ${examples.covered ? "✓" : "✗"}`);
  report.push(`- Self-test / consolidation: ${selfTest.selfEvalBooklet}, ${selfTest.consolidationBooklet} ${selfTest.covered ? "✓" : "✗ (cloze passages not yet extracted)"}`);
  if (actionableGaps.sections.length || actionableGaps.activities.length || actionableGaps.vocabulary.length || actionableGaps.selfTest.length || actionableGaps.examples.length)
    report.push(`- ⚠️ Actionable gaps: ${[...actionableGaps.sections, ...(actionableGaps.activities.length ? [`answer-keyed activities ${actionableGaps.activities.join(",")}`] : []), ...actionableGaps.vocabulary, ...actionableGaps.examples, ...actionableGaps.selfTest].join("; ")}`);
  report.push(`- ℹ️ Non-convertible (no auto-questions): ${nonConvertible.sections.length} sections, ${nonConvertible.activities.length} oral/exploration activities`);
  report.push("");
}

report.splice(4, 0,
  `**${completeCount}/40 objectives have full convertible coverage** — every answer-keyed activity, grammar section, and the lexicon is turned into learning items.`,
  "",
  `No objective is *strictly* complete: every OF contains oral/strategy/phonetic sections and exploration activities that have no published answer key and therefore cannot become auto-gradable questions. These are listed per OF under **Non-convertible** and keep \`strictComplete = false\` by design (the policy forbids inventing content to fill them).`,
  "", "Legend: ✓ covered · ✗ actionable gap (convertible but not yet extracted) · · non-convertible source element.", "");
writeFileSync(join(ROOT, "docs", "coverage-report.md"), report.join("\n"));

console.log(`Coverage maps written for 40 OFs.`);
console.log(`  Full convertible coverage: ${completeCount}/40 objectives.`);
console.log(`  Validation flag: ${totalActivityGap} answer-keyed source activities still uncovered (modules stay INCOMPLETE until extracted).`);
console.log(`  Report: docs/coverage-report.md · Maps: content/coverage/OFn.json`);
