export type VerbPreposition = "none" | "à" | "de" | "avec" | "pour" | "sur" | "en" | "dans" | "chez" | "par";
export type ComplementKind = "person" | "thing" | "place" | "infinitive" | "clause";
export type ReplacementPronoun = "y" | "en" | "lui/leur" | "le/la/les" | null;

export type VerbConstruction = {
  id: string;
  infinitive: string;
  meaningEn: string;
  pattern: string;
  preposition: VerbPreposition;
  complement: ComplementKind;
  replacement: ReplacementPronoun;
  exampleFr: string;
  exampleEn: string;
  note?: string;
};

type RawConstruction = Omit<VerbConstruction, "id">;
const direct = (infinitive: string, meaningEn: string, pattern: string, exampleFr: string, exampleEn: string, note?: string, complement: ComplementKind = "thing"): RawConstruction =>
  ({ infinitive, meaningEn, pattern, preposition: "none", complement, replacement: "le/la/les", exampleFr, exampleEn, note });
const prep = (infinitive: string, meaningEn: string, pattern: string, preposition: Exclude<VerbPreposition, "none">, complement: ComplementKind, replacement: ReplacementPronoun, exampleFr: string, exampleEn: string, note?: string): RawConstruction =>
  ({ infinitive, meaningEn, pattern, preposition, complement, replacement, exampleFr, exampleEn, note });

