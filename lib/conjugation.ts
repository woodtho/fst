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

const VERBS_CURATED: Verb[] = [
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
  // ----- additional common irregulars (top-frequency) -----
  { inf: "revenir", en: "to come back", group: "irr", aux: "etre", pp: "revenu", futureStem: "reviendr", ps: { stem: "rev", type: "in" },
    present: six("reviens", "reviens", "revient", "revenons", "revenez", "reviennent"),
    subjPresent: six("revienne", "reviennes", "revienne", "revenions", "reveniez", "reviennent") },
  { inf: "obtenir", en: "to obtain", group: "irr", aux: "avoir", pp: "obtenu", futureStem: "obtiendr", ps: { stem: "obt", type: "in" },
    present: six("obtiens", "obtiens", "obtient", "obtenons", "obtenez", "obtiennent"),
    subjPresent: six("obtienne", "obtiennes", "obtienne", "obtenions", "obteniez", "obtiennent") },
  { inf: "mourir", en: "to die", group: "irr", aux: "etre", pp: "mort", futureStem: "mourr", ps: { stem: "mour", type: "u" },
    present: six("meurs", "meurs", "meurt", "mourons", "mourez", "meurent"),
    subjPresent: six("meure", "meures", "meure", "mourions", "mouriez", "meurent") },
  { inf: "naître", en: "to be born", group: "irr", aux: "etre", pp: "né", futureStem: "naîtr",
    present: six("nais", "nais", "naît", "naissons", "naissez", "naissent"),
    passeSimple: six("naquis", "naquis", "naquit", "naquîmes", "naquîtes", "naquirent") },
  { inf: "connaître", en: "to know (be familiar)", group: "irr", aux: "avoir", pp: "connu", futureStem: "connaîtr", ps: { stem: "conn", type: "u" },
    present: six("connais", "connais", "connaît", "connaissons", "connaissez", "connaissent") },
  { inf: "reconnaître", en: "to recognize", group: "irr", aux: "avoir", pp: "reconnu", futureStem: "reconnaîtr", ps: { stem: "reconn", type: "u" },
    present: six("reconnais", "reconnais", "reconnaît", "reconnaissons", "reconnaissez", "reconnaissent") },
  { inf: "paraître", en: "to appear/seem", group: "irr", aux: "avoir", pp: "paru", futureStem: "paraîtr", ps: { stem: "par", type: "u" },
    present: six("parais", "parais", "paraît", "paraissons", "paraissez", "paraissent") },
  { inf: "conduire", en: "to drive", group: "irr", aux: "avoir", pp: "conduit", ps: { stem: "conduis", type: "i" },
    present: six("conduis", "conduis", "conduit", "conduisons", "conduisez", "conduisent") },
  { inf: "produire", en: "to produce", group: "irr", aux: "avoir", pp: "produit", ps: { stem: "produis", type: "i" },
    present: six("produis", "produis", "produit", "produisons", "produisez", "produisent") },
  { inf: "construire", en: "to build", group: "irr", aux: "avoir", pp: "construit", ps: { stem: "construis", type: "i" },
    present: six("construis", "construis", "construit", "construisons", "construisez", "construisent") },
  { inf: "traduire", en: "to translate", group: "irr", aux: "avoir", pp: "traduit", ps: { stem: "traduis", type: "i" },
    present: six("traduis", "traduis", "traduit", "traduisons", "traduisez", "traduisent") },
  { inf: "rire", en: "to laugh", group: "irr", aux: "avoir", pp: "ri", ps: { stem: "r", type: "i" },
    present: six("ris", "ris", "rit", "rions", "riez", "rient") },
  { inf: "sourire", en: "to smile", group: "irr", aux: "avoir", pp: "souri", ps: { stem: "sour", type: "i" },
    present: six("souris", "souris", "sourit", "sourions", "souriez", "sourient") },
  { inf: "plaire", en: "to please", group: "irr", aux: "avoir", pp: "plu", ps: { stem: "pl", type: "u" },
    present: six("plais", "plais", "plaît", "plaisons", "plaisez", "plaisent") },
  { inf: "craindre", en: "to fear", group: "irr", aux: "avoir", pp: "craint", futureStem: "craindr", ps: { stem: "craign", type: "i" },
    present: six("crains", "crains", "craint", "craignons", "craignez", "craignent") },
  { inf: "peindre", en: "to paint", group: "irr", aux: "avoir", pp: "peint", futureStem: "peindr", ps: { stem: "peign", type: "i" },
    present: six("peins", "peins", "peint", "peignons", "peignez", "peignent") },
  { inf: "joindre", en: "to join/reach", group: "irr", aux: "avoir", pp: "joint", futureStem: "joindr", ps: { stem: "joign", type: "i" },
    present: six("joins", "joins", "joint", "joignons", "joignez", "joignent") },
  { inf: "valoir", en: "to be worth", group: "irr", aux: "avoir", pp: "valu", futureStem: "vaudr", ps: { stem: "val", type: "u" },
    present: six("vaux", "vaux", "vaut", "valons", "valez", "valent"),
    subjPresent: six("vaille", "vailles", "vaille", "valions", "valiez", "vaillent") },
  { inf: "asseoir", en: "to seat", group: "irr", aux: "avoir", pp: "assis", futureStem: "assiér", ps: { stem: "ass", type: "i" },
    present: six("assieds", "assieds", "assied", "asseyons", "asseyez", "asseyent"),
    subjPresent: six("asseye", "asseyes", "asseye", "asseyions", "asseyiez", "asseyent") },
  // ----- e→è / double-consonant -er (explicit; not auto-derivable) -----
  { inf: "lever", en: "to lift/raise", group: "er", aux: "avoir", pp: "levé", futureStem: "lèver",
    present: six("lève", "lèves", "lève", "levons", "levez", "lèvent"),
    subjPresent: six("lève", "lèves", "lève", "levions", "leviez", "lèvent") },
  { inf: "mener", en: "to lead", group: "er", aux: "avoir", pp: "mené", futureStem: "mèner",
    present: six("mène", "mènes", "mène", "menons", "menez", "mènent"),
    subjPresent: six("mène", "mènes", "mène", "menions", "meniez", "mènent") },
  { inf: "jeter", en: "to throw", group: "er", aux: "avoir", pp: "jeté", futureStem: "jetter",
    present: six("jette", "jettes", "jette", "jetons", "jetez", "jettent"),
    subjPresent: six("jette", "jettes", "jette", "jetions", "jetiez", "jettent") },
  { inf: "amener", en: "to bring (someone)", group: "er", aux: "avoir", pp: "amené", futureStem: "amèner",
    present: six("amène", "amènes", "amène", "amenons", "amenez", "amènent"),
    subjPresent: six("amène", "amènes", "amène", "amenions", "ameniez", "amènent") },
  { inf: "achever", en: "to complete", group: "er", aux: "avoir", pp: "achevé", futureStem: "achèver",
    present: six("achève", "achèves", "achève", "achevons", "achevez", "achèvent"),
    subjPresent: six("achève", "achèves", "achève", "achevions", "acheviez", "achèvent") },
  { inf: "rappeler", en: "to call back/remind", group: "er", aux: "avoir", pp: "rappelé", futureStem: "rappeller",
    present: six("rappelle", "rappelles", "rappelle", "rappelons", "rappelez", "rappellent"),
    subjPresent: six("rappelle", "rappelles", "rappelle", "rappelions", "rappeliez", "rappellent") },
  { inf: "épeler", en: "to spell", group: "er", aux: "avoir", pp: "épelé", futureStem: "épeller",
    present: six("épelle", "épelles", "épelle", "épelons", "épelez", "épellent"),
    subjPresent: six("épelle", "épelles", "épelle", "épelions", "épeliez", "épellent") },
  // ----- additional irregulars present in the lexicon -----
  { inf: "promettre", en: "to promise", group: "irr", aux: "avoir", pp: "promis", ps: { stem: "prom", type: "i" },
    present: six("promets", "promets", "promet", "promettons", "promettez", "promettent") },
  { inf: "interdire", en: "to forbid", group: "irr", aux: "avoir", pp: "interdit", ps: { stem: "interd", type: "i" },
    present: six("interdis", "interdis", "interdit", "interdisons", "interdisez", "interdisent") },
  { inf: "réduire", en: "to reduce", group: "irr", aux: "avoir", pp: "réduit", ps: { stem: "réduis", type: "i" },
    present: six("réduis", "réduis", "réduit", "réduisons", "réduisez", "réduisent") },
  { inf: "atteindre", en: "to reach", group: "irr", aux: "avoir", pp: "atteint", futureStem: "atteindr", ps: { stem: "atteign", type: "i" },
    present: six("atteins", "atteins", "atteint", "atteignons", "atteignez", "atteignent") },
  { inf: "accueillir", en: "to welcome", group: "irr", aux: "avoir", pp: "accueilli", futureStem: "accueiller", ps: { stem: "accueill", type: "i" },
    present: six("accueille", "accueilles", "accueille", "accueillons", "accueillez", "accueillent") },
  { inf: "acquérir", en: "to acquire", group: "irr", aux: "avoir", pp: "acquis", futureStem: "acquerr", ps: { stem: "acqu", type: "i" },
    present: six("acquiers", "acquiers", "acquiert", "acquérons", "acquérez", "acquièrent"),
    subjPresent: six("acquière", "acquières", "acquière", "acquérions", "acquériez", "acquièrent") },
  { inf: "retenir", en: "to retain", group: "irr", aux: "avoir", pp: "retenu", futureStem: "retiendr", ps: { stem: "ret", type: "in" },
    present: six("retiens", "retiens", "retient", "retenons", "retenez", "retiennent"),
    subjPresent: six("retienne", "retiennes", "retienne", "retenions", "reteniez", "retiennent") },
  { inf: "survenir", en: "to occur", group: "irr", aux: "etre", pp: "survenu", futureStem: "surviendr", ps: { stem: "surv", type: "in" },
    present: six("surviens", "surviens", "survient", "survenons", "survenez", "surviennent"),
    subjPresent: six("survienne", "surviennes", "survienne", "survenions", "surveniez", "surviennent") },
];

