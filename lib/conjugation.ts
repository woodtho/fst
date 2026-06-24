// A compact French conjugation engine for the practice tool.
// Regular -er/-ir/-re engines + explicit irregular forms, covering the full tense system:
// présent, passé composé, imparfait, plus-que-parfait, passé simple, futur proche,
// futur simple, futur antérieur, conditionnel présent/passé, subjonctif présent/passé, impératif.

export type Tense =
  | "present" | "passe_compose" | "imparfait" | "plus_que_parfait" | "passe_simple"
  | "futur_proche" | "futur_simple" | "futur_anterieur"
  | "conditionnel" | "conditionnel_passe"
  | "subjonctif" | "subjonctif_passe" | "imperatif";
export type PersonKey = "je" | "tu" | "il" | "nous" | "vous" | "ils";
export type Mood = "Indicatif" | "Conditionnel" | "Subjonctif" | "Impératif";

export const PERSONS: { key: PersonKey; display: string }[] = [
  { key: "je", display: "je" },
  { key: "tu", display: "tu" },
  { key: "il", display: "il/elle/on" },
  { key: "nous", display: "nous" },
  { key: "vous", display: "vous" },
  { key: "ils", display: "ils/elles" },
];

export const TENSES: { key: Tense; fr: string; en: string; mood: Mood; compound?: boolean }[] = [
  { key: "present", fr: "Présent", en: "Present", mood: "Indicatif" },
  { key: "passe_compose", fr: "Passé composé", en: "Compound past", mood: "Indicatif", compound: true },
  { key: "imparfait", fr: "Imparfait", en: "Imperfect", mood: "Indicatif" },
  { key: "plus_que_parfait", fr: "Plus-que-parfait", en: "Pluperfect", mood: "Indicatif", compound: true },
  { key: "passe_simple", fr: "Passé simple", en: "Simple past (literary)", mood: "Indicatif" },
  { key: "futur_proche", fr: "Futur proche", en: "Near future (aller + inf.)", mood: "Indicatif" },
  { key: "futur_simple", fr: "Futur simple", en: "Simple future", mood: "Indicatif" },
  { key: "futur_anterieur", fr: "Futur antérieur", en: "Future perfect", mood: "Indicatif", compound: true },
  { key: "conditionnel", fr: "Conditionnel présent", en: "Conditional", mood: "Conditionnel" },
  { key: "conditionnel_passe", fr: "Conditionnel passé", en: "Past conditional", mood: "Conditionnel", compound: true },
  { key: "subjonctif", fr: "Subjonctif présent", en: "Subjunctive (que…)", mood: "Subjonctif" },
  { key: "subjonctif_passe", fr: "Subjonctif passé", en: "Past subjunctive (que…)", mood: "Subjonctif", compound: true },
  { key: "imperatif", fr: "Impératif", en: "Imperative", mood: "Impératif" },
];

export const GROUPS: { key: "er" | "ir" | "re" | "irr"; label: string; en: string }[] = [
  { key: "er", label: "-er", en: "Regular -er" },
  { key: "ir", label: "-ir", en: "Regular -ir (finir type)" },
  { key: "re", label: "-re", en: "Regular -re" },
  { key: "irr", label: "Irréguliers", en: "Irregular" },
];

type Verb = {
  inf: string;
  en: string;
  group: "er" | "ir" | "re" | "irr";
  aux: "avoir" | "etre";
  pp: string;               // past participle (masc. sing.)
  futureStem?: string;      // overrides for irregular future/conditional
  present?: Record<PersonKey, string>;     // explicit present (irregulars)
  subjPresent?: Record<PersonKey, string>; // explicit subjunctive (stem-changing verbs)
  ps?: { stem: string; type: "i" | "u" | "in" }; // passé simple for irregulars
  passeSimple?: Record<PersonKey, string>;       // explicit passé simple override
};

const six = (a: string, b: string, c: string, d: string, e: string, f: string): Record<PersonKey, string> =>
  ({ je: a, tu: b, il: c, nous: d, vous: e, ils: f });