const RAW: RawConstruction[] = [
  direct("aborder", "to address", "aborder quelque chose", "Nous abordons ce sujet demain.", "We are addressing this topic tomorrow."),
  direct("accepter", "to accept", "accepter quelque chose", "Elle accepte la proposition.", "She accepts the proposal."),
  direct("accompagner", "to accompany", "accompagner quelqu’un", "J’accompagne la délégation.", "I am accompanying the delegation.", undefined, "person"),
  prep("aider", "to help", "aider quelqu’un à faire quelque chose", "à", "infinitive", null, "Il m’aide à préparer le rapport.", "He helps me prepare the report."),
  direct("aimer", "to like", "aimer quelque chose ou quelqu’un", "Nous aimons cette solution.", "We like this solution."),
  prep("aller", "to go", "aller à un endroit", "à", "place", "y", "Je vais au bureau.", "I am going to the office."),
  prep("annoncer", "to announce", "annoncer quelque chose à quelqu’un", "à", "person", "lui/leur", "Elle annonce la décision à son équipe.", "She announces the decision to her team."),
  direct("appeler", "to call", "appeler quelqu’un", "J’appelle le gestionnaire.", "I am calling the manager.", undefined, "person"),
  prep("apporter", "to bring", "apporter quelque chose à quelqu’un", "à", "person", "lui/leur", "Apportez le dossier à Marie.", "Bring the file to Marie."),
  direct("apprendre", "to learn", "apprendre quelque chose", "J’apprends le français.", "I am learning French."),
  prep("apprendre", "to learn how", "apprendre à faire quelque chose", "à", "infinitive", null, "Elle apprend à utiliser le logiciel.", "She is learning to use the software."),
  prep("arrêter", "to stop doing", "arrêter de faire quelque chose", "de", "infinitive", null, "Il arrête de parler.", "He stops talking."),
  prep("arriver", "to manage to", "arriver à faire quelque chose", "à", "infinitive", null, "Nous arrivons à respecter les délais.", "We manage to meet the deadlines."),
  direct("attendre", "to wait for", "attendre quelqu’un ou quelque chose", "J’attends votre réponse.", "I am waiting for your answer."),
  prep("autoriser", "to authorize", "autoriser quelqu’un à faire quelque chose", "à", "infinitive", null, "On l’autorise à partir tôt.", "They authorize him to leave early."),
  prep("avoir", "to need", "avoir besoin de quelque chose", "de", "thing", "en", "Nous avons besoin de temps.", "We need time.", "The fixed expression is avoir besoin de."),
  direct("chercher", "to look for", "chercher quelque chose", "Je cherche le formulaire.", "I am looking for the form."),
  direct("choisir", "to choose", "choisir quelque chose", "Ils choisissent une date.", "They choose a date."),
  prep("commencer", "to start doing", "commencer à faire quelque chose", "à", "infinitive", null, "Elle commence à rédiger.", "She starts writing."),
  prep("commencer", "to begin by", "commencer par faire quelque chose", "par", "infinitive", null, "Commençons par vérifier les chiffres.", "Let us begin by checking the figures."),
  prep("comparer", "to compare with", "comparer quelque chose à autre chose", "à", "thing", "y", "Il compare ce résultat au précédent.", "He compares this result with the previous one."),
  direct("comprendre", "to understand", "comprendre quelque chose", "Je comprends la consigne.", "I understand the instruction."),
  prep("compter", "to rely on", "compter sur quelqu’un ou quelque chose", "sur", "person", null, "Vous pouvez compter sur nous.", "You can rely on us."),
  direct("conduire", "to drive", "conduire un véhicule", "Elle conduit la voiture de service.", "She drives the work vehicle."),
  prep("confier", "to entrust", "confier quelque chose à quelqu’un", "à", "person", "lui/leur", "Je confie ce mandat à Paul.", "I entrust this assignment to Paul."),
  direct("connaître", "to know", "connaître quelqu’un ou quelque chose", "Nous connaissons la procédure.", "We know the procedure."),
  prep("conseiller", "to advise", "conseiller à quelqu’un de faire quelque chose", "de", "infinitive", null, "Je lui conseille de confirmer la date.", "I advise her to confirm the date."),
  direct("construire", "to build", "construire quelque chose", "Ils construisent un nouveau bureau.", "They are building a new office."),
  prep("continuer", "to continue doing", "continuer à faire quelque chose", "à", "infinitive", null, "Continuez à travailler.", "Continue working."),
  prep("continuer", "to continue doing", "continuer de faire quelque chose", "de", "infinitive", null, "Il continue de répondre aux demandes.", "He continues answering requests.", "Both continuer à and continuer de are standard."),
  prep("croire", "to believe in", "croire à quelque chose", "à", "thing", "y", "Elle croit à cette possibilité.", "She believes in this possibility."),
  prep("croire", "to have faith in", "croire en quelqu’un", "en", "person", null, "Nous croyons en notre équipe.", "We believe in our team."),
  prep("décider", "to decide to", "décider de faire quelque chose", "de", "infinitive", null, "Ils décident de reporter la réunion.", "They decide to postpone the meeting."),
  prep("défendre", "to forbid", "défendre à quelqu’un de faire quelque chose", "de", "infinitive", null, "On lui défend de divulguer ces données.", "They forbid him to disclose this data."),
  prep("demander", "to ask someone to", "demander à quelqu’un de faire quelque chose", "de", "infinitive", null, "Je lui demande de répondre.", "I ask her to answer."),
  prep("demander", "to request from", "demander quelque chose à quelqu’un", "à", "person", "lui/leur", "Nous demandons une précision au directeur.", "We ask the director for clarification."),
  prep("dire", "to say to", "dire quelque chose à quelqu’un", "à", "person", "lui/leur", "Elle dit la vérité à son collègue.", "She tells her colleague the truth."),
  prep("discuter", "to discuss", "discuter de quelque chose", "de", "thing", "en", "Nous discutons du budget.", "We are discussing the budget."),
  prep("discuter", "to discuss with", "discuter avec quelqu’un", "avec", "person", null, "J’en discute avec mon équipe.", "I discuss it with my team."),
  prep("donner", "to give", "donner quelque chose à quelqu’un", "à", "person", "lui/leur", "Donnez le document à la gestionnaire.", "Give the document to the manager."),
  prep("douter", "to doubt", "douter de quelque chose", "de", "thing", "en", "Je doute de cette information.", "I doubt this information."),
  direct("écouter", "to listen to", "écouter quelqu’un ou quelque chose", "Nous écoutons la présentation.", "We are listening to the presentation."),
  prep("écrire", "to write to", "écrire à quelqu’un", "à", "person", "lui/leur", "J’écris à mes collègues.", "I am writing to my colleagues."),
  prep("empêcher", "to prevent", "empêcher quelqu’un de faire quelque chose", "de", "infinitive", null, "La panne nous empêche de travailler.", "The outage prevents us from working."),
  direct("employer", "to use", "employer quelque chose", "Employez un ton clair.", "Use a clear tone."),
  prep("envoyer", "to send", "envoyer quelque chose à quelqu’un", "à", "person", "lui/leur", "J’envoie le rapport au directeur.", "I send the report to the director."),
  prep("essayer", "to try to", "essayer de faire quelque chose", "de", "infinitive", null, "Nous essayons de résoudre le problème.", "We are trying to solve the problem."),
  prep("éviter", "to avoid doing", "éviter de faire quelque chose", "de", "infinitive", null, "Évitez de partager ce mot de passe.", "Avoid sharing this password."),
  prep("expliquer", "to explain", "expliquer quelque chose à quelqu’un", "à", "person", "lui/leur", "Elle explique la procédure aux recrues.", "She explains the procedure to the recruits."),
  direct("faire", "to do", "faire quelque chose", "Nous faisons le suivi.", "We follow up."),
  prep("finir", "to finish doing", "finir de faire quelque chose", "de", "infinitive", null, "Je finis de préparer la note.", "I am finishing preparing the note."),
  prep("fournir", "to provide", "fournir quelque chose à quelqu’un", "à", "person", "lui/leur", "On fournit les données aux analystes.", "The data is provided to the analysts."),
  { infinitive: "habiter", meaningEn: "to live in", pattern: "habiter un lieu", preposition: "none", complement: "place", replacement: "y", exampleFr: "Elle habite Ottawa.", exampleEn: "She lives in Ottawa.", note: "Habiter takes a direct place complement, but that location can still be replaced by y." },
  prep("hésiter", "to hesitate to", "hésiter à faire quelque chose", "à", "infinitive", null, "N’hésitez pas à poser des questions.", "Do not hesitate to ask questions."),
  prep("indiquer", "to indicate", "indiquer quelque chose à quelqu’un", "à", "person", "lui/leur", "Indiquez votre choix à la coordonnatrice.", "Indicate your choice to the coordinator."),
  prep("insister", "to insist on", "insister sur quelque chose", "sur", "thing", null, "Il insiste sur ce point.", "He insists on this point."),
  prep("insister", "to insist that", "insister pour que + subjonctif", "pour", "clause", null, "Elle insiste pour que nous participions.", "She insists that we participate."),
  prep("interdire", "to forbid", "interdire à quelqu’un de faire quelque chose", "de", "infinitive", null, "On leur interdit de copier les données.", "They are forbidden to copy the data."),
  prep("inviter", "to invite to", "inviter quelqu’un à faire quelque chose", "à", "infinitive", null, "Je vous invite à répondre.", "I invite you to answer."),
  prep("jouer", "to play a game", "jouer à un jeu", "à", "thing", "y", "Ils jouent aux cartes.", "They are playing cards."),
  prep("jouer", "to play an instrument", "jouer d’un instrument", "de", "thing", "en", "Elle joue du piano.", "She plays the piano."),
  prep("manquer", "to lack", "manquer de quelque chose", "de", "thing", "en", "Nous manquons de temps.", "We are short of time."),
  direct("mettre", "to put", "mettre quelque chose", "Mettez le document ici.", "Put the document here."),
  prep("montrer", "to show", "montrer quelque chose à quelqu’un", "à", "person", "lui/leur", "Montrez le tableau à votre équipe.", "Show the table to your team."),
  prep("obéir", "to obey a person", "obéir à quelqu’un", "à", "person", "lui/leur", "Il obéit à sa gestionnaire.", "He obeys his manager."),
  prep("obéir", "to comply with", "obéir à une règle", "à", "thing", "y", "Il obéit à cette règle.", "He complies with this rule."),
  direct("obtenir", "to obtain", "obtenir quelque chose", "Elle obtient une approbation.", "She obtains an approval."),
  direct("occuper", "to occupy", "occuper un poste", "Il occupe un poste de direction.", "He holds a management position."),
  prep("occuper", "to take care of", "s’occuper de quelque chose", "de", "thing", "en", "Elle s’occupe du dossier.", "She takes care of the file."),
  prep("offrir", "to offer", "offrir quelque chose à quelqu’un", "à", "person", "lui/leur", "Nous offrons de l’aide aux clients.", "We offer help to clients."),
  prep("opter", "to opt for", "opter pour quelque chose", "pour", "thing", null, "Ils optent pour la première solution.", "They opt for the first solution."),
  direct("organiser", "to organize", "organiser quelque chose", "Nous organisons une rencontre.", "We are organizing a meeting."),
  prep("oublier", "to forget to", "oublier de faire quelque chose", "de", "infinitive", null, "N’oubliez pas de signer.", "Do not forget to sign."),
  prep("parler", "to speak to", "parler à quelqu’un", "à", "person", "lui/leur", "Je parle à la directrice.", "I am speaking to the director."),
  prep("parler", "to talk about", "parler de quelque chose", "de", "thing", "en", "Nous parlons du projet.", "We are talking about the project."),
  prep("penser", "to think about", "penser à quelque chose", "à", "thing", "y", "Elle pense à la réunion.", "She is thinking about the meeting."),
  prep("plaire", "to please", "plaire à quelqu’un", "à", "person", "lui/leur", "Cette option plaît au comité.", "This option pleases the committee."),
  prep("postuler", "to apply for", "postuler à un poste", "à", "thing", "y", "Il postule à un poste bilingue.", "He applies for a bilingual position."),
  direct("préférer", "to prefer", "préférer quelque chose", "Je préfère cette méthode.", "I prefer this method."),
  direct("prendre", "to take", "prendre quelque chose", "Elle prend une décision.", "She makes a decision."),
  direct("préparer", "to prepare", "préparer quelque chose", "Nous préparons la réunion.", "We are preparing the meeting."),
  prep("présenter", "to present", "présenter quelque chose à quelqu’un", "à", "person", "lui/leur", "Je présente le plan au comité.", "I present the plan to the committee."),
  prep("promettre", "to promise", "promettre à quelqu’un de faire quelque chose", "de", "infinitive", null, "Elle lui promet de répondre demain.", "She promises him to answer tomorrow."),
  prep("proposer", "to suggest", "proposer à quelqu’un de faire quelque chose", "de", "infinitive", null, "Je vous propose de commencer.", "I suggest that you begin."),
  prep("réagir", "to react to", "réagir à quelque chose", "à", "thing", "y", "Il réagit à la nouvelle.", "He reacts to the news."),
  prep("réfléchir", "to think about", "réfléchir à quelque chose", "à", "thing", "y", "Nous réfléchissons à la proposition.", "We are thinking about the proposal."),
  prep("refuser", "to refuse to", "refuser de faire quelque chose", "de", "infinitive", null, "Elle refuse de modifier le rapport.", "She refuses to change the report."),
  direct("regarder", "to watch", "regarder quelqu’un ou quelque chose", "Regardez ce graphique.", "Look at this chart."),
  prep("remplacer", "to replace with", "remplacer quelque chose par autre chose", "par", "thing", null, "Remplacez ce mot par un synonyme.", "Replace this word with a synonym."),
  prep("répondre", "to answer a thing", "répondre à quelque chose", "à", "thing", "y", "Je réponds à la demande.", "I answer the request."),
  prep("répondre", "to answer a person", "répondre à quelqu’un", "à", "person", "lui/leur", "Je réponds à la gestionnaire.", "I answer the manager."),
  prep("réussir", "to succeed in", "réussir à faire quelque chose", "à", "infinitive", null, "Nous réussissons à terminer à temps.", "We manage to finish on time."),
  prep("servir", "to be used for", "servir à faire quelque chose", "à", "infinitive", null, "Cet outil sert à vérifier les données.", "This tool is used to check the data."),
  prep("téléphoner", "to phone", "téléphoner à quelqu’un", "à", "person", "lui/leur", "Je téléphone au fournisseur.", "I phone the supplier."),
  prep("tenir", "to care about", "tenir à quelque chose", "à", "thing", "y", "Nous tenons à cette valeur.", "We care about this value."),
  prep("traiter", "to deal with", "traiter de quelque chose", "de", "thing", "en", "Le rapport traite de la sécurité.", "The report deals with security."),
  prep("travailler", "to work on", "travailler sur quelque chose", "sur", "thing", null, "Elle travaille sur ce dossier.", "She is working on this file."),
  prep("travailler", "to work for", "travailler pour une organisation", "pour", "thing", null, "Il travaille pour le ministère.", "He works for the department."),
  direct("utiliser", "to use", "utiliser quelque chose", "Nous utilisons ce système.", "We use this system."),
  prep("venir", "to come from", "venir de quelque part", "de", "place", "en", "Elle vient de Montréal.", "She comes from Montreal."),
  prep("venir", "to come to", "venir à un endroit", "à", "place", "y", "Il vient à la réunion.", "He comes to the meeting."),
  direct("vérifier", "to check", "vérifier quelque chose", "Vérifiez les chiffres.", "Check the figures."),
  direct("voir", "to see", "voir quelqu’un ou quelque chose", "Je vois le problème.", "I see the problem."),
  direct("vouloir", "to want", "vouloir quelque chose", "Nous voulons une réponse.", "We want an answer."),
];

const slugCount = new Map<string, number>();
export const VERB_CONSTRUCTIONS: VerbConstruction[] = RAW.map((construction) => {
  const base = `${construction.infinitive}-${construction.preposition}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const number = (slugCount.get(base) ?? 0) + 1;
  slugCount.set(base, number);
  return { ...construction, id: `${base}-${number}` };
});

export function getVerbConstructions(infinitive: string): VerbConstruction[] {
  return VERB_CONSTRUCTIONS.filter((construction) => construction.infinitive === infinitive);
}

export function summarizeVerbConstructions(infinitive: string): string {
  return getVerbConstructions(infinitive).map((construction) => construction.pattern).join(" · ");
}
