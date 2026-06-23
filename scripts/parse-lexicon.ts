/**
 * parse-lexicon.ts
 * Extracts the PFL2 source Lexique (SC102-2/1-2-2005F) into per-OF JSON with PROPER
 * line-broken entries.
 *
 * We use the `-layout` text extraction, which preserves the document's two-column layout:
 * each entry is one line "french (pos)   <spaces>   english". We split on the run of 2+
 * spaces to recover a clean { fr, en } pair per line — real, aligned entries (no blobs).
 *
 * Run: node --experimental-strip-types scripts/parse-lexicon.ts
 * Prereq: sources/text/lexicon-layout.txt  (pdftotext -layout -enc UTF-8 of the lexicon PDF)
 * Writes: content/lexicon/by-of/OF{n}.json  and  content/lexicon/by-of/index.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "sources", "text", "lexicon-layout.txt");
const OUT = join(ROOT, "content", "lexicon", "by-of");
mkdirSync(OUT, { recursive: true });

if (!existsSync(SRC)) {
  console.error(`Missing ${SRC}. Run: pdftotext -layout -enc UTF-8 sources/pdf/SC102-2-1-2-2005-fra.pdf sources/text/lexicon-layout.txt`);
  process.exit(1);
}

const curriculum = JSON.parse(readFileSync(join(ROOT, "content", "curriculum.json"), "utf8"));
const titleByOf: Record<number, { fr: string; en: string }> = {};
for (const o of curriculum.objectives) titleByOf[o.of] = { fr: o.titleFr, en: o.titleEn };

const lines = readFileSync(SRC, "utf8").split(/\r?\n/);

type Entry = { fr: string; en: string };
const byOf = new Map<number, Entry[]>();

let curOf = 0;
let collecting = false;
let stopped = false; // once we reach the general index, stop
let collectedTotal = 0; // gate the index-stop so the early TOC "Index ... p. 94" line is ignored

const isFooter = (l: string) => /École de la fonction publique du Canada/i.test(l);
const isColHeader = (l: string) => /FRAN[ÇC]AIS\s+ENGLISH/i.test(l) || /FRENCH\s+ENGLISH/i.test(l);
const isPageNum = (l: string) => /^\s*\d+\s*$/.test(l);

for (const raw of lines) {
  if (stopped) break;
  const line = raw.replace(/\s+$/g, "");

  // The alphabetical "Index général" follows the per-OF lexicon — stop there.
  // Gate on collectedTotal so the early table-of-contents "Index ... p. 94" line is ignored.
  if (collectedTotal > 200 && /^\s*(INDEX|Index g[ée]n[ée]ral)\b/i.test(line)) { stopped = true; break; }

  const mOf = line.match(/^\s*Objectif de formation\s+(\d{1,2})\b/);
  if (mOf) {
    curOf = parseInt(mOf[1], 10);
    collecting = false; // wait for the FRANÇAIS/ENGLISH column header
    continue;
  }
  if (isColHeader(line)) { collecting = true; if (curOf && !byOf.has(curOf)) byOf.set(curOf, []); continue; }
  if (isFooter(line)) { collecting = false; continue; }
  if (!collecting || curOf < 1 || curOf > 40) continue;
  if (line.trim() === "" || isPageNum(line)) continue;

  // Split the aligned columns on a run of 2+ spaces.
  const parts = line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
  const list = byOf.get(curOf)!;
  if (parts.length >= 2) {
    const fr = parts[0];
    const en = parts.slice(1).join(" ");
    list.push({ fr, en });
    collectedTotal++;
  } else if (parts.length === 1 && list.length > 0) {
    // continuation line (wrapped English or French) — append to the last entry's English
    list[list.length - 1].en += " " + parts[0];
  }
}

// De-duplicate exact repeats while preserving order (PDF sometimes double-prints).
function dedup(entries: Entry[]): Entry[] {
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const e of entries) {
    const k = e.fr + "||" + e.en;
    if (!seen.has(k)) { seen.add(k); out.push(e); }
  }
  return out;
}

const index: any[] = [];
let total = 0;
for (let of = 1; of <= 40; of++) {
  const entries = dedup(byOf.get(of) ?? []);
  total += entries.length;
  const t = titleByOf[of] ?? { fr: "", en: "" };
  const data = {
    schema: "lexicon-by-of/v2",
    objectiveId: `OF${of}`,
    of,
    titleFr: t.fr,
    titleEn: t.en,
    source: { catalogue: "SC102-2/1-2-2005F", text: "sources/text/lexicon-layout.txt" },
    count: entries.length,
    entries, // [{ fr, en }] — proper aligned entries, one per line
  };
  writeFileSync(join(OUT, `OF${of}.json`), JSON.stringify(data, null, 2));
  index.push({ objectiveId: `OF${of}`, of, titleFr: t.fr, count: entries.length });
}
writeFileSync(join(OUT, "index.json"), JSON.stringify({ schema: "lexicon-by-of-index/v2", count: index.length, totalEntries: total, objectives: index }, null, 2));
console.log(`Wrote ${index.length} per-OF lexicon files, ${total} entries total.`);
console.log("Sample OF2:", JSON.stringify((byOf.get(2) ?? []).slice(0, 3)));