export const VERBS: Verb[] = [
  // ----- regular -er (avoir) -----
  { inf: "travailler", en: "to work", group: "er", aux: "avoir", pp: "travaillé" },
  { inf: "parler", en: "to speak", group: "er", aux: "avoir", pp: "parlé" },
  { inf: "demander", en: "to ask", group: "er", aux: "avoir", pp: "demandé" },
  { inf: "préparer", en: "to prepare", group: "er", aux: "avoir", pp: "préparé" },
  { inf: "aimer", en: "to like/love", group: "er", aux: "avoir", pp: "aimé" },
  { inf: "donner", en: "to give", group: "er", aux: "avoir", pp: "donné" },
  { inf: "regarder", en: "to watch", group: "er", aux: "avoir", pp: "regardé" },
  { inf: "écouter", en: "to listen", group: "er", aux: "avoir", pp: "écouté" },
  { inf: "trouver", en: "to find", group: "er", aux: "avoir", pp: "trouvé" },
  { inf: "penser", en: "to think", group: "er", aux: "avoir", pp: "pensé" },
  { inf: "chercher", en: "to look for", group: "er", aux: "avoir", pp: "cherché" },
  { inf: "montrer", en: "to show", group: "er", aux: "avoir", pp: "montré" },
  { inf: "habiter", en: "to live", group: "er", aux: "avoir", pp: "habité" },
  { inf: "étudier", en: "to study", group: "er", aux: "avoir", pp: "étudié" },
  { inf: "rencontrer", en: "to meet", group: "er", aux: "avoir", pp: "rencontré" },
  { inf: "organiser", en: "to organize", group: "er", aux: "avoir", pp: "organisé" },
  { inf: "présenter", en: "to introduce", group: "er", aux: "avoir", pp: "présenté" },
  { inf: "téléphoner", en: "to phone", group: "er", aux: "avoir", pp: "téléphoné" },
  { inf: "expliquer", en: "to explain", group: "er", aux: "avoir", pp: "expliqué" },
  { inf: "gagner", en: "to earn/win", group: "er", aux: "avoir", pp: "gagné" },
  { inf: "porter", en: "to carry/wear", group: "er", aux: "avoir", pp: "porté" },
  { inf: "jouer", en: "to play", group: "er", aux: "avoir", pp: "joué" },
  { inf: "continuer", en: "to continue", group: "er", aux: "avoir", pp: "continué" },
  { inf: "oublier", en: "to forget", group: "er", aux: "avoir", pp: "oublié" },
  { inf: "vérifier", en: "to check", group: "er", aux: "avoir", pp: "vérifié" },
  { inf: "aider", en: "to help", group: "er", aux: "avoir", pp: "aidé" },
  // ----- spelling-change -er -----
  { inf: "manger", en: "to eat", group: "er", aux: "avoir", pp: "mangé",
    present: six("mange", "manges", "mange", "mangeons", "mangez", "mangent"),
    passeSimple: six("mangeai", "mangeas", "mangea", "mangeâmes", "mangeâtes", "mangèrent") },
  { inf: "commencer", en: "to begin", group: "er", aux: "avoir", pp: "commencé",
    present: six("commence", "commences", "commence", "commençons", "commencez", "commencent"),
    passeSimple: six("commençai", "commenças", "commença", "commençâmes", "commençâtes", "commencèrent") },
  { inf: "acheter", en: "to buy", group: "er", aux: "avoir", pp: "acheté", futureStem: "achèter",
    present: six("achète", "achètes", "achète", "achetons", "achetez", "achètent"),
    subjPresent: six("achète", "achètes", "achète", "achetions", "achetiez", "achètent") },
  { inf: "appeler", en: "to call", group: "er", aux: "avoir", pp: "appelé", futureStem: "appeller",
    present: six("appelle", "appelles", "appelle", "appelons", "appelez", "appellent"),
    subjPresent: six("appelle", "appelles", "appelle", "appelions", "appeliez", "appellent") },
  { inf: "préférer", en: "to prefer", group: "er", aux: "avoir", pp: "préféré",
    present: six("préfère", "préfères", "préfère", "préférons", "préférez", "préfèrent"),
    subjPresent: six("préfère", "préfères", "préfère", "préférions", "préfériez", "préfèrent") },
  { inf: "payer", en: "to pay", group: "er", aux: "avoir", pp: "payé", futureStem: "paier",
    present: six("paie", "paies", "paie", "payons", "payez", "paient"),
    subjPresent: six("paie", "paies", "paie", "payions", "payiez", "paient") },
  { inf: "envoyer", en: "to send", group: "er", aux: "avoir", pp: "envoyé", futureStem: "enverr",
    present: six("envoie", "envoies", "envoie", "envoyons", "envoyez", "envoient"),
    subjPresent: six("envoie", "envoies", "envoie", "envoyions", "envoyiez", "envoient") },
  // ----- regular -er (être / movement) -----
  { inf: "arriver", en: "to arrive", group: "er", aux: "etre", pp: "arrivé" },
  { inf: "entrer", en: "to enter", group: "er", aux: "etre", pp: "entré" },
  { inf: "rester", en: "to stay", group: "er", aux: "etre", pp: "resté" },
  { inf: "tomber", en: "to fall", group: "er", aux: "etre", pp: "tombé" },
  { inf: "monter", en: "to go up", group: "er", aux: "etre", pp: "monté" },
  { inf: "rentrer", en: "to return home", group: "er", aux: "etre", pp: "rentré" },
  { inf: "retourner", en: "to go back", group: "er", aux: "etre", pp: "retourné" },
  // ----- regular -ir (finir type) -----
  { inf: "finir", en: "to finish", group: "ir", aux: "avoir", pp: "fini" },
  { inf: "choisir", en: "to choose", group: "ir", aux: "avoir", pp: "choisi" },
  { inf: "réfléchir", en: "to reflect", group: "ir", aux: "avoir", pp: "réfléchi" },
  { inf: "réussir", en: "to succeed", group: "ir", aux: "avoir", pp: "réussi" },
  { inf: "remplir", en: "to fill", group: "ir", aux: "avoir", pp: "rempli" },
  { inf: "obéir", en: "to obey", group: "ir", aux: "avoir", pp: "obéi" },
  { inf: "grandir", en: "to grow", group: "ir", aux: "avoir", pp: "grandi" },
  // ----- regular -re -----
  { inf: "attendre", en: "to wait", group: "re", aux: "avoir", pp: "attendu" },
  { inf: "répondre", en: "to answer", group: "re", aux: "avoir", pp: "répondu" },
  { inf: "vendre", en: "to sell", group: "re", aux: "avoir", pp: "vendu" },
  { inf: "perdre", en: "to lose", group: "re", aux: "avoir", pp: "perdu" },
  { inf: "entendre", en: "to hear", group: "re", aux: "avoir", pp: "entendu" },
  { inf: "rendre", en: "to give back", group: "re", aux: "avoir", pp: "rendu" },
  { inf: "descendre", en: "to go down", group: "re", aux: "etre", pp: "descendu" },
  // ----- irregular -ir -----
  { inf: "partir", en: "to leave", group: "irr", aux: "etre", pp: "parti", ps: { stem: "part", type: "i" },
    present: six("pars", "pars", "part", "partons", "partez", "partent") },
  { inf: "sortir", en: "to go out", group: "irr", aux: "etre", pp: "sorti", ps: { stem: "sort", type: "i" },
    present: six("sors", "sors", "sort", "sortons", "sortez", "sortent") },
  { inf: "dormir", en: "to sleep", group: "irr", aux: "avoir", pp: "dormi", ps: { stem: "dorm", type: "i" },
    present: six("dors", "dors", "dort", "dormons", "dormez", "dorment") },
  { inf: "servir", en: "to serve", group: "irr", aux: "avoir", pp: "servi", ps: { stem: "serv", type: "i" },
    present: six("sers", "sers", "sert", "servons", "servez", "servent") },
  { inf: "sentir", en: "to feel/smell", group: "irr", aux: "avoir", pp: "senti", ps: { stem: "sent", type: "i" },
    present: six("sens", "sens", "sent", "sentons", "sentez", "sentent") },
  { inf: "ouvrir", en: "to open", group: "irr", aux: "avoir", pp: "ouvert", ps: { stem: "ouvr", type: "i" },
    present: six("ouvre", "ouvres", "ouvre", "ouvrons", "ouvrez", "ouvrent") },
  { inf: "offrir", en: "to offer", group: "irr", aux: "avoir", pp: "offert", ps: { stem: "offr", type: "i" },
    present: six("offre", "offres", "offre", "offrons", "offrez", "offrent") },
  { inf: "courir", en: "to run", group: "irr", aux: "avoir", pp: "couru", futureStem: "courr", ps: { stem: "cour", type: "u" },
    present: six("cours", "cours", "court", "courons", "courez", "courent") },
  // ----- irregular (-oir / -re / -ir) -----
  { inf: "être", en: "to be", group: "irr", aux: "avoir", pp: "été", futureStem: "ser", ps: { stem: "f", type: "u" },
    present: six("suis", "es", "est", "sommes", "êtes", "sont"),
    subjPresent: six("sois", "sois", "soit", "soyons", "soyez", "soient") },
  { inf: "avoir", en: "to have", group: "irr", aux: "avoir", pp: "eu", futureStem: "aur", ps: { stem: "e", type: "u" },
    present: six("ai", "as", "a", "avons", "avez", "ont"),
    subjPresent: six("aie", "aies", "ait", "ayons", "ayez", "aient") },
  { inf: "aller", en: "to go", group: "irr", aux: "etre", pp: "allé", futureStem: "ir",
    present: six("vais", "vas", "va", "allons", "allez", "vont"),
    subjPresent: six("aille", "ailles", "aille", "allions", "alliez", "aillent"),
    passeSimple: six("allai", "allas", "alla", "allâmes", "allâtes", "allèrent") },
  { inf: "faire", en: "to do/make", group: "irr", aux: "avoir", pp: "fait", futureStem: "fer", ps: { stem: "f", type: "i" },
    present: six("fais", "fais", "fait", "faisons", "faites", "font"),
    subjPresent: six("fasse", "fasses", "fasse", "fassions", "fassiez", "fassent") },
  { inf: "venir", en: "to come", group: "irr", aux: "etre", pp: "venu", futureStem: "viendr", ps: { stem: "v", type: "in" },
    present: six("viens", "viens", "vient", "venons", "venez", "viennent"),
    subjPresent: six("vienne", "viennes", "vienne", "venions", "veniez", "viennent") },
  { inf: "devenir", en: "to become", group: "irr", aux: "etre", pp: "devenu", futureStem: "deviendr", ps: { stem: "dev", type: "in" },
    present: six("deviens", "deviens", "devient", "devenons", "devenez", "deviennent"),
    subjPresent: six("devienne", "deviennes", "devienne", "devenions", "deveniez", "deviennent") },
  { inf: "tenir", en: "to hold", group: "irr", aux: "avoir", pp: "tenu", futureStem: "tiendr", ps: { stem: "t", type: "in" },
    present: six("tiens", "tiens", "tient", "tenons", "tenez", "tiennent"),
    subjPresent: six("tienne", "tiennes", "tienne", "tenions", "teniez", "tiennent") },
  { inf: "prendre", en: "to take", group: "irr", aux: "avoir", pp: "pris", ps: { stem: "pr", type: "i" },
    present: six("prends", "prends", "prend", "prenons", "prenez", "prennent"),
    subjPresent: six("prenne", "prennes", "prenne", "prenions", "preniez", "prennent") },
  { inf: "apprendre", en: "to learn", group: "irr", aux: "avoir", pp: "appris", ps: { stem: "appr", type: "i" },
    present: six("apprends", "apprends", "apprend", "apprenons", "apprenez", "apprennent"),
    subjPresent: six("apprenne", "apprennes", "apprenne", "apprenions", "appreniez", "apprennent") },
  { inf: "comprendre", en: "to understand", group: "irr", aux: "avoir", pp: "compris", ps: { stem: "compr", type: "i" },
    present: six("comprends", "comprends", "comprend", "comprenons", "comprenez", "comprennent"),
    subjPresent: six("comprenne", "comprennes", "comprenne", "comprenions", "compreniez", "comprennent") },
  { inf: "pouvoir", en: "to be able", group: "irr", aux: "avoir", pp: "pu", futureStem: "pourr", ps: { stem: "p", type: "u" },
    present: six("peux", "peux", "peut", "pouvons", "pouvez", "peuvent"),
    subjPresent: six("puisse", "puisses", "puisse", "puissions", "puissiez", "puissent") },
  { inf: "vouloir", en: "to want", group: "irr", aux: "avoir", pp: "voulu", futureStem: "voudr", ps: { stem: "voul", type: "u" },
    present: six("veux", "veux", "veut", "voulons", "voulez", "veulent"),
    subjPresent: six("veuille", "veuilles", "veuille", "voulions", "vouliez", "veuillent") },
  { inf: "devoir", en: "must / to have to", group: "irr", aux: "avoir", pp: "dû", futureStem: "devr", ps: { stem: "d", type: "u" },
    present: six("dois", "dois", "doit", "devons", "devez", "doivent"),
    subjPresent: six("doive", "doives", "doive", "devions", "deviez", "doivent") },
  { inf: "savoir", en: "to know", group: "irr", aux: "avoir", pp: "su", futureStem: "saur", ps: { stem: "s", type: "u" },
    present: six("sais", "sais", "sait", "savons", "savez", "savent"),
    subjPresent: six("sache", "saches", "sache", "sachions", "sachiez", "sachent") },
  { inf: "recevoir", en: "to receive", group: "irr", aux: "avoir", pp: "reçu", futureStem: "recevr", ps: { stem: "reç", type: "u" },
    present: six("reçois", "reçois", "reçoit", "recevons", "recevez", "reçoivent"),
    subjPresent: six("reçoive", "reçoives", "reçoive", "recevions", "receviez", "reçoivent") },
  { inf: "voir", en: "to see", group: "irr", aux: "avoir", pp: "vu", futureStem: "verr", ps: { stem: "v", type: "i" },
    present: six("vois", "vois", "voit", "voyons", "voyez", "voient"),
    subjPresent: six("voie", "voies", "voie", "voyions", "voyiez", "voient") },
  { inf: "croire", en: "to believe", group: "irr", aux: "avoir", pp: "cru", ps: { stem: "cr", type: "u" },
    present: six("crois", "crois", "croit", "croyons", "croyez", "croient"),
    subjPresent: six("croie", "croies", "croie", "croyions", "croyiez", "croient") },
  { inf: "boire", en: "to drink", group: "irr", aux: "avoir", pp: "bu", ps: { stem: "b", type: "u" },
    present: six("bois", "bois", "boit", "buvons", "buvez", "boivent"),
    subjPresent: six("boive", "boives", "boive", "buvions", "buviez", "boivent") },
  { inf: "écrire", en: "to write", group: "irr", aux: "avoir", pp: "écrit", ps: { stem: "écriv", type: "i" },
    present: six("écris", "écris", "écrit", "écrivons", "écrivez", "écrivent") },
  { inf: "dire", en: "to say", group: "irr", aux: "avoir", pp: "dit", ps: { stem: "d", type: "i" },
    present: six("dis", "dis", "dit", "disons", "dites", "disent") },
  { inf: "lire", en: "to read", group: "irr", aux: "avoir", pp: "lu", ps: { stem: "l", type: "u" },
    present: six("lis", "lis", "lit", "lisons", "lisez", "lisent") },
  { inf: "mettre", en: "to put", group: "irr", aux: "avoir", pp: "mis", ps: { stem: "m", type: "i" },
    present: six("mets", "mets", "met", "mettons", "mettez", "mettent") },
  { inf: "connaître", en: "to know (be familiar)", group: "irr", aux: "avoir", pp: "connu", ps: { stem: "conn", type: "u" },
    present: six("connais", "connais", "connaît", "connaissons", "connaissez", "connaissent") },
  { inf: "suivre", en: "to follow", group: "irr", aux: "avoir", pp: "suivi", ps: { stem: "suiv", type: "i" },
    present: six("suis", "suis", "suit", "suivons", "suivez", "suivent") },
  { inf: "vivre", en: "to live", group: "irr", aux: "avoir", pp: "vécu", ps: { stem: "véc", type: "u" },
    present: six("vis", "vis", "vit", "vivons", "vivez", "vivent") },
];