// Regular verbs auto-extracted from the PFL2 lexicon + top-frequency list (see scripts/build-verbs.ts).
// Conjugated entirely by the regular -er/-ir/-re engine (incl. -ger/-cer/-yer/é→è spelling rules).
// EXTRA_VERBS is generated by scripts/build-verbs.ts (regular verbs from the lexicon +
// top-frequency list). Do not hand-edit the block below — run `npm run build:verbs`.
// <<EXTRA_VERBS_START>>
const EXTRA_VERBS: { inf: string; en: string; group: "er" | "ir" | "re"; aux: "avoir" | "etre"; pp: string }[] = [
  {
    "inf": "aborder",
    "en": "to approach",
    "group": "er",
    "aux": "avoir",
    "pp": "abordé"
  },
  {
    "inf": "accepter",
    "en": "to accept",
    "group": "er",
    "aux": "avoir",
    "pp": "accepté"
  },
  {
    "inf": "accompagner",
    "en": "to accompany",
    "group": "er",
    "aux": "avoir",
    "pp": "accompagné"
  },
  {
    "inf": "accomplir",
    "en": "to accomplish",
    "group": "ir",
    "aux": "avoir",
    "pp": "accompli"
  },
  {
    "inf": "accorder",
    "en": "to grant",
    "group": "er",
    "aux": "avoir",
    "pp": "accordé"
  },
  {
    "inf": "additionner",
    "en": "to add",
    "group": "er",
    "aux": "avoir",
    "pp": "additionné"
  },
  {
    "inf": "adresser",
    "en": "to address",
    "group": "er",
    "aux": "avoir",
    "pp": "adressé"
  },
  {
    "inf": "affecter",
    "en": "to assign",
    "group": "er",
    "aux": "avoir",
    "pp": "affecté"
  },
  {
    "inf": "affirmer",
    "en": "to assert",
    "group": "er",
    "aux": "avoir",
    "pp": "affirmé"
  },
  {
    "inf": "agir",
    "en": "to act",
    "group": "ir",
    "aux": "avoir",
    "pp": "agi"
  },
  {
    "inf": "agrandir",
    "en": "to enlarge",
    "group": "ir",
    "aux": "avoir",
    "pp": "agrandi"
  },
  {
    "inf": "ajouter",
    "en": "to add",
    "group": "er",
    "aux": "avoir",
    "pp": "ajouté"
  },
  {
    "inf": "allouer",
    "en": "to allocate",
    "group": "er",
    "aux": "avoir",
    "pp": "alloué"
  },
  {
    "inf": "amélorer",
    "en": "to improve",
    "group": "er",
    "aux": "avoir",
    "pp": "améloré"
  },
  {
    "inf": "analyser",
    "en": "to analyse",
    "group": "er",
    "aux": "avoir",
    "pp": "analysé"
  },
  {
    "inf": "annoncer",
    "en": "to announce",
    "group": "er",
    "aux": "avoir",
    "pp": "annoncé"
  },
  {
    "inf": "annuler",
    "en": "to cancel",
    "group": "er",
    "aux": "avoir",
    "pp": "annulé"
  },
  {
    "inf": "apporter",
    "en": "to bring",
    "group": "er",
    "aux": "avoir",
    "pp": "apporté"
  },
  {
    "inf": "approuver",
    "en": "to approve",
    "group": "er",
    "aux": "avoir",
    "pp": "approuvé"
  },
  {
    "inf": "appuyer",
    "en": "to press",
    "group": "er",
    "aux": "avoir",
    "pp": "appuyé"
  },
  {
    "inf": "arrêter",
    "en": "to stop",
    "group": "er",
    "aux": "avoir",
    "pp": "arrêté"
  },
  {
    "inf": "atténuer",
    "en": "to tone down",
    "group": "er",
    "aux": "avoir",
    "pp": "atténué"
  },
  {
    "inf": "atterrir",
    "en": "to land",
    "group": "ir",
    "aux": "avoir",
    "pp": "atterri"
  },
  {
    "inf": "augmenter",
    "en": "to increase",
    "group": "er",
    "aux": "avoir",
    "pp": "augmenté"
  },
  {
    "inf": "autoriser",
    "en": "to give permission for",
    "group": "er",
    "aux": "avoir",
    "pp": "autorisé"
  },
  {
    "inf": "avancer",
    "en": "to move forward",
    "group": "er",
    "aux": "avoir",
    "pp": "avancé"
  },
  {
    "inf": "avertir",
    "en": "to warn",
    "group": "ir",
    "aux": "avoir",
    "pp": "averti"
  },
  {
    "inf": "calculer",
    "en": "to calculate",
    "group": "er",
    "aux": "avoir",
    "pp": "calculé"
  },
  {
    "inf": "casser",
    "en": "to break",
    "group": "er",
    "aux": "avoir",
    "pp": "cassé"
  },
  {
    "inf": "causer",
    "en": "to cause",
    "group": "er",
    "aux": "avoir",
    "pp": "causé"
  },
  {
    "inf": "célébrer",
    "en": "to celebrate",
    "group": "er",
    "aux": "avoir",
    "pp": "célébré"
  },
  {
    "inf": "chanter",
    "en": "to sing",
    "group": "er",
    "aux": "avoir",
    "pp": "chanté"
  },
  {
    "inf": "circuler",
    "en": "to circulate",
    "group": "er",
    "aux": "avoir",
    "pp": "circulé"
  },
  {
    "inf": "clair",
    "en": "clear",
    "group": "ir",
    "aux": "avoir",
    "pp": "clai"
  },
  {
    "inf": "clarifier",
    "en": "to clarify",
    "group": "er",
    "aux": "avoir",
    "pp": "clarifié"
  },
  {
    "inf": "classer",
    "en": "to file",
    "group": "er",
    "aux": "avoir",
    "pp": "classé"
  },
  {
    "inf": "clavier",
    "en": "keyboard",
    "group": "er",
    "aux": "avoir",
    "pp": "clavié"
  },
  {
    "inf": "cliquer",
    "en": "to click",
    "group": "er",
    "aux": "avoir",
    "pp": "cliqué"
  },
  {
    "inf": "coller",
    "en": "to paste",
    "group": "er",
    "aux": "avoir",
    "pp": "collé"
  },
  {
    "inf": "commander",
    "en": "to order",
    "group": "er",
    "aux": "avoir",
    "pp": "commandé"
  },
  {
    "inf": "comparer",
    "en": "to compare",
    "group": "er",
    "aux": "avoir",
    "pp": "comparé"
  },
  {
    "inf": "compiler",
    "en": "to compile",
    "group": "er",
    "aux": "avoir",
    "pp": "compilé"
  },
  {
    "inf": "compléter",
    "en": "to complete",
    "group": "er",
    "aux": "avoir",
    "pp": "complété"
  },
  {
    "inf": "compter",
    "en": "to intend",
    "group": "er",
    "aux": "avoir",
    "pp": "compté"
  },
  {
    "inf": "confier",
    "en": "to assign",
    "group": "er",
    "aux": "avoir",
    "pp": "confié"
  },
  {
    "inf": "conjuguer",
    "en": "to conjugate",
    "group": "er",
    "aux": "avoir",
    "pp": "conjugué"
  },
  {
    "inf": "conseiller",
    "en": "to advise",
    "group": "er",
    "aux": "avoir",
    "pp": "conseillé"
  },
  {
    "inf": "considérer",
    "en": "to consider",
    "group": "er",
    "aux": "avoir",
    "pp": "considéré"
  },
  {
    "inf": "convoquer",
    "en": "to call",
    "group": "er",
    "aux": "avoir",
    "pp": "convoqué"
  },
  {
    "inf": "coordonner",
    "en": "to coordinate",
    "group": "er",
    "aux": "avoir",
    "pp": "coordonné"
  },
  {
    "inf": "copier",
    "en": "to copy",
    "group": "er",
    "aux": "avoir",
    "pp": "copié"
  },
  {
    "inf": "corriger",
    "en": "to correct",
    "group": "er",
    "aux": "avoir",
    "pp": "corrigé"
  },
  {
    "inf": "couloir",
    "en": "corridor",
    "group": "ir",
    "aux": "avoir",
    "pp": "couloi"
  },
  {
    "inf": "couper",
    "en": "to cut",
    "group": "er",
    "aux": "avoir",
    "pp": "coupé"
  },
  {
    "inf": "courrier",
    "en": "mail",
    "group": "er",
    "aux": "avoir",
    "pp": "courrié"
  },
  {
    "inf": "créer",
    "en": "to create",
    "group": "er",
    "aux": "avoir",
    "pp": "créé"
  },
  {
    "inf": "cuir",
    "en": "leather",
    "group": "ir",
    "aux": "avoir",
    "pp": "cui"
  },
  {
    "inf": "danser",
    "en": "to dance",
    "group": "er",
    "aux": "avoir",
    "pp": "dansé"
  },
  {
    "inf": "déboguer",
    "en": "to debug",
    "group": "er",
    "aux": "avoir",
    "pp": "débogué"
  },
  {
    "inf": "décider",
    "en": "to decide to",
    "group": "er",
    "aux": "avoir",
    "pp": "décidé"
  },
  {
    "inf": "déclarer",
    "en": "to declare",
    "group": "er",
    "aux": "avoir",
    "pp": "déclaré"
  },
  {
    "inf": "décrocher",
    "en": "to get",
    "group": "er",
    "aux": "avoir",
    "pp": "décroché"
  },
  {
    "inf": "défendre",
    "en": "to forbid",
    "group": "re",
    "aux": "avoir",
    "pp": "défendu"
  },
  {
    "inf": "définir",
    "en": "to define",
    "group": "ir",
    "aux": "avoir",
    "pp": "défini"
  },
  {
    "inf": "dépenser",
    "en": "to spend",
    "group": "er",
    "aux": "avoir",
    "pp": "dépensé"
  },
  {
    "inf": "déplacer",
    "en": "to move",
    "group": "er",
    "aux": "avoir",
    "pp": "déplacé"
  },
  {
    "inf": "déranger",
    "en": "to disturb",
    "group": "er",
    "aux": "avoir",
    "pp": "dérangé"
  },
  {
    "inf": "dernier",
    "en": "last",
    "group": "er",
    "aux": "avoir",
    "pp": "dernié"
  },
  {
    "inf": "désirer",
    "en": "to wish",
    "group": "er",
    "aux": "avoir",
    "pp": "désiré"
  },
  {
    "inf": "diffuser",
    "en": "to broadcast",
    "group": "er",
    "aux": "avoir",
    "pp": "diffusé"
  },
  {
    "inf": "dîner",
    "en": "to dine",
    "group": "er",
    "aux": "avoir",
    "pp": "dîné"
  },
  {
    "inf": "diriger",
    "en": "to manage",
    "group": "er",
    "aux": "avoir",
    "pp": "dirigé"
  },
  {
    "inf": "discuter",
    "en": "to discuss",
    "group": "er",
    "aux": "avoir",
    "pp": "discuté"
  },
  {
    "inf": "distribuer",
    "en": "to distribute",
    "group": "er",
    "aux": "avoir",
    "pp": "distribué"
  },
  {
    "inf": "diviser",
    "en": "to separate",
    "group": "er",
    "aux": "avoir",
    "pp": "divisé"
  },
  {
    "inf": "douter",
    "en": "to doubt",
    "group": "er",
    "aux": "avoir",
    "pp": "douté"
  },
  {
    "inf": "durer",
    "en": "to last",
    "group": "er",
    "aux": "avoir",
    "pp": "duré"
  },
  {
    "inf": "échouer",
    "en": "to fail",
    "group": "er",
    "aux": "avoir",
    "pp": "échoué"
  },
  {
    "inf": "empêcher",
    "en": "to stop",
    "group": "er",
    "aux": "avoir",
    "pp": "empêché"
  },
  {
    "inf": "employer",
    "en": "to use/employ",
    "group": "er",
    "aux": "avoir",
    "pp": "employé"
  },
  {
    "inf": "empocher",
    "en": "to pocket",
    "group": "er",
    "aux": "avoir",
    "pp": "empoché"
  },
  {
    "inf": "engager",
    "en": "to hire",
    "group": "er",
    "aux": "avoir",
    "pp": "engagé"
  },
  {
    "inf": "ennuyer",
    "en": "to bore",
    "group": "er",
    "aux": "avoir",
    "pp": "ennuyé"
  },
  {
    "inf": "envisager",
    "en": "to think about",
    "group": "er",
    "aux": "avoir",
    "pp": "envisagé"
  },
  {
    "inf": "espérer",
    "en": "to hope",
    "group": "er",
    "aux": "avoir",
    "pp": "espéré"
  },
  {
    "inf": "espoir",
    "en": "hope",
    "group": "ir",
    "aux": "avoir",
    "pp": "espoi"
  },
  {
    "inf": "essayer",
    "en": "to try",
    "group": "er",
    "aux": "avoir",
    "pp": "essayé"
  },
  {
    "inf": "établir",
    "en": "to establish",
    "group": "ir",
    "aux": "avoir",
    "pp": "établi"
  },
  {
    "inf": "éviter",
    "en": "to avoid",
    "group": "er",
    "aux": "avoir",
    "pp": "évité"
  },
  {
    "inf": "excuser",
    "en": "to excuse",
    "group": "er",
    "aux": "avoir",
    "pp": "excusé"
  },
  {
    "inf": "exiger",
    "en": "to demand",
    "group": "er",
    "aux": "avoir",
    "pp": "exigé"
  },
  {
    "inf": "exister",
    "en": "to exist",
    "group": "er",
    "aux": "avoir",
    "pp": "existé"
  },
  {
    "inf": "falloir",
    "en": "to have to",
    "group": "ir",
    "aux": "avoir",
    "pp": "falloi"
  },
  {
    "inf": "fermer",
    "en": "to close",
    "group": "er",
    "aux": "avoir",
    "pp": "fermé"
  },
  {
    "inf": "février",
    "en": "February",
    "group": "er",
    "aux": "avoir",
    "pp": "févrié"
  },
  {
    "inf": "fonctionner",
    "en": "to work/function",
    "group": "er",
    "aux": "avoir",
    "pp": "fonctionné"
  },
  {
    "inf": "fondre",
    "en": "to melt",
    "group": "re",
    "aux": "avoir",
    "pp": "fondu"
  },
  {
    "inf": "former",
    "en": "to train/form",
    "group": "er",
    "aux": "avoir",
    "pp": "formé"
  },
  {
    "inf": "formuler",
    "en": "phrase",
    "group": "er",
    "aux": "avoir",
    "pp": "formulé"
  },
  {
    "inf": "fournir",
    "en": "to provide",
    "group": "ir",
    "aux": "avoir",
    "pp": "fourni"
  },
  {
    "inf": "garder",
    "en": "to keep",
    "group": "er",
    "aux": "avoir",
    "pp": "gardé"
  },
  {
    "inf": "hésiter",
    "en": "to hesitate",
    "group": "er",
    "aux": "avoir",
    "pp": "hésité"
  },
  {
    "inf": "hier",
    "en": "yesterday",
    "group": "er",
    "aux": "avoir",
    "pp": "hié"
  },
  {
    "inf": "hiver",
    "en": "winter",
    "group": "er",
    "aux": "avoir",
    "pp": "hivé"
  },
  {
    "inf": "importer",
    "en": "to matter",
    "group": "er",
    "aux": "avoir",
    "pp": "importé"
  },
  {
    "inf": "indiquer",
    "en": "to indicate",
    "group": "er",
    "aux": "avoir",
    "pp": "indiqué"
  },
  {
    "inf": "insister",
    "en": "to insist",
    "group": "er",
    "aux": "avoir",
    "pp": "insisté"
  },
  {
    "inf": "inviter",
    "en": "to invite",
    "group": "er",
    "aux": "avoir",
    "pp": "invité"
  },
  {
    "inf": "janvier",
    "en": "January",
    "group": "er",
    "aux": "avoir",
    "pp": "janvié"
  },
  {
    "inf": "laisser",
    "en": "to let",
    "group": "er",
    "aux": "avoir",
    "pp": "laissé"
  },
  {
    "inf": "lancer",
    "en": "to throw/launch",
    "group": "er",
    "aux": "avoir",
    "pp": "lancé"
  },
  {
    "inf": "manquer",
    "en": "to be missing",
    "group": "er",
    "aux": "avoir",
    "pp": "manqué"
  },
  {
    "inf": "marcher",
    "en": "to walk",
    "group": "er",
    "aux": "avoir",
    "pp": "marché"
  },
  {
    "inf": "mélanger",
    "en": "to mix",
    "group": "er",
    "aux": "avoir",
    "pp": "mélangé"
  },
  {
    "inf": "mériter",
    "en": "to deserve",
    "group": "er",
    "aux": "avoir",
    "pp": "mérité"
  },
  {
    "inf": "mordre",
    "en": "to bite",
    "group": "re",
    "aux": "avoir",
    "pp": "mordu"
  },
  {
    "inf": "nettoyer",
    "en": "to clean",
    "group": "er",
    "aux": "avoir",
    "pp": "nettoyé"
  },
  {
    "inf": "noter",
    "en": "to note",
    "group": "er",
    "aux": "avoir",
    "pp": "noté"
  },
  {
    "inf": "nourrir",
    "en": "to feed",
    "group": "ir",
    "aux": "avoir",
    "pp": "nourri"
  },
  {
    "inf": "occuper",
    "en": "to occupy",
    "group": "er",
    "aux": "avoir",
    "pp": "occupé"
  },
  {
    "inf": "opter",
    "en": "to opt",
    "group": "er",
    "aux": "avoir",
    "pp": "opté"
  },
  {
    "inf": "oser",
    "en": "to dare",
    "group": "er",
    "aux": "avoir",
    "pp": "osé"
  },
  {
    "inf": "partager",
    "en": "to divide",
    "group": "er",
    "aux": "avoir",
    "pp": "partagé"
  },
  {
    "inf": "passer",
    "en": "to pass",
    "group": "er",
    "aux": "avoir",
    "pp": "passé"
  },
  {
    "inf": "postuler",
    "en": "to apply for",
    "group": "er",
    "aux": "avoir",
    "pp": "postulé"
  },
  {
    "inf": "prolonger",
    "en": "to prolong",
    "group": "er",
    "aux": "avoir",
    "pp": "prolongé"
  },
  {
    "inf": "prononcer",
    "en": "to pronounce",
    "group": "er",
    "aux": "avoir",
    "pp": "prononcé"
  },
  {
    "inf": "proposer",
    "en": "to propose",
    "group": "er",
    "aux": "avoir",
    "pp": "proposé"
  },
  {
    "inf": "quêter",
    "en": "to beg for",
    "group": "er",
    "aux": "avoir",
    "pp": "quêté"
  },
  {
    "inf": "quitter",
    "en": "to leave",
    "group": "er",
    "aux": "avoir",
    "pp": "quitté"
  },
  {
    "inf": "raccourcir",
    "en": "to shorten",
    "group": "ir",
    "aux": "avoir",
    "pp": "raccourci"
  },
  {
    "inf": "raconter",
    "en": "to tell",
    "group": "er",
    "aux": "avoir",
    "pp": "raconté"
  },
  {
    "inf": "ralentir",
    "en": "to slow down",
    "group": "ir",
    "aux": "avoir",
    "pp": "ralenti"
  },
  {
    "inf": "ranger",
    "en": "to tidy",
    "group": "er",
    "aux": "avoir",
    "pp": "rangé"
  },
  {
    "inf": "réagir",
    "en": "to react",
    "group": "ir",
    "aux": "avoir",
    "pp": "réagi"
  },
  {
    "inf": "rectifier",
    "en": "to rectify",
    "group": "er",
    "aux": "avoir",
    "pp": "rectifié"
  },
  {
    "inf": "refuser",
    "en": "to refuse",
    "group": "er",
    "aux": "avoir",
    "pp": "refusé"
  },
  {
    "inf": "remplacer",
    "en": "to replace",
    "group": "er",
    "aux": "avoir",
    "pp": "remplacé"
  },
  {
    "inf": "répandre",
    "en": "to spread",
    "group": "re",
    "aux": "avoir",
    "pp": "répandu"
  },
  {
    "inf": "répéter",
    "en": "to repeat",
    "group": "er",
    "aux": "avoir",
    "pp": "répété"
  },
  {
    "inf": "réserver",
    "en": "to reserve",
    "group": "er",
    "aux": "avoir",
    "pp": "réservé"
  },
  {
    "inf": "respecter",
    "en": "to respect",
    "group": "er",
    "aux": "avoir",
    "pp": "respecté"
  },
  {
    "inf": "retrouver",
    "en": "to find again",
    "group": "er",
    "aux": "avoir",
    "pp": "retrouvé"
  },
  {
    "inf": "risquer",
    "en": "to risk",
    "group": "er",
    "aux": "avoir",
    "pp": "risqué"
  },
  {
    "inf": "saisir",
    "en": "to grasp",
    "group": "ir",
    "aux": "avoir",
    "pp": "saisi"
  },
  {
    "inf": "sauter",
    "en": "to jump",
    "group": "er",
    "aux": "avoir",
    "pp": "sauté"
  },
  {
    "inf": "sélectionner",
    "en": "to select",
    "group": "er",
    "aux": "avoir",
    "pp": "sélectionné"
  },
  {
    "inf": "sembler",
    "en": "to seem",
    "group": "er",
    "aux": "avoir",
    "pp": "semblé"
  },
  {
    "inf": "signer",
    "en": "to sign",
    "group": "er",
    "aux": "avoir",
    "pp": "signé"
  },
  {
    "inf": "simplifier",
    "en": "to simplify",
    "group": "er",
    "aux": "avoir",
    "pp": "simplifié"
  },
  {
    "inf": "souhaiter",
    "en": "to hope",
    "group": "er",
    "aux": "avoir",
    "pp": "souhaité"
  },
  {
    "inf": "terminer",
    "en": "to finish",
    "group": "er",
    "aux": "avoir",
    "pp": "terminé"
  },
  {
    "inf": "tirer",
    "en": "to pull",
    "group": "er",
    "aux": "avoir",
    "pp": "tiré"
  },
  {
    "inf": "tondre",
    "en": "to mow",
    "group": "re",
    "aux": "avoir",
    "pp": "tondu"
  },
  {
    "inf": "tourner",
    "en": "to turn",
    "group": "er",
    "aux": "avoir",
    "pp": "tourné"
  },
  {
    "inf": "traiter",
    "en": "to treat/process",
    "group": "er",
    "aux": "avoir",
    "pp": "traité"
  },
  {
    "inf": "utiliser",
    "en": "to use",
    "group": "er",
    "aux": "avoir",
    "pp": "utilisé"
  },
  {
    "inf": "voyager",
    "en": "to travel",
    "group": "er",
    "aux": "avoir",
    "pp": "voyagé"
  }
];
// <<EXTRA_VERBS_END>>
const CURATED_INF = new Set(VERBS_CURATED.map((v) => v.inf));
export const VERBS: Verb[] = [
  ...VERBS_CURATED,
  ...EXTRA_VERBS.filter((e) => !CURATED_INF.has(e.inf)),
].sort((a, b) => a.inf.localeCompare(b.inf, "fr"));

