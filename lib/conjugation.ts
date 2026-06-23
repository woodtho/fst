// A compact French conjugation engine for the practice tool.
// Regular -er/-ir/-re engines + explicit irregular present forms and future stems.
// Tenses: présent, imparfait, futur simple, conditionnel présent, subjonctif présent,
// passé composé. Persons in fixed order.

export type Tense = "present" | "imparfait" | "futur_simple" | "conditionnel" | "subjonctif" | "passe_compose";
export type PersonKey = "je" | "tu" | "il" | "nous" | "vous" | "ils";

export const PERSONS: { key: PersonKey; display: string }[] = [
  { key: "je", display: "je" },
  { key: "tu", display: "tu" },
  { key: "il", display: "il/elle/on" },
  { key: "nous", display: "nous" },
  { key: "vous", display: "vous" },
  { key: "ils", display: "ils/elles" },
];

export const TENSES: { key: Tense; fr: string; en: string }[] = [
  { key: "present", fr: "Présent", en: "Present" },
  { key: "passe_compose", fr: "Passé composé", en: "Compound past" },
  { key: "imparfait", fr: "Imparfait", en: "Imperfect" },
  { key: "futur_simple", fr: "Futur simple", en: "Simple future" },
  { key: "conditionnel", fr: "Conditionnel", en: "Conditional" },
  { key: "subjonctif", fr: "Subjonctif", en: "Subjunctive (que…)" },
];

type Verb = {
  inf: string;
  en: string;
  group: "er" | "ir" | "re" | "irr";
  aux: "avoir" | "etre";
  pp: string;               // past participle (masc. sing.)
  futureStem?: string;      // overrides for irregular future/conditional
  present?: Record<PersonKey, string>;   // explicit present (irregulars)
  subjPresent?: Record<PersonKey, string>; // explicit subjunctive (key irregulars)
};

const six = (a: string, b: string, c: string, d: string, e: string, f: string): Record<PersonKey, string> =>
  ({ je: a, tu: b, il: c, nous: d, vous: e, ils: f });

export const VERBS: Verb[] = [
  // regular -er
  { inf: "travailler", en: "to work", group: "er", aux: "avoir", pp: "travaillé" },
  { inf: "parler", en: "to speak", group: "er", aux: "avoir", pp: "parlé" },
  { inf: "demander", en: "to ask", group: "er", aux: "avoir", pp: "demandé" },
  { inf: "préparer", en: "to prepare", group: "er", aux: "avoir", pp: "préparé" },
  { inf: "envoyer", en: "to send", group: "er", aux: "avoir", pp: "envoyé", futureStem: "enverr" },
  { inf: "vérifier", en: "to check", group: "er", aux: "avoir", pp: "vérifié" },
  { inf: "arriver", en: "to arrive", group: "er", aux: "etre", pp: "arrivé" },
  // regular -ir
  { inf: "finir", en: "to finish", group: "ir", aux: "avoir", pp: "fini" },
  { inf: "choisir", en: "to choose", group: "ir", aux: "avoir", pp: "choisi" },
  { inf: "réfléchir", en: "to think/reflect", group: "ir", aux: "avoir", pp: "réfléchi" },
  // regular -re
  { inf: "attendre", en: "to wait", group: "re", aux: "avoir", pp: "attendu" },
  { inf: "répondre", en: "to answer", group: "re", aux: "avoir", pp: "répondu" },
  { inf: "vendre", en: "to sell", group: "re", aux: "avoir", pp: "vendu" },
  // irregulars
  { inf: "être", en: "to be", group: "irr", aux: "avoir", pp: "été", futureStem: "ser",
    present: six("suis", "es", "est", "sommes", "êtes", "sont"),
    subjPresent: six("sois", "sois", "soit", "soyons", "soyez", "soient") },
  { inf: "avoir", en: "to have", group: "irr", aux: "avoir", pp: "eu", futureStem: "aur",
    present: six("ai", "as", "a", "avons", "avez", "ont"),
    subjPresent: six("aie", "aies", "ait", "ayons", "ayez", "aient") },
  { inf: "aller", en: "to go", group: "irr", aux: "etre", pp: "allé", futureStem: "ir",
    present: six("vais", "vas", "va", "allons", "allez", "vont"),
    subjPresent: six("aille", "ailles", "aille", "allions", "alliez", "aillent") },
  { inf: "faire", en: "to do/make", group: "irr", aux: "avoir", pp: "fait", futureStem: "fer",
    present: six("fais", "fais", "fait", "faisons", "faites", "font"),
    subjPresent: six("fasse", "fasses", "fasse", "fassions", "fassiez", "fassent") },
  { inf: "venir", en: "to come", group: "irr", aux: "etre", pp: "venu", futureStem: "viendr",
    present: six("viens", "viens", "vient", "venons", "venez", "viennent"),
    subjPresent: six("vienne", "viennes", "vienne", "venions", "veniez", "viennent") },
  { inf: "prendre", en: "to take", group: "irr", aux: "avoir", pp: "pris",
    present: six("prends", "prends", "prend", "prenons", "prenez", "prennent"),
    subjPresent: six("prenne", "prennes", "prenne", "prenions", "preniez", "prennent") },
  { inf: "pouvoir", en: "to be able", group: "irr", aux: "avoir", pp: "pu", futureStem: "pourr",
    present: six("peux", "peux", "peut", "pouvons", "pouvez", "peuvent"),
    subjPresent: six("puisse", "puisses", "puisse", "puissions", "puissiez", "puissent") },
  { inf: "vouloir", en: "to want", group: "irr", aux: "avoir", pp: "voulu", futureStem: "voudr",
    present: six("veux", "veux", "veut", "voulons", "voulez", "veulent"),
    subjPresent: six("veuille", "veuilles", "veuille", "voulions", "vouliez", "veuillent") },
  { inf: "devoir", en: "must/to have to", group: "irr", aux: "avoir", pp: "dû", futureStem: "devr",
    present: six("dois", "dois", "doit", "devons", "devez", "doivent") },
  { inf: "savoir", en: "to know", group: "irr", aux: "avoir", pp: "su", futureStem: "saur",
    present: six("sais", "sais", "sait", "savons", "savez", "savent"),
    subjPresent: six("sache", "saches", "sache", "sachions", "sachiez", "sachent") },
  { inf: "recevoir", en: "to receive", group: "irr", aux: "avoir", pp: "reçu", futureStem: "recevr",
    present: six("reçois", "reçois", "reçoit", "recevons", "recevez", "reçoivent") },
  { inf: "écrire", en: "to write", group: "irr", aux: "avoir", pp: "écrit",
    present: six("écris", "écris", "écrit", "écrivons", "écrivez", "écrivent") },
  { inf: "dire", en: "to say", group: "irr", aux: "avoir", pp: "dit",
    present: six("dis", "dis", "dit", "disons", "dites", "disent") },
];