export function findVerb(inf: string): Verb | undefined {
  return VERBS.find((v) => v.inf === inf);
}

const ELIDE = /^[aeiouhéèê]/i;
function applyJe(form: string, person: PersonKey): string {
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
  return v.inf.endsWith("e") ? v.inf.slice(0, -1) : v.inf; // drop final -e (re/-re/-oire), keep -er/-ir
}

function futurForms(v: Verb): Record<PersonKey, string> {
  const s = futureStem(v);
  return six(s + "ai", s + "as", s + "a", s + "ons", s + "ez", s + "ont");
}

function conditionnelForms(v: Verb): Record<PersonKey, string> {
  const s = futureStem(v);
  return six(s + "ais", s + "ais", s + "ait", s + "ions", s + "iez", s + "aient");
}

function futurProcheForms(v: Verb): Record<PersonKey, string> {
  const aller = presentForms(findVerb("aller")!);
  return six(`${aller.je} ${v.inf}`, `${aller.tu} ${v.inf}`, `${aller.il} ${v.inf}`,
    `${aller.nous} ${v.inf}`, `${aller.vous} ${v.inf}`, `${aller.ils} ${v.inf}`);
}

function subjonctifForms(v: Verb): Record<PersonKey, string> {
  if (v.subjPresent) return v.subjPresent;
  const stem = presentForms(v).ils.replace(/ent$/, "");
  return six(stem + "e", stem + "es", stem + "e", stem + "ions", stem + "iez", stem + "ent");
}