export function findVerb(inf: string): Verb | undefined {
  return VERBS.find((v) => v.inf === inf);
}

const ELIDE = /^[aeiouhéèê]/i;
function applyJe(form: string, person: PersonKey): string {
  if (person === "je" && ELIDE.test(form)) return "j’" + form;
  return (person === "je" ? "je " : "") + form;
}

// ---- regular -er spelling-change detection (deterministic sub-patterns) ----
const endsGer = (inf: string) => inf.endsWith("ger");
const endsCer = (inf: string) => inf.endsWith("cer");
const endsYer = (inf: string) => /yer$/.test(inf);
// é→è before a silent ending (préférer→préfère, répéter→répète, protéger→protège); not -éer (créer)
const eAccent = (inf: string) => /é[bcdfghjklmnpqrstvwxz]+er$/.test(inf);
// change the last "é" of a stem to "è"
const grave = (stem: string) => { const i = stem.lastIndexOf("é"); return i < 0 ? stem : stem.slice(0, i) + "è" + stem.slice(i + 1); };

function regularPresent(v: Verb): Record<PersonKey, string> {
  const r = v.inf.slice(0, -2);
  if (v.group === "ir") return six(r + "is", r + "is", r + "it", r + "issons", r + "issez", r + "issent");
  if (v.group === "re") return six(r + "s", r + "s", r, r + "ons", r + "ez", r + "ent");
  // -er, with -ger/-cer/-yer/é→è handled automatically
  let sg = r;                                   // stem for je/tu/il/ils
  if (eAccent(v.inf)) sg = grave(r);
  if (endsYer(v.inf)) sg = r.slice(0, -1) + "i"; // pay→pai, emploi
  let nous = r + "ons";
  if (endsGer(v.inf)) nous = r + "eons";
  else if (endsCer(v.inf)) nous = r.slice(0, -1) + "çons";
  return six(sg + "e", sg + "es", sg + "e", nous, r + "ez", sg + "ent");
}

