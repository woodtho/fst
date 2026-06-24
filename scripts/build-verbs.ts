/**
 * build-verbs.ts
 * Builds lib/verbs-extra.json: every REGULAR verb that the engine can conjugate correctly,
 * harvested from (1) the PFL2 lexicon and (2) a top-frequency regular-verb list. Irregular and
 * ambiguous-spelling verbs (-eler/-eter, e→è) are excluded here — those live, explicitly and
 * correctly, in the curated list inside lib/conjugation.ts. The regular -er engine already
 * handles -ger/-cer/-yer/é→è spelling automatically, so those are safe to auto-add.
 *
 * Run: node --experimental-strip-types scripts/build-verbs.ts
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// infinitives already handled (correctly) by the curated list in the engine
const curatedSrc = readFileSync(join(ROOT, "lib", "conjugation.ts"), "utf8");
const curated = new Set([...curatedSrc.matchAll(/inf:\s*"([^"]+)"/g)].map((m) => m[1]));

// known irregular -ir verbs (NOT finir-type) — must not be auto-added as regular
const IRREG_IR = new Set([
  "partir", "sortir", "dormir", "servir", "sentir", "mentir", "repartir", "ressortir", "desservir", "consentir", "ressentir", "pressentir",
  "courir", "parcourir", "secourir", "accourir", "concourir", "recourir",
  "mourir", "ouvrir", "couvrir", "découvrir", "recouvrir", "offrir", "souffrir", "rouvrir",
  "cueillir", "accueillir", "recueillir", "assaillir", "tressaillir", "défaillir",
  "venir", "tenir", "devenir", "revenir", "parvenir", "obtenir", "maintenir", "soutenir", "appartenir", "contenir", "retenir", "prévenir", "convenir", "intervenir", "survenir", "provenir", "entretenir", "détenir", "abstenir",
  "fuir", "enfuir", "acquérir", "conquérir", "requérir", "bouillir", "faillir", "saillir", "vêtir", "revêtir", "dévêtir",
]);
// regular -re must end in "dre" but NOT be a prendre-family or -indre verb
const IRREG_DRE = new Set(["prendre", "apprendre", "comprendre", "surprendre", "reprendre", "entreprendre", "déprendre", "méprendre", "éprendre"]);

const stem = (inf: string) => inf.slice(0, -2);
// -eler/-eter (ambiguous ll/tt vs è) and consonant-e-consonant-er (e→è) are excluded from auto
const isTrickyEr = (inf: string) => /(eler|eter)$/.test(inf) || /[bcdfghjklmnpqrstvwxz]e[bcdfghjklmnpqrstvwxz]er$/.test(inf);

type Extra = { inf: string; en: string; group: "er" | "ir" | "re"; aux: "avoir" | "etre"; pp: string };

function classify(inf: string, en: string): Extra | null {
  if (curated.has(inf) || inf.length < 4) return null;
  if (/er$/.test(inf)) {
    if (isTrickyEr(inf)) return null;
    return { inf, en, group: "er", aux: "avoir", pp: stem(inf) + "é" };
  }
  if (/ir$/.test(inf)) {
    if (IRREG_IR.has(inf)) return null;
    return { inf, en, group: "ir", aux: "avoir", pp: stem(inf) + "i" };   // finir-type assumption
  }
  if (/dre$/.test(inf)) {
    if (/indre$/.test(inf) || IRREG_DRE.has(inf)) return null;            // craindre/prendre families
    return { inf, en, group: "re", aux: "avoir", pp: stem(inf) + "u" };
  }
  return null; // other -re endings are irregular (faire, dire, mettre, …) → curated only
}

// ---- 1. harvest from the lexicon ----
const found = new Map<string, Extra>();
const lexDir = join(ROOT, "content", "lexicon", "by-of");
for (const f of readdirSync(lexDir)) {
  const lex = JSON.parse(readFileSync(join(lexDir, f), "utf8"));
  for (const e of lex.entries ?? []) {
    // headword: drop parentheticals/annotations, keep a single-word infinitive
    const head = String(e.fr).replace(/\([^)]*\)/g, "").replace(/[«».,;:]/g, "").trim().toLowerCase();
    if (!/^[a-zàâçéèêëîïôûùü]+$/.test(head)) continue;
    const c = classify(head, String(e.en || "").replace(/\([^)]*\)/g, "").trim().slice(0, 42) || head);
    if (c && !found.has(c.inf)) found.set(c.inf, c);
  }
}

// ---- 2. top-frequency regular verbs (ensure present even if not in the lexicon) ----
const TOP: [string, string][] = [
  ["trouver", "to find"], ["donner", "to give"], ["penser", "to think"], ["passer", "to pass"], ["regarder", "to look at"],
  ["sembler", "to seem"], ["quitter", "to leave"], ["occuper", "to occupy"], ["garder", "to keep"], ["compter", "to count"],
  ["marcher", "to walk"], ["retrouver", "to find again"], ["accepter", "to accept"], ["ajouter", "to add"], ["apporter", "to bring"],
  ["arrêter", "to stop"], ["augmenter", "to increase"], ["casser", "to break"], ["chanter", "to sing"], ["classer", "to file"],
  ["créer", "to create"], ["danser", "to dance"], ["décider", "to decide"], ["dépenser", "to spend"], ["dîner", "to dine"],
  ["discuter", "to discuss"], ["durer", "to last"], ["éviter", "to avoid"], ["exister", "to exist"], ["fermer", "to close"],
  ["fonctionner", "to work/function"], ["former", "to train/form"], ["hésiter", "to hesitate"], ["indiquer", "to indicate"],
  ["inviter", "to invite"], ["laisser", "to let/leave"], ["manquer", "to miss/lack"], ["mériter", "to deserve"], ["noter", "to note"],
  ["oser", "to dare"], ["proposer", "to propose"], ["raconter", "to tell"], ["rappeler", "(skip)"], ["refuser", "to refuse"],
  ["rencontrer", "to meet"], ["réserver", "to reserve"], ["respecter", "to respect"], ["risquer", "to risk"], ["sauter", "to jump"],
  ["signer", "to sign"], ["souhaiter", "to wish"], ["terminer", "to finish"], ["tirer", "to pull"], ["tourner", "to turn"],
  ["traiter", "to treat/process"], ["utiliser", "to use"], ["voyager", "to travel"], ["ranger", "to tidy"], ["déranger", "to disturb"],
  ["partager", "to share"], ["mélanger", "to mix"], ["remplacer", "to replace"], ["lancer", "to throw/launch"], ["avancer", "to advance"],
  ["prononcer", "to pronounce"], ["annoncer", "to announce"], ["employer", "to use/employ"], ["nettoyer", "to clean"],
  ["essayer", "to try"], ["ennuyer", "to bore"], ["espérer", "to hope"], ["répéter", "to repeat"], ["considérer", "to consider"],
  ["célébrer", "to celebrate"], ["réussir", "to succeed"], ["agir", "to act"], ["réagir", "to react"], ["définir", "to define"],
  ["avertir", "to warn"], ["établir", "to establish"], ["nourrir", "to feed"], ["saisir", "to grasp"], ["ralentir", "to slow down"],
  ["défendre", "to defend"], ["répandre", "to spread"], ["fondre", "to melt"], ["mordre", "to bite"], ["tondre", "to mow"],
];
for (const [inf, en] of TOP) {
  const c = classify(inf, en);
  if (c && en !== "(skip)" && !found.has(inf)) found.set(inf, c);
}

const out = [...found.values()].sort((a, b) => a.inf.localeCompare(b.inf, "fr"));
// inject the array into lib/conjugation.ts between the markers (no cross-file import)
const conjPath = join(ROOT, "lib", "conjugation.ts");
const decl = `const EXTRA_VERBS: { inf: string; en: string; group: "er" | "ir" | "re"; aux: "avoir" | "etre"; pp: string }[] = ${JSON.stringify(out, null, 2)};`;
const replaced = curatedSrc.replace(
  /\/\/ <<EXTRA_VERBS_START>>[\s\S]*?\/\/ <<EXTRA_VERBS_END>>/,
  `// <<EXTRA_VERBS_START>>\n${decl}\n// <<EXTRA_VERBS_END>>`,
);
writeFileSync(conjPath, replaced);
const byGroup = out.reduce((m: Record<string, number>, v) => ((m[v.group] = (m[v.group] || 0) + 1), m), {});
console.log(`Injected ${out.length} regular verbs into lib/conjugation.ts (${JSON.stringify(byGroup)}); curated explicit: ${curated.size} infinitives.`);
console.log(`Total conjugation-tool coverage ≈ ${curated.size + out.length} verbs.`);