function passeSimpleForms(v: Verb): Record<PersonKey, string> {
  if (v.passeSimple) return v.passeSimple;
  if (v.ps) {
    const { stem, type } = v.ps;
    if (type === "u") return six(stem + "us", stem + "us", stem + "ut", stem + "ûmes", stem + "ûtes", stem + "urent");
    if (type === "in") return six(stem + "ins", stem + "ins", stem + "int", stem + "înmes", stem + "întes", stem + "inrent");
    return six(stem + "is", stem + "is", stem + "it", stem + "îmes", stem + "îtes", stem + "irent");
  }
  const r = v.inf.slice(0, -2);
  if (v.group === "er") return six(r + "ai", r + "as", r + "a", r + "âmes", r + "âtes", r + "èrent");
  return six(r + "is", r + "is", r + "it", r + "îmes", r + "îtes", r + "irent"); // -ir / -re regular
}

// Impératif exists only for tu / nous / vous. The four irregular imperatives are explicit.
const IMPERATIVE_SPECIAL: Record<string, Record<"tu" | "nous" | "vous", string>> = {
  être: { tu: "sois", nous: "soyons", vous: "soyez" },
  avoir: { tu: "aie", nous: "ayons", vous: "ayez" },
  savoir: { tu: "sache", nous: "sachons", vous: "sachez" },
  vouloir: { tu: "veuille", nous: "veuillons", vous: "veuillez" },
};
function imperatifForm(v: Verb, person: PersonKey): string {
  const sp = IMPERATIVE_SPECIAL[v.inf];
  const pres = presentForms(v);
  if (sp && (person === "tu" || person === "nous" || person === "vous")) return sp[person];
  if (person === "nous") return pres.nous;
  if (person === "vous") return pres.vous;
  // tu: drop the final -s of the -er pattern (parles→parle, ouvres→ouvre) and aller (vas→va)
  let tu = pres.tu;
  if (v.inf === "aller" || tu.endsWith("es")) tu = tu.replace(/s$/, "");
  return tu;
}