export function findVerb(inf: string): Verb | undefined {
  return VERBS.find((v) => v.inf === inf);
}

const ELIDE = /^[aeiouhéèê]/i;
function applyJe(form: string, person: PersonKey): string {
  // je → j' before a vowel/h
  if (person === "je" && ELIDE.test(form)) return "j’" + form;
  return (person === "je" ? "je " : "") + form;
}

function regularPresent(v: Verb): Record<PersonKey, string> {
  const r = v.inf.slice(0, -2);
  if (v.group === "er") return six(r + "e", r + "es", r + "e", r + "ons", r + "ez", r + "ent");
  if (v.group === "ir") return six(r + "is", r + "is", r + "it", r + "issons", r + "issez", r + "issent");
  return six(r + "s", r + "s", r, r + "ons", r + "ez", r + "ent"); // -re
}

function presentForms(v: Verb): Record<PersonKey, string> {
  return v.present ?? regularPresent(v);
}

function imparfaitForms(v: Verb): Record<PersonKey, string> {
  if (v.inf === "être") return six("étais", "étais", "était", "étions", "étiez", "étaient");
  const stem = presentForms(v).nous.replace(/ons$/, "");
  return six(stem + "ais", stem + "ais", stem + "ait", stem + "ions", stem + "iez", stem + "aient");
}

function futureStem(v: Verb): string {
  if (v.futureStem) return v.futureStem;
  if (v.group === "re") return v.inf.slice(0, -1); // drop final e
  return v.inf; // -er, -ir
}

function futurForms(v: Verb): Record<PersonKey, string> {
  const s = futureStem(v);
  return six(s + "ai", s + "as", s + "a", s + "ons", s + "ez", s + "ont");
}

function conditionnelForms(v: Verb): Record<PersonKey, string> {
  const s = futureStem(v);
  return six(s + "ais", s + "ais", s + "ait", s + "ions", s + "iez", s + "aient");
}

function subjonctifForms(v: Verb): Record<PersonKey, string> {
  if (v.subjPresent) return v.subjPresent;
  // stem from ils-present minus -ent
  const ils = presentForms(v).ils;
  const stem = ils.replace(/ent$/, "");
  // nous/vous take the imparfait-like stem for many verbs; for regulars this equals the same stem
  return six(stem + "e", stem + "es", stem + "e", stem + "ions", stem + "iez", stem + "ent");
}

/** Returns the conjugated form WITHOUT the subject pronoun (raw verb form). */
export function conjugateRaw(v: Verb, tense: Tense, person: PersonKey): string {
  switch (tense) {
    case "present": return presentForms(v)[person];
    case "imparfait": return imparfaitForms(v)[person];
    case "futur_simple": return futurForms(v)[person];
    case "conditionnel": return conditionnelForms(v)[person];
    case "subjonctif": return subjonctifForms(v)[person];
    case "passe_compose": {
      const auxV = findVerb(v.aux === "avoir" ? "avoir" : "être")!;
      const auxForm = presentForms(auxV)[person];
      // être verbs: default masculine singular/plural agreement
      let pp = v.pp;
      if (v.aux === "etre") pp = person === "nous" || person === "ils" ? pp + "s" : pp;
      return `${auxForm} ${pp}`;
    }
  }
}

/** Full answer, including the subject pronoun, with je→j' elision. For subjunctive, prefixed with "que". */
export function conjugate(v: Verb, tense: Tense, person: PersonKey): string {
  const raw = conjugateRaw(v, tense, person);
  if (tense === "subjonctif") {
    const q = person === "je" && ELIDE.test(raw) ? "que j’" : person === "je" ? "que je " : `que ${PERSONS.find((p) => p.key === person)!.display.split("/")[0]} `;
    return q + raw;
  }
  // passé composé starts with the auxiliary (a vowel for avoir forms) → handle je elision on the aux
  return applyJe(raw, person);
}

/** Accepts the verb form with or without the leading pronoun/que. */
export function normalizeAnswer(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^que\s+/, "")
    .replace(/^j['’]\s*/, "")
    .replace(/^(je|tu|il|elle|on|nous|vous|ils|elles)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function checkConjugation(inf: string, tense: Tense, person: PersonKey, answer: string): { correct: boolean; expected: string; raw: string } {
  const v = findVerb(inf);
  if (!v) return { correct: false, expected: "", raw: "" };
  const raw = conjugateRaw(v, tense, person);
  const expected = conjugate(v, tense, person);
  const correct = normalizeAnswer(answer) === normalizeAnswer(raw);
  return { correct, expected, raw };
}
