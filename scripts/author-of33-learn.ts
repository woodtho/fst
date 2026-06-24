/**
 * author-of33-learn.ts
 * Authors the full "Learn" stage for OF33 (Exprimer un choix) from the PFL2 source document
 * SC102-2/33-2005F: the indicators of choice (33.1), the relative pronoun « lequel » with a
 * preposition table (33.2), the ask/give-information-about-a-choice functions (33.4), and the
 * source dialogue. Idempotent.
 *
 * Run: node --experimental-strip-types scripts/author-of33-learn.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const modPath = join(ROOT, "content", "modules", "OF33.json");
const mod = JSON.parse(readFileSync(modPath, "utf8"));

const vocabulary = [
  { fr: "le choix", en: "the choice", pos: "indicateur de choix", note: "Le choix de cours est varié." },
  { fr: "l'option (f.)", en: "the option", pos: "indicateur de choix", note: "Quelles sont mes options?" },
  { fr: "la sélection", en: "the selection", pos: "indicateur de choix", note: "faire une sélection parmi…" },
  { fr: "choisir", en: "to choose", pos: "indicateur de choix", note: "Tu as choisi le cours?" },
  { fr: "faire un choix", en: "to make a choice", pos: "indicateur de choix", note: "As-tu fait ton choix?" },
  { fr: "offrir le choix", en: "to give the choice", pos: "indicateur de choix", note: "On m'offre le choix entre X et Y." },
  { fr: "avoir le choix", en: "to have the choice", pos: "indicateur de choix", note: "On n'a pas le choix." },
  { fr: "laisser le choix", en: "to let (someone) choose", pos: "indicateur de choix", note: "Je te laisse le choix." },
  { fr: "prendre", en: "to take / to choose", pos: "indicateur de choix", note: "Adrienne prend la pièce 324 ou 325?" },
  { fr: "opter (pour)", en: "to opt (for)", pos: "indicateur de choix", note: "Elle a opté pour la semaine variable." },
  { fr: "sélectionner", en: "to select", pos: "indicateur de choix", note: "Léo a été sélectionné pour ce poste." },
  { fr: "retenir", en: "to retain / shortlist", pos: "indicateur de choix", note: "Nous avons retenu deux noms." },
  { fr: "optionnel / facultatif", en: "optional", pos: "adjectif", note: "un cours optionnel ; une formation facultative" },
  { fr: "ou", en: "or", pos: "conjonction", note: "à 1 h ou à 2 h?" },
  { fr: "soit … soit", en: "either … or", pos: "conjonction", note: "soit jeudi, soit vendredi" },
];

mod.stages.learn = {
  conceptExplanation: {
    en: "Express a choice. This objective teaches: (1) the indicators of choice (le choix, l'option, choisir, opter pour, faire/avoir/offrir/laisser le choix, retenir, sélectionner, optionnel, soit … soit); (2) the relative pronoun « lequel » (lequel/laquelle/lesquels/lesquelles, and the contractions auquel/auxquels/auxquelles) used after a preposition other than « de » — « la boîte sur laquelle… », « l'appareil avec lequel… »; and (3) how to ask for and give information about a choice to be made or already made. Source: SC102-2/33-2005F.",
    fr: "Exprimer un choix. On y étudie : (1) les indicateurs de choix (le choix, l'option, choisir, opter pour, faire/avoir/offrir/laisser le choix, retenir, sélectionner, optionnel, soit … soit) ; (2) le pronom relatif « lequel » (lequel/laquelle/lesquels/lesquelles et les contractions auquel/auxquels/auxquelles) employé après une préposition autre que « de » — « la boîte sur laquelle… », « l'appareil avec lequel… » ; (3) comment demander et donner des renseignements sur un choix à faire ou déjà fait.",
  },
  vocabulary,
  grammarNotes: {
    summary: "Point de grammaire central : le pronom relatif « lequel » après une préposition (sur, dans, avec, pour, par, à…). Il s'accorde en genre et en nombre avec son antécédent, et se contracte avec « à ». Voir le tableau ci-dessous.",
    charts: [],
    points: [
      "« lequel » s'accorde avec l'antécédent : lequel (masc. sing.), laquelle (fém. sing.), lesquels (masc. plur.), lesquelles (fém. plur.).",
      "Avec la préposition « à », il y a contraction : à + lequel → auquel ; à + lesquels → auxquels ; à + lesquelles → auxquelles. (à + laquelle reste « à laquelle ».)",
      "On emploie « lequel » après une préposition (sur, dans, avec, pour, par, à…) : « la boîte sur laquelle vous pouvez écrire », « l'appareil avec lequel nous faisons les tests ».",
      "Pour un lieu ou un moment, on emploie souvent « où » (la salle où a lieu la réunion ; le moment où vous êtes en forme). Avec « de », on emploie « dont » (les outils dont tu as besoin).",
      "Distinguer : sujet → qui ; objet direct → que ; complément avec « de » → dont ; complément avec une autre préposition → préposition + lequel / où.",
      "Demander un choix à faire : « Quelles sont les options? », « On me laisse le choix entre quoi et quoi? » — Donner : « Tu as le choix entre X et Y. » Demander un choix fait : « As-tu fait ton choix? », « Qu'est-ce que tu as pris? » — Donner : « J'ai opté pour… », « Mon choix, c'est… ».",
    ],
  },
  pronunciation: { points: [] },
  dialogues: [
    {
      title: "Indicateurs de choix — évaluation du rendement (ACTIVITÉ 2)",
      register: "milieu de travail",
      lines: [
        { speaker: "Denis (patron)", fr: "J'aimerais savoir si tu as fait ton choix. As-tu consulté le manuel de formation?", en: "faire son choix = to make one's choice" },
        { speaker: "Claude", fr: "Puisque tu me laisses le choix, c'est le cours de conversation anglaise.", en: "laisser le choix = to let someone choose" },
        { speaker: "Denis", fr: "Il y a deux sessions, une à l'automne et l'autre en janvier. Tu as le choix.", en: "avoir le choix = to have the choice" },
        { speaker: "Claude", fr: "Je prends la session d'automne.", en: "prendre = to choose/take" },
      ],
    },
  ],
  exampleTexts: [
    {
      title: "Pronom relatif « lequel » avec une préposition autre que « de »",
      table: {
        headers: ["Préposition", "masc. sing.", "fém. sing.", "masc. plur.", "fém. plur."],
        rows: [
          ["sur, dans, avec, pour, par…", "lequel", "laquelle", "lesquels", "lesquelles"],
          ["contraction avec « à »", "auquel", "à laquelle", "auxquels", "auxquelles"],
        ],
      },
      en: "lequel agrees in gender and number with its antecedent. With « à » it contracts: auquel, auxquels, auxquelles (but à laquelle stays).",
    },
    {
      title: "Exemples (ACTIVITÉ 5)",
      table: {
        headers: ["Deux phrases", "Une seule phrase"],
        rows: [
          ["… écrire votre nom SUR cette boîte.", "la boîte sur laquelle vous pouvez écrire votre nom"],
          ["… mis les documents DANS cette chemise.", "la chemise dans laquelle tu as mis les documents"],
          ["… faire les tests AVEC cet appareil.", "l'appareil avec lequel nous faisons les tests"],
          ["… il faut parler À ces personnes.", "les personnes auxquelles il faut parler"],
        ],
      },
      en: "Join two sentences with the right preposition + lequel form.",
    },
    {
      title: "Demander et donner des renseignements sur un choix (ACTIVITÉ 11)",
      table: {
        headers: ["Demander", "Donner"],
        rows: [
          ["Quel choix est-ce que j'ai? / Quelles sont les options?", "Tu as le choix entre X et Y. / Il y a deux options."],
          ["On me laisse le choix entre quoi et quoi?", "On te laisse le choix entre X et Y."],
          ["As-tu fait ton choix? / Qu'est-ce que tu as pris?", "Mon choix, c'est… / J'ai pris… / J'opte pour…"],
          ["Tu optes pour X ou pour Y?", "J'opte pour…"],
        ],
      },
      en: "Left column: asking about a choice (to be made or already made). Right column: giving the information.",
    },
  ],
};

writeFileSync(modPath, JSON.stringify(mod, null, 2));
console.log("OF33 Learn stage authored: 1 concept, " + vocabulary.length + " vocab entries, 6 grammar points, 3 tables, 1 dialogue.");