function compound(v: Verb, auxTense: Tense, person: PersonKey): string {
  const auxV = findVerb(v.aux === "avoir" ? "avoir" : "être")!;
  const auxForm = conjugateRaw(auxV, auxTense, person);
  let pp = v.pp;
  if (v.aux === "etre") pp = person === "nous" || person === "ils" ? pp + "s" : pp;
  return `${auxForm} ${pp}`;
}

/** Conjugated form WITHOUT the subject pronoun. */
export function conjugateRaw(v: Verb, tense: Tense, person: PersonKey): string {
  switch (tense) {
    case "present": return presentForms(v)[person];
    case "imparfait": return imparfaitForms(v)[person];
    case "passe_simple": return passeSimpleForms(v)[person];
    case "futur_simple": return futurForms(v)[person];
    case "futur_proche": return futurProcheForms(v)[person];
    case "conditionnel": return conditionnelForms(v)[person];
    case "subjonctif": return subjonctifForms(v)[person];
    case "imperatif": return imperatifForm(v, person);
    case "passe_compose": return compound(v, "present", person);
    case "plus_que_parfait": return compound(v, "imparfait", person);
    case "futur_anterieur": return compound(v, "futur_simple", person);
    case "conditionnel_passe": return compound(v, "conditionnel", person);
    case "subjonctif_passe": return compound(v, "subjonctif", person);
  }
}

const SUBJUNCTIVE = new Set<Tense>(["subjonctif", "subjonctif_passe"]);

/** Full answer including pronoun, with je→j' elision. Subjunctive prefixed with "que"; impératif bare. */
export function conjugate(v: Verb, tense: Tense, person: PersonKey): string {
  const raw = conjugateRaw(v, tense, person);
  if (tense === "imperatif") return raw;
  if (SUBJUNCTIVE.has(tense)) {
    if (person === "je") return (ELIDE.test(raw) ? "que j’" : "que je ") + raw;
    return `que ${PERSONS.find((p) => p.key === person)!.display.split("/")[0]} ${raw}`;
  }
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
