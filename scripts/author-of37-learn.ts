/**
 * author-of37-learn.ts
 * Authors the full "Learn" stage for OF37 (Décrire la démarche suivie dans la réalisation d'un
 * projet) from the PFL2 source document SC102-2/37-2005F: reporting project status (37.1/37.2),
 * reporting changes to conditions (37.4), the mental-operation verbs (37.5), and the core grammar
 * — verbs followed by the prepositions à / de / sur (37.6). Idempotent.
 *
 * Run: node --experimental-strip-types scripts/author-of37-learn.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const modPath = join(ROOT, "content", "modules", "OF37.json");
const mod = JSON.parse(readFileSync(modPath, "utf8"));

const vocabulary = [
  // status (37.1 / 37.2)
  { fr: "où en êtes-vous?", en: "where are you at?", pos: "état d'avancement", note: "demander l'avancement" },
  { fr: "on en est à…", en: "we're at…", pos: "état d'avancement", note: "On en est à la phase finale." },
  { fr: "être rendu à…", en: "to have reached…", pos: "état d'avancement", note: "On est rendus à la 3e partie." },
  { fr: "se dérouler comme prévu", en: "to go as planned", pos: "état d'avancement", note: "Tout se déroule comme prévu." },
  // changes to conditions (37.4)
  { fr: "modifier / réduire / couper le budget", en: "to modify / cut the budget", pos: "modifications", note: "couper les crédits" },
  { fr: "reporter / devancer une échéance", en: "to postpone / move up a deadline", pos: "modifications", note: "reporter = repousser ; devancer = avancer" },
  { fr: "accorder un délai", en: "to grant an extension", pos: "modifications", note: "On nous accorde un délai." },
  { fr: "couper / réduire les effectifs (les ETP)", en: "to cut staff (FTEs)", pos: "modifications", note: "équivalents temps plein" },
  // mental-operation verbs (37.5)
  { fr: "penser / réfléchir / concevoir", en: "to think", pos: "opération intellectuelle", note: "famille « to think »" },
  { fr: "se souvenir / se rappeler / retenir", en: "to remember", pos: "opération intellectuelle", note: "famille « to remember »" },
  { fr: "constater / remarquer / s'apercevoir / réaliser", en: "to realize / notice", pos: "opération intellectuelle", note: "famille « to realize »" },
  { fr: "réaliser", en: "to realize", pos: "faux ami", note: "= se rendre compte (aussi : accomplir)" },
  // verbs + preposition (37.6)
  { fr: "réfléchir à / penser à / songer à", en: "to think about", pos: "verbe + à", note: "+ à" },
  { fr: "se souvenir de / avoir besoin de / tenir compte de", en: "to remember / need / take into account", pos: "verbe + de", note: "+ de" },
  { fr: "s'appuyer sur / se baser sur / porter sur / enquêter sur", en: "to rely on / be based on / be about / investigate", pos: "verbe + sur", note: "+ sur" },
];

mod.stages.learn = {
  conceptExplanation: {
    en: "Describe the procedure followed in a project. You learn to report the STATUS of work (Où en êtes-vous? — On en est à la phase finale.), to report CHANGES to a project's conditions (budget, deadlines, extension, staffing) and ask about their impact, and to use the verbs of mental operation (penser, se souvenir, se rendre compte…). The core grammar is which PREPOSITION follows a verb — à, de or sur: réfléchir À, se souvenir DE, s'appuyer SUR. Remember that à hides inside au/aux and de hides inside du/des. Source: SC102-2/37-2005F.",
    fr: "Décrire la démarche suivie dans la réalisation d'un projet. On apprend à faire part de l'ÉTAT d'avancement des travaux (Où en êtes-vous? — On en est à la phase finale.), à annoncer des MODIFICATIONS aux conditions d'un projet (budget, échéances, délai, ressources humaines) et à en demander les répercussions, ainsi qu'à employer les verbes d'opération intellectuelle (penser, se souvenir, se rendre compte…). Le point de grammaire central est la PRÉPOSITION qui suit le verbe — à, de ou sur : réfléchir À, se souvenir DE, s'appuyer SUR. Attention : « à » est inclus dans au/aux et « de » dans du/des.",
  },
  vocabulary,
  grammarNotes: {
    summary: "Point de grammaire central : la préposition (à, de ou sur) qui suit certains verbes. Voir le tableau « verbes + à / de / sur » ci-dessous. Rappel : à → au/aux, de → du/des.",
    charts: [],
    points: [
      "verbe + À : faire face à, réfléchir à, procéder à, penser à, répondre à, s'intéresser à, se référer à, songer à, inciter à, chercher à, voir à. (à + le = au ; à + les = aux)",
      "verbe + DE : penser de, s'apercevoir de, s'inspirer de, tenir compte de, se rendre compte de, prendre conscience de, se souvenir de, prendre connaissance de, avoir besoin de, décider de, se plaindre de, oublier de. (de + le = du ; de + les = des)",
      "verbe + SUR : s'appuyer sur, se poser des questions sur, se baser sur, porter sur (= concerner), enquêter sur.",
      "Faux ami : « réaliser » = to realize (se rendre compte) — et aussi « accomplir ». « J'ai réalisé que… » = I realized that…",
      "État d'avancement — demander : « Où en êtes-vous? À quelle étape êtes-vous rendus? » ; faire part : « On en est à la phase finale. / On est rendus à la 3e partie. / Tout se déroule comme prévu. »",
      "Modifications — annoncer : « On a coupé le budget. / On reporte l'échéance. / On nous accorde un délai. / On réduit les effectifs. » ; demander l'impact : « Qu'est-ce que ça implique? Quelles sont les répercussions? »",
    ],
  },
  pronunciation: { points: [] },
  dialogues: [
    {
      title: "Faire le point sur l'avancement (ACTIVITÉ 5)",
      register: "milieu de travail",
      lines: [
        { speaker: "Alice", fr: "J'aimerais bien savoir où on en est, parce que je dois faire un rapport à la patronne.", en: "où on en est = the status" },
        { speaker: "Luca", fr: "Tous les articles sont rendus à l'étape de la révision.", en: "être rendu à une étape" },
        { speaker: "Alice", fr: "Donc, si ça nous revient aujourd'hui, tout pourrait être prêt vendredi?", en: "asking about a forecast/deadline" },
        { speaker: "Luca", fr: "Le texte a été soumis au client pour approbation.", en: "reporting a completed step" },
      ],
    },
  ],
  exampleTexts: [
    {
      title: "Verbes suivis des prépositions à, de ou sur (ACTIVITÉ 19)",
      table: {
        headers: ["verbe + à  (→ au / aux)", "verbe + de  (→ du / des)", "verbe + sur"],
        rows: [
          ["faire face à · réfléchir à", "penser de · s'apercevoir de", "s'appuyer sur"],
          ["procéder à · penser à", "s'inspirer de · tenir compte de", "se poser des questions sur"],
          ["répondre à · s'intéresser à", "se rendre compte de · se souvenir de", "se baser sur"],
          ["se référer à · songer à", "prendre conscience / connaissance de", "porter sur (= concerner)"],
          ["inciter à · chercher à · voir à", "avoir besoin de · décider de · oublier de", "enquêter sur"],
        ],
      },
      en: "à is included in au/aux; de is included in du/des.",
    },
    {
      title: "Indicateurs d'opérations intellectuelles (ACTIVITÉ 16)",
      table: {
        headers: ["to think", "to remember", "to realize"],
        rows: [
          ["penser · réfléchir · concevoir", "se souvenir · se rappeler", "constater · remarquer · noter"],
          ["imaginer · considérer · songer", "retenir · reconnaître", "s'apercevoir · comprendre · voir"],
          ["élaborer · étudier · examiner", "—", "réaliser · découvrir · se rendre compte"],
        ],
      },
      en: "Verbs that describe the mental steps of a project: thinking, remembering, realizing.",
    },
    {
      title: "État d'avancement — demander / faire part (ACTIVITÉ 6)",
      table: {
        headers: ["Demander", "Faire part"],
        rows: [
          ["Où en êtes-vous dans le projet?", "On en est à la phase finale."],
          ["Où êtes-vous rendus?", "On est rendus à la troisième partie."],
          ["Qu'est-ce que vous avez fait jusqu'ici?", "Nous avons fini la planification."],
          ["À quelle étape êtes-vous rendus?", "Tout se déroule comme prévu."],
        ],
      },
      en: "Asking for, and giving, the status of the work.",
    },
    {
      title: "Faire part de modifications aux conditions (ACTIVITÉ 10)",
      table: {
        headers: ["Modification", "Réajustement possible"],
        rows: [
          ["On a modifié / réduit / coupé le budget.", "Le nombre d'agents va diminuer."],
          ["On reporte / devance l'échéance.", "Il faudra travailler le soir et les fins de semaine."],
          ["On nous accorde un délai.", "Ce ne sera pas nécessaire d'engager deux agents."],
          ["On coupe / réduit les effectifs (les ETP).", "Les agents devront faire des heures supplémentaires."],
        ],
      },
      en: "Announcing a change to a project's conditions and its likely consequence.",
    },
  ],
};

writeFileSync(modPath, JSON.stringify(mod, null, 2));
console.log("OF37 Learn stage authored: 1 concept, " + vocabulary.length + " vocab entries, 6 grammar points, 4 tables, 1 dialogue.");