function presentForms(v: Verb): Record<PersonKey, string> {
  return v.present ?? regularPresent(v);
}

function imparfaitForms(v: Verb): Record<PersonKey, string> {
  if (v.inf === "être") return six("étais", "étais", "était", "étions", "étiez", "étaient");
  const soft = presentForms(v).nous.replace(/ons$/, "");            // -ais/-ait/-aient keep ge/ç
  const ni = endsGer(v.inf) || endsCer(v.inf) ? v.inf.slice(0, -2) : soft; // -ions/-iez revert to g/c
  return six(soft + "ais", soft + "ais", soft + "ait", ni + "ions", ni + "iez", soft + "aient");
}

function futureStem(v: Verb): string {
  if (v.futureStem) return v.futureStem;
  if (endsYer(v.inf)) return v.inf.slice(0, -3) + "ier"; // payer→paier, employer→emploier
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
  // je/tu/il/ils from the ils-present stem; nous/vous from the nous-present stem (handles
  // stem-changing verbs and -ger/-cer/-yer/é→è automatically)
  const pres = presentForms(v);
  const ilsStem = pres.ils.replace(/ent$/, "");
  const nousStem = endsGer(v.inf) || endsCer(v.inf) ? v.inf.slice(0, -2) : pres.nous.replace(/ons$/, "");
  return six(ilsStem + "e", ilsStem + "es", ilsStem + "e", nousStem + "ions", nousStem + "iez", ilsStem + "ent");
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
  if (v.group === "er") {
    if (endsGer(v.inf)) return six(r + "eai", r + "eas", r + "ea", r + "eâmes", r + "eâtes", r + "èrent");
    if (endsCer(v.inf)) { const c = r.slice(0, -1); return six(c + "çai", c + "ças", c + "ça", c + "çâmes", c + "çâtes", r + "èrent"); }
    return six(r + "ai", r + "as", r + "a", r + "âmes", r + "âtes", r + "èrent");
  }
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
