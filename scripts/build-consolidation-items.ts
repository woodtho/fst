/**
 * build-consolidation-items.ts
 * The consolidation booklets (SC102-2/47-*) were extracted as 22 whole activities that are
 * `gradeable: false` — rich integrative review, but unusable in the consolidation quiz. This
 * script turns the cleanest sub-items of those activities (with their answer keys) into atomic,
 * gradeable fill-in questions and writes them into the `items` array of
 * content/supplements/consolidation-questions.json, so the consolidation session can actually
 * test the booklet's own review content. Idempotent.
 *
 * Run: node --experimental-strip-types scripts/build-consolidation-items.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = join(ROOT, "content", "supplements", "consolidation-questions.json");
const data = JSON.parse(readFileSync(p, "utf8"));

type C = {
  booklet: number; ofRange: [number, number]; act: number; concept: string;
  diff: "easy" | "medium" | "advanced"; fr: string; answer: string[]; why: string; rule: string; tip: string;
};

const Q: C[] = [
  // ───── Consolidation 1 (OF 1–12): présent, gérondif, prépositions de lieu, futur ─────
  { booklet: 1, ofRange: [1, 12], act: 2, concept: "present", diff: "easy", fr: "Mettez au pluriel : « Je réfléchis » → « Nous ___ ».", answer: ["réfléchissons"], why: "« réfléchir » (2e groupe) à « nous » → réfléchissons.", rule: "Verbes en -ir (2e groupe) : nous -issons.", tip: "nous finissons, nous réfléchissons." },
  { booklet: 1, ofRange: [1, 12], act: 2, concept: "present", diff: "easy", fr: "Mettez au pluriel : « Tu peux » → « Vous ___ ».", answer: ["pouvez"], why: "« pouvoir » à « vous » → vous pouvez.", rule: "pouvoir : je peux, vous pouvez.", tip: "vous pouvez, vous voulez." },
  { booklet: 1, ofRange: [1, 12], act: 2, concept: "present", diff: "medium", fr: "Mettez au singulier : « Ils comprennent » → « Il ___ ».", answer: ["comprend"], why: "« comprendre » à « il » → il comprend.", rule: "prendre/comprendre : il prend, il comprend.", tip: "il prend, il comprend." },
  { booklet: 1, ofRange: [1, 12], act: 4, concept: "present", diff: "easy", fr: "Complétez au présent : « Qu'est-ce que vous ___ (faire) en camping? »", answer: ["faites"], why: "« faire » à « vous » → vous faites (irrégulier).", rule: "faire : vous faites (pas « faisez »).", tip: "vous faites, vous dites." },
  { booklet: 1, ofRange: [1, 12], act: 4, concept: "gerondif", diff: "medium", fr: "Complétez au gérondif : « J'aime marcher dans le bois en ___ (observer) les oiseaux. »", answer: ["observant"], why: "Le gérondif = en + participe présent : en observant.", rule: "Gérondif : en + radical + -ant.", tip: "en observant, en mangeant." },
  { booklet: 1, ofRange: [1, 12], act: 4, concept: "gerondif", diff: "advanced", fr: "Complétez au gérondif : « …et en ___ (réfléchir) à mes projets. »", answer: ["réfléchissant"], why: "Gérondif de « réfléchir » : en réfléchissant (radical du « nous »).", rule: "Gérondif : on part du radical de « nous » + -ant.", tip: "nous réfléchissons → en réfléchissant." },
  { booklet: 1, ofRange: [1, 12], act: 30, concept: "prepositions", diff: "easy", fr: "Insérez la préposition : « On peut aller de Montréal ___ Québec en trois heures. »", answer: ["à"], why: "Aller à + ville : de Montréal à Québec.", rule: "aller à + ville.", tip: "aller à Québec, à Ottawa." },
  { booklet: 1, ofRange: [1, 12], act: 30, concept: "prepositions", diff: "medium", fr: "Insérez l'expression de lieu : « Il y a un bon restaurant ___ la rue. » (at the corner of)", answer: ["au coin de"], why: "« au coin de » = at the corner of.", rule: "expressions de localisation : au coin de.", tip: "au coin de la rue." },
  { booklet: 1, ofRange: [1, 12], act: 30, concept: "prepositions", diff: "medium", fr: "Insérez la préposition : « Sais-tu que Louis va ___ Alberta pour ses vacances? »", answer: ["en"], why: "Provinces féminines → en : en Alberta, en Ontario.", rule: "en + province/région féminine.", tip: "en Alberta, au Québec (masc.)." },
  { booklet: 1, ofRange: [1, 12], act: 30, concept: "prepositions", diff: "easy", fr: "Insérez la préposition : « ___ les deux maisons, il y a un immense jardin. » (between)", answer: ["entre"], why: "« entre » = between.", rule: "entre A et B.", tip: "entre les deux maisons." },
  { booklet: 1, ofRange: [1, 12], act: 30, concept: "prepositions", diff: "medium", fr: "Insérez l'expression de lieu : « Je vais m'asseoir ___ la porte. » (near)", answer: ["près de"], why: "« près de » = near.", rule: "près de + lieu.", tip: "près de la porte." },
  { booklet: 1, ofRange: [1, 12], act: 12, concept: "futur_proche", diff: "advanced", fr: "Futur proche + pronom objet : « As-tu rencontré la consultante? – Non, mais je vais ___ en fin de journée. »", answer: ["la rencontrer"], why: "Le pronom objet précède l'infinitif : je vais la rencontrer.", rule: "Futur proche : aller + (pronom) + infinitif.", tip: "je vais la rencontrer." },

  // ───── Consolidation 2 (OF 13–22): comparatifs, conditionnel, mieux/meilleur, futur proche, PC/imparfait ─────
  { booklet: 2, ofRange: [13, 22], act: 6, concept: "comparatives", diff: "medium", fr: "Comparatif d'égalité : « Mon mécanicien est ___ compétent que celui de Jacques. »", answer: ["aussi"], why: "Égalité avec un adjectif : aussi … que.", rule: "aussi + adjectif + que = égalité.", tip: "aussi compétent que." },
  { booklet: 2, ofRange: [13, 22], act: 6, concept: "comparatives", diff: "medium", fr: "Comparatif de supériorité : « Le texte français contient ___ mots que le texte anglais. » (more)", answer: ["plus de"], why: "Devant un nom : plus de … que.", rule: "plus de + nom + que.", tip: "plus de mots que." },
  { booklet: 2, ofRange: [13, 22], act: 6, concept: "comparatives", diff: "easy", fr: "Comparatif d'infériorité : « J'aime ___ le tofu que le gâteau aux carottes. » (less)", answer: ["moins"], why: "Infériorité avec un verbe : aimer moins … que.", rule: "moins … que = infériorité.", tip: "j'aime moins … que." },
  { booklet: 2, ofRange: [13, 22], act: 18, concept: "conditionnel", diff: "medium", fr: "Mettez au conditionnel présent : « Vous ___ (devoir) consulter un médecin. »", answer: ["devriez"], why: "Conseil → conditionnel : vous devriez.", rule: "devoir au conditionnel = conseil (should).", tip: "vous devriez = you should." },
  { booklet: 2, ofRange: [13, 22], act: 18, concept: "conditionnel", diff: "medium", fr: "Mettez au conditionnel présent : « ___-vous (pouvoir) me rendre un service? »", answer: ["Pourriez"], why: "Demande polie → conditionnel : Pourriez-vous.", rule: "pouvoir au conditionnel = demande polie.", tip: "Pourriez-vous…?" },
  { booklet: 2, ofRange: [13, 22], act: 18, concept: "conditionnel", diff: "advanced", fr: "Mettez au conditionnel présent : « Il ___ (falloir) organiser quelque chose pour le départ de Michel. »", answer: ["faudrait"], why: "« falloir » au conditionnel → il faudrait.", rule: "il faut → il faudrait (conditionnel).", tip: "il faudrait = we should / it would be necessary." },
  { booklet: 2, ofRange: [13, 22], act: 20, concept: "comparatives", diff: "medium", fr: "Choisissez mieux ou meilleur : « La ___ façon de faire ce travail, c'est de commencer par la fin. »", answer: ["meilleure"], why: "« façon » est un nom → adjectif « meilleure ».", rule: "meilleur(e) = adjectif (modifie un nom).", tip: "la meilleure façon." },
  { booklet: 2, ofRange: [13, 22], act: 20, concept: "comparatives", diff: "medium", fr: "Choisissez mieux ou meilleur : « Il joue du violon ___ que moi. »", answer: ["mieux"], why: "« joue » est un verbe → adverbe « mieux ».", rule: "mieux = adverbe (modifie un verbe).", tip: "il joue mieux que moi." },
  { booklet: 2, ofRange: [13, 22], act: 20, concept: "comparatives", diff: "easy", fr: "Choisissez mieux ou meilleur : « Aujourd'hui, ça va beaucoup ___ qu'hier. »", answer: ["mieux"], why: "« ça va » (verbe) → mieux.", rule: "aller mieux = to be/feel better.", tip: "ça va mieux." },
  { booklet: 2, ofRange: [13, 22], act: 25, concept: "futur_proche", diff: "easy", fr: "Mettez au futur proche : « Est-ce que tu ___ t'excuser? »", answer: ["vas"], why: "Futur proche = aller (présent) + infinitif : tu vas t'excuser.", rule: "Futur proche : aller + infinitif.", tip: "tu vas t'excuser." },
  { booklet: 2, ofRange: [13, 22], act: 28, concept: "imparfait", diff: "medium", fr: "Imparfait ou passé composé : « Dans ce temps-là, je ___ beaucoup pour le travail. » (voyager)", answer: ["voyageais"], why: "Habitude passée (dans ce temps-là) → imparfait : je voyageais.", rule: "Habitude/décor passé → imparfait.", tip: "dans ce temps-là → imparfait." },
  { booklet: 2, ofRange: [13, 22], act: 28, concept: "passe_compose", diff: "advanced", fr: "Imparfait ou passé composé : « Un bon jour, je ___ donner une conférence à Calgary. » (aller)", answer: ["suis allée", "suis allé"], why: "Événement ponctuel (un bon jour) → passé composé : je suis allée.", rule: "Action ponctuelle datée → passé composé.", tip: "un bon jour → passé composé." },
  { booklet: 2, ofRange: [13, 22], act: 30, concept: "passe_compose", diff: "advanced", fr: "Passé composé (verbe pronominal) : « En fin de semaine, je ___ une nouvelle voiture. » (s'acheter, je)", answer: ["me suis acheté", "me suis achetée"], why: "Verbe pronominal → être : je me suis acheté une voiture.", rule: "Verbes pronominaux → auxiliaire être.", tip: "je me suis acheté…" },

  // ───── Consolidation 3 (OF 23–32): temps, pronoms relatifs, ce qui/que/dont, subjonctif, style indirect ─────
  { booklet: 3, ofRange: [23, 32], act: 12, concept: "time_expressions", diff: "medium", fr: "Expression de temps : « Je ne travaille plus dans cette division ___ deux ans. »", answer: ["depuis"], why: "Point de départ d'une situation actuelle → depuis.", rule: "depuis + durée (action qui continue).", tip: "depuis deux ans." },
  { booklet: 3, ofRange: [23, 32], act: 12, concept: "time_expressions", diff: "medium", fr: "Expression de temps : « On va partir ___ trois semaines à Cuba. »", answer: ["pour"], why: "Durée prévue d'un séjour → pour.", rule: "pour + durée prévue (futur).", tip: "partir pour trois semaines." },
  { booklet: 3, ofRange: [23, 32], act: 12, concept: "time_expressions", diff: "advanced", fr: "Expression de temps : « Le téléphone a sonné ___ elle regardait la télévision. »", answer: ["pendant que"], why: "Deux actions simultanées (une en cours) → pendant que.", rule: "pendant que + proposition (simultanéité).", tip: "pendant qu'elle regardait…" },
  { booklet: 3, ofRange: [23, 32], act: 12, concept: "time_expressions", diff: "advanced", fr: "Expression de temps : « ___ j'ai rencontré l'agent de dotation, j'ai déjà le nom de quatre candidats. »", answer: ["depuis que"], why: "Point de départ + proposition → depuis que.", rule: "depuis que + proposition.", tip: "depuis que + sujet + verbe." },
  { booklet: 3, ofRange: [23, 32], act: 24, concept: "relative_pronouns", diff: "medium", fr: "Pronom relatif : « Le dictionnaire ___ tu veux est sur la table. »", answer: ["que"], why: "COD du verbe « veux » → que.", rule: "que = complément d'objet direct.", tip: "le livre que je lis." },
  { booklet: 3, ofRange: [23, 32], act: 24, concept: "relative_pronouns", diff: "medium", fr: "Pronom relatif : « Il s'agit d'une grande salle ___ on peut recevoir une centaine de délégués. »", answer: ["où"], why: "Complément de lieu → où.", rule: "où = lieu (ou temps).", tip: "la salle où on travaille." },
  { booklet: 3, ofRange: [23, 32], act: 24, concept: "relative_pronouns", diff: "advanced", fr: "Pronom relatif : « Je travaille avec une équipe de quatre personnes ___ je suis responsable. »", answer: ["dont"], why: "« responsable DE » → dont remplace « de + nom ».", rule: "dont = de + antécédent.", tip: "responsable de → dont." },
  { booklet: 3, ofRange: [23, 32], act: 26, concept: "relative_pronouns", diff: "advanced", fr: "ce qui / ce que / ce dont : « Tu as pensé à apporter un dictionnaire. C'est exactement ___ j'avais besoin. »", answer: ["ce dont"], why: "« avoir besoin DE » → ce dont.", rule: "ce dont = ce + de.", tip: "avoir besoin de → ce dont." },
  { booklet: 3, ofRange: [23, 32], act: 26, concept: "relative_pronouns", diff: "medium", fr: "ce qui / ce que / ce dont : « Moi, ___ je préfère, c'est le gâteau au chocolat. »", answer: ["ce que"], why: "COD de « préfère » → ce que.", rule: "ce que = ce + COD.", tip: "ce que je préfère." },
  { booklet: 3, ofRange: [23, 32], act: 26, concept: "relative_pronouns", diff: "medium", fr: "ce qui / ce que / ce dont : « Voilà ___ faisait du bruit : il y avait un dollar dans la laveuse. »", answer: ["ce qui"], why: "Sujet de « faisait » → ce qui.", rule: "ce qui = ce + sujet.", tip: "ce qui se passe." },
  { booklet: 3, ofRange: [23, 32], act: 35, concept: "subjonctif", diff: "advanced", fr: "Mettez au subjonctif présent : « Il faut que je ___ (prendre) une décision. »", answer: ["prenne"], why: "Subjonctif de « prendre » à « je » → que je prenne.", rule: "il faut que + subjonctif.", tip: "que je prenne." },
  { booklet: 3, ofRange: [23, 32], act: 35, concept: "subjonctif", diff: "advanced", fr: "Mettez au subjonctif présent : « Il faut qu'on ___ (faire) attention. »", answer: ["fasse"], why: "Subjonctif de « faire » → qu'on fasse.", rule: "faire → que je fasse (subjonctif irrégulier).", tip: "qu'on fasse." },
  { booklet: 3, ofRange: [23, 32], act: 35, concept: "subjonctif", diff: "medium", fr: "Mettez au subjonctif présent : « Il faut que tu ___ (être) à l'heure. »", answer: ["sois"], why: "Subjonctif de « être » à « tu » → que tu sois.", rule: "être → que je sois, que tu sois (irrégulier).", tip: "que tu sois." },
  { booklet: 3, ofRange: [23, 32], act: 42, concept: "reported_speech", diff: "advanced", fr: "Style indirect : « J'ai terminé le rapport. » → Il m'a dit qu'il ___ le rapport.", answer: ["avait terminé"], why: "Passé composé → plus-que-parfait au style indirect passé.", rule: "Style indirect passé : passé composé → plus-que-parfait.", tip: "il a dit qu'il avait terminé." },
  { booklet: 3, ofRange: [23, 32], act: 42, concept: "reported_speech", diff: "medium", fr: "Style indirect (question fermée) : « Peux-tu me rencontrer demain? » → Il nous a demandé ___ on pouvait le rencontrer.", answer: ["si"], why: "Question fermée rapportée → si.", rule: "Question oui/non → si.", tip: "il a demandé si…" },

  // ───── Consolidation 4 (OF 33–40): faire causatif ─────
  { booklet: 4, ofRange: [33, 40], act: 20, concept: "causative", diff: "medium", fr: "Faire causatif : « Je ne tonds pas le gazon moi-même; je le fais ___ par mon voisin. »", answer: ["tondre"], why: "faire + infinitif = faire faire l'action par quelqu'un : je le fais tondre.", rule: "faire causatif : faire + infinitif.", tip: "je le fais tondre." },
  { booklet: 4, ofRange: [33, 40], act: 20, concept: "causative", diff: "medium", fr: "Faire causatif : « Je ne répare pas ma voiture; je la fais ___ par le garagiste. »", answer: ["réparer"], why: "faire + infinitif : je la fais réparer.", rule: "faire causatif : faire + infinitif.", tip: "je la fais réparer." },
  { booklet: 4, ofRange: [33, 40], act: 20, concept: "causative", diff: "medium", fr: "Faire causatif : « Je ne tape pas les lettres; je les fais ___ par l'adjointe. »", answer: ["taper"], why: "faire + infinitif : je les fais taper.", rule: "faire causatif : faire + infinitif.", tip: "je les fais taper." },
  { booklet: 4, ofRange: [33, 40], act: 20, concept: "causative", diff: "advanced", fr: "Faire causatif : « Je ne me coupe pas les cheveux moi-même; je me les fais ___ par mon coiffeur. »", answer: ["couper"], why: "faire causatif pronominal : je me les fais couper.", rule: "se faire + infinitif.", tip: "je me les fais couper." },
];

const items = Q.map((q, i) => {
  const n = i + 1;
  return {
    id: `supp-CON${q.booklet}-${q.act}-${n}`,
    objectiveId: `OF${q.ofRange[0]}`,
    sourceKind: "consolidation",
    booklet: q.booklet,
    ofRange: q.ofRange,
    skill: "grammar",
    difficulty: q.diff,
    type: "fill_blank",
    theme: "consolidation",
    grammarConcepts: [q.concept],
    vocabDomains: [],
    estTimeSec: 40,
    prompt: { fr: q.fr, instructions_en: "Consolidation review — type the correct French answer." },
    answer: { type: "string", accepted: q.answer, normalizer: "fr_accent_insensitive_trim_lower", regex: null },
    distractors: [],
    explanation: {
      correct_why: q.why,
      distractor_why: {},
      grammar_rule: q.rule,
      vocab_notes: `Consolidation booklet ${q.booklet} (activité ${q.act}) — review across OF ${q.ofRange[0]}–${q.ofRange[1]}.`,
      common_mistakes: ["Check verb endings, agreement, prepositions, and word order before submitting."],
    },
    tip: { memory_aid: q.tip, pattern: q.fr, similar: q.answer },
  };
});

data.items = items;
data.gradeableCount = items.length;
writeFileSync(p, JSON.stringify(data, null, 2));

const byB: Record<number, number> = {};
for (const q of Q) byB[q.booklet] = (byB[q.booklet] ?? 0) + 1;
console.log(`Built ${items.length} gradeable consolidation items:`, JSON.stringify(byB));
