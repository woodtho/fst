/**
 * fix-learn-activities.ts
 * Cleans up the Learn-stage "activities" across all modules:
 *   1. Dialogue lines that used { speaker, text } instead of { speaker, fr } are repaired (text→fr).
 *   2. English translations are added to dialogue lines that lacked them (TRANS map, matched on the
 *      French text so it is robust to ordering).
 *   3. Example-text titles: promote the first line to a real title when none was set, and strip the
 *      noisy "Activité NN —" prefix from titles so each activity has a useful name.
 *   4. Empty activities (a title with no body and no table) are either filled with authored content
 *      or, when they are just booklet end-notes, removed.
 *   5. A short `help` line is added to every example activity so the learner knows what to do.
 *
 * Idempotent. Run: node --experimental-strip-types scripts/fix-learn-activities.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();

// ── Dialogue translations (keys use straight apostrophes; lookup is normalized) ──
const TRANS: Record<string, string> = {
  // OF1 — first meetings / identifying people
  "Ah! Bonsoir, Lilianne. Bonsoir, Richard. Entrez, entrez. Je suis contente de vous voir.": "Ah! Good evening, Lilianne. Good evening, Richard. Come in, come in. I'm happy to see you.",
  "Bonsoir. Je m'appelle Bob Jackson. Et toi, comment t'appelles-tu?": "Good evening. My name is Bob Jackson. And you, what's your name?",
  "Julie. Julie Blondin.": "Julie. Julie Blondin.",
  "Liliane, Richard, je vous présente monsieur et madame Legrand. Lilianne et Richard Plamondon, des amis.": "Liliane, Richard, let me introduce Mr. and Mrs. Legrand. Lilianne and Richard Plamondon, friends.",
  "Les gens qui arrivent, comment est-ce qu'ils s'appellent?": "The people arriving — what are their names?",
  "Richard et Lilianne Plamondon. Lui, il est agronome, au ministère de l'Agriculture, et elle, elle est professeure.": "Richard and Lilianne Plamondon. He's an agronomist at the Department of Agriculture, and she's a teacher.",
  "Et la dame, là-bas, c'est qui?": "And the lady over there, who is she?",
  "C'est madame Legrand. Elle est directrice de l'information à Patrimoine canadien.": "That's Mrs. Legrand. She's the director of information at Canadian Heritage.",
  "Bonsoir. Vous êtes bien Lilianne Plamondon?": "Good evening. You're Lilianne Plamondon, right?",
  "Je me présente : Claude Roger. Je suis agent de formation à Transports Canada.": "Let me introduce myself: Claude Roger. I'm a training officer at Transport Canada.",
  "Voici mon mari, Richard.": "This is my husband, Richard.",
  "Qui c'est, ce gars-là?": "Who's that guy?",
  "Tu ne connais pas Jean-Luc?": "You don't know Jean-Luc?",
  "Non.": "No.",
  "Alors, viens... Je te présente Jean-Luc Amyot, un ami de collège.": "Well, come... Let me introduce Jean-Luc Amyot, a friend from college.",
  "Bonjour. Ça me fait plaisir de te rencontrer.": "Hello. It's a pleasure to meet you.",
  "Le monsieur, là-bas, c'est l'agent de dotation?": "The man over there, is he the staffing officer?",
  "Non, c'est Raymond Olivier, le nouveau comptable.": "No, that's Raymond Olivier, the new accountant.",
  "Bonjour, Madame. Je suis au bureau de monsieur Morissette?": "Hello, Madam. Is this Mr. Morissette's office?",
  "Oui, Monsieur.": "Yes, sir.",
  "Je m'appelle Louis Beaulieu. Je n'ai pas de rendez-vous, mais j'aimerais rencontrer monsieur Morissette. Est-ce que c'est possible?": "My name is Louis Beaulieu. I don't have an appointment, but I'd like to meet Mr. Morissette. Is that possible?",
  "Bonjour. Sergent Guy Lalonde, de la GRC.": "Hello. Sergeant Guy Lalonde, from the RCMP.",
  "Oui... Vous êtes ici pour quoi?": "Yes... What are you here for?",
  "C'est bien vous, Yvon Poulin?": "You're Yvon Poulin, right?",
  "Oui, c'est moi.": "Yes, that's me.",
  "Bonjour. Permettez-moi de me présenter : Jean Cormier. Je suis fonctionnaire au ministère des Finances.": "Hello. Allow me to introduce myself: Jean Cormier. I'm a public servant at the Department of Finance.",
  "Enchanté. Je m'appelle Arthur Pigeon. Je suis ingénieur au ministère des Transports.": "Pleased to meet you. My name is Arthur Pigeon. I'm an engineer at the Department of Transport.",
  "Bureau des passeports. Good afternoon.": "Passport office. Good afternoon.",
  "Oui. Bonjour. J'aimerais parler à madame Desmarais, s'il vous plaît.": "Yes. Hello. I'd like to speak to Mrs. Desmarais, please.",
  "Oui. C'est de la part de qui?": "Yes. Who's calling?",
  "Ginette Lamontagne.": "Ginette Lamontagne.",
  "Je cherche Paul Mubamba. C'est vous?": "I'm looking for Paul Mubamba. Is that you?",
  "Non. C'est le monsieur, là-bas.": "No. It's the man over there.",
  "Bureau de la directrice. Good morning.": "Director's office. Good morning.",
  "Bonjour, Monsieur. Pouvez-vous me dire qui est présentement directeur du service?": "Hello, sir. Can you tell me who is currently the director of the department?",
  "C'est madame Colette Laplaine.": "That's Mrs. Colette Laplaine.",
  "Merci.": "Thank you.",
  "Je m'appelle François Régimbald. Et toi?": "My name is François Régimbald. And you?",
  "Moi, c'est Lise Dompierre.": "I'm Lise Dompierre.",
  "Monsieur Richard, j'ai le plaisir de vous présenter madame Marie Pouliot, notre nouvelle employée.": "Mr. Richard, I have the pleasure of introducing Mrs. Marie Pouliot, our new employee.",
  "Très heureux de vous connaître, Madame.": "Very pleased to meet you, Madam.",
  "Et moi aussi, monsieur Richard.": "Likewise, Mr. Richard.",
  "C'est toi, Denis?": "Is that you, Denis?",
  "Oui, c'est moi. Euh... Qui parle?": "Yes, it's me. Uh... Who's speaking?",
  "C'est moi, Monique. Monique Rouleau.": "It's me, Monique. Monique Rouleau.",
  "Ah oui! Comment ça va, Monique?": "Oh yes! How are you, Monique?",
  "Très bien, merci. Et toi?": "Very well, thank you. And you?",
  "Pas mal.": "Not bad.",
  "Salut, Rolande. Comment vas-tu?": "Hi, Rolande. How are you?",
  "Pas mal du tout.": "Not bad at all.",
  "Et qui est avec toi?": "And who's with you?",
  "Ah! excuse-moi. Je te présente Catherine, ma nièce.": "Oh! Excuse me. Let me introduce Catherine, my niece.",
  "Bonjour.": "Hello.",
  // OF2 — objects at work
  "Lise, regarde ça! Devine ce que c'est.": "Lise, look at this! Guess what it is.",
  "Quel objet bizarre! Qu'est-ce que c'est?": "What a strange object! What is it?",
  "C'est un taille-crayon électrique.": "It's an electric pencil sharpener.",
  "Tiens, Jacqueline. C'est pour toi.": "Here, Jacqueline. This is for you.",
  "Est-ce que c'est une copie du rapport annuel?": "Is this a copy of the annual report?",
  "Non, c'est l'original. Tu dois faire des copies.": "No, it's the original. You need to make copies.",
  "Michèle, tu me prêtes ton... ton truc, là, pour écrire les dates. C'est quoi, le nom de cet objet-là?": "Michèle, can you lend me your... your thing, you know, for writing dates. What's the name of that object?",
  "Ça s'appelle un timbre dateur. Tiens, le voilà.": "It's called a date stamp. Here it is.",
  "Monsieur Derouin, excusez-moi. Qu'est-ce que c'est, ces formulaires-là?": "Mr. Derouin, excuse me. What are these forms?",
  "C'est les nouveaux formulaires de demande de congé.": "Those are the new leave-request forms.",
  // OF21 — explaining a regulation
  "Les Accords de Lima s'appliquent à tous les pays d'Amérique du Sud avec lesquels le Canada fait du commerce, à l'exception de la Colombie.": "The Lima Accords apply to all South American countries Canada trades with, except Colombia.",
  "Donc les accords incluent l'Uruguay et aussi le Pérou?": "So the accords include Uruguay and also Peru?",
  "Oui. La Colombie s'est retirée de ces accords; ce retrait signifie que l'article 16 s'applique aux pays signataires, à part la Colombie.": "Yes. Colombia withdrew from these accords; that withdrawal means article 16 applies to the signatory countries, apart from Colombia.",
  "Est-ce que la documentation renferme des précisions sur les modalités?": "Does the documentation contain details about the terms?",
  "À l'intérieur de la pochette d'information, vous avez tous les renseignements.": "Inside the information folder, you have all the details.",
  // OF22 — assigning a task with a deadline
  "J'aimerais te demander de vérifier les dernières statistiques sur le chômage.": "I'd like to ask you to check the latest unemployment statistics.",
  "J'ai jusqu'à quand pour faire ça?": "How long do I have to do that?",
  "Jusqu'à mercredi.": "Until Wednesday.",
  "C'est un peu court. Je peux prendre une journée de plus?": "That's a bit short. Can I take one more day?",
  "Je regrette, c'est impossible.": "I'm sorry, that's impossible.",
  // OF23 — describing a project
  "Le projet s'échelonnera sur une période de trois mois, du 1er mars au 31 mai.": "The project will span three months, from March 1 to May 31.",
  "Cinq agents seront affectés à l'étude préliminaire.": "Five officers will be assigned to the preliminary study.",
  "L'étude statistique devrait coûter entre 30 000 $ et 40 000 $.": "The statistical study should cost between $30,000 and $40,000.",
  "Les agents s'installeront au troisième étage et les réunions auront lieu à la pièce 208.": "The officers will be set up on the third floor and the meetings will take place in room 208.",
  "À quelle fréquence auront lieu les réunions?": "How often will the meetings take place?",
  "Deux fois par semaine.": "Twice a week.",
  // OF24 — sequencing with time markers
  "Après avoir adopté le compte rendu, on abordera les points à l'ordre du jour.": "After adopting the minutes, we'll move on to the items on the agenda.",
  "Dès qu'on aura terminé la réunion, je rencontrerai la consultante.": "As soon as we've finished the meeting, I'll meet with the consultant.",
  "J'aviserai mon équipe dès notre prochaine rencontre.": "I'll inform my team at our next meeting.",
  "Avant de réserver une chambre, je vais vérifier les prix.": "Before booking a room, I'll check the prices.",
  "La semaine précédente, j'avais envoyé deux courriels.": "The previous week, I had sent two emails.",
  "On devrait se revoir plus tard, quand tout sera prêt.": "We should meet again later, when everything is ready.",
  // OF25 — describing steps
  "Qu'est-ce qu'on fait d'abord?": "What do we do first?",
  "D'abord, on établit l'ordre du jour. Ensuite, on contacte les participants.": "First, we set the agenda. Then we contact the participants.",
  "Et la prochaine étape?": "And the next step?",
  "On réserve la salle et le matériel audiovisuel.": "We book the room and the audiovisual equipment.",
  "Pour commencer, entre ton code d'identification.": "To start, enter your identification code.",
  "Après ça, choisis le type de demande.": "After that, choose the type of request.",
  "Finalement, envoie la demande à ton superviseur.": "Finally, send the request to your supervisor.",
  // OF26 — who/where: pronouns and recipients
  "Où est-ce que Monique s'en va?": "Where is Monique going?",
  "Elle se rend chez la directrice.": "She's going to the director's office.",
  "Est-ce qu'elle revient aujourd'hui?": "Is she coming back today?",
  "Oui, elle sera de retour à 13 h.": "Yes, she'll be back at 1 p.m.",
  "À qui s'adresse cette directive?": "Who is this directive intended for?",
  "Elle est écrite à l'intention des nouveaux agents.": "It's written for the new officers.",
  "Qui est le destinataire de la lettre?": "Who is the recipient of the letter?",
  "Madame Latrémouille doit l'ouvrir elle-même.": "Mrs. Latrémouille must open it herself.",
  // OF27 — explaining how something works
  "Comment est-ce que je remplace la cartouche?": "How do I replace the cartridge?",
  "D'abord, ouvre le couvercle. Ensuite, retire l'ancienne cartouche et insère la nouvelle.": "First, open the lid. Then remove the old cartridge and insert the new one.",
  "En ce qui concerne la photocopieuse, elle fonctionne bien.": "As for the photocopier, it works well.",
  "À propos, sais-tu comment enlever une feuille coincée?": "By the way, do you know how to clear a jammed sheet?",
  // OF28 / 32 / 34 / 36 / 38 — repaired { text } dialogues
  "Est-ce qu'on est vraiment obligés de faire ça?": "Do we really have to do that?",
  "Oui, c'est essentiel que ce soit fait aujourd'hui.": "Yes, it's essential that it be done today.",
  "À quoi ça sert d'appliquer le règlement à la lettre?": "What's the point of applying the rule to the letter?",
  "Ça nous évite de refaire le travail pour rien.": "It saves us from redoing the work for nothing.",
  "Quelles sont les conditions pour obtenir une avance?": "What are the conditions for getting an advance?",
  "Il faut remplir le formulaire et le soumettre assez longtemps d'avance.": "You have to fill out the form and submit it well in advance.",
  "Est-ce possible d'être remboursé?": "Is it possible to be reimbursed?",
  "Oui, à condition de fournir toutes les pièces justificatives.": "Yes, provided you supply all the supporting documents.",
  "Le rapport est incomplet et l'échéance est demain.": "The report is incomplete and the deadline is tomorrow.",
  "Si on redistribuait les tâches, Benoît pourrait refaire la dernière partie.": "If we redistributed the tasks, Benoît could redo the last part.",
  "D'accord. Quelqu'un d'autre s'occupera du budget si Benoît révise le rapport.": "All right. Someone else will handle the budget if Benoît revises the report.",
  "Vous m'aviez demandé de vérifier les résultats du sondage.": "You had asked me to check the survey results.",
  "Oui. Qu'est-ce que l'analyse a révélé?": "Yes. What did the analysis reveal?",
  "Les résultats ont démontré que la nouvelle méthode est plus efficace.": "The results showed that the new method is more effective.",
  "Pourquoi la réunion est-elle reportée?": "Why is the meeting postponed?",
  "Elle est reportée parce que plusieurs gestionnaires sont absents.": "It's postponed because several managers are absent.",
  "Quel sera l'effet sur le projet?": "What will the effect on the project be?",
  "Par conséquent, nous aurons une semaine de plus pour préparer le dossier.": "Consequently, we'll have one more week to prepare the file.",
  // OF10 — assigning and tracking a task
  "Il faut envoyer la note de service aujourd'hui.": "The memo has to be sent today.",
  "Est-ce que je dois aussi la faire approuver?": "Do I also have to get it approved?",
  "Oui, et tu peux la transmettre aux gestionnaires ensuite.": "Yes, and then you can forward it to the managers.",
  "Qui est responsable de la vérification?": "Who is responsible for the check?",
  "C'est Nadia qui va la faire.": "Nadia is the one who'll do it.",
  "Pour quand est-ce qu'il faut terminer?": "By when does it have to be finished?",
  "Il faudra remettre le dossier vendredi matin.": "The file will have to be handed in Friday morning.",
  // OF11 — how to do something (gérondif)
  "Comment je peux obtenir ces renseignements?": "How can I get this information?",
  "Tu peux les avoir en consultant la base de données.": "You can get it by checking the database.",
  "Et s'il manque des informations?": "And if some information is missing?",
  "Tu les trouveras en téléphonant aux Archives.": "You'll find it by calling the Archives.",
  "Comment dois-je faire ce travail?": "How should I do this work?",
  "Fais-le soigneusement et vérifie les données attentivement.": "Do it carefully and check the data closely.",
  "Je l'envoie comment?": "How do I send it?",
  "Par courriel, avec une copie du rapport.": "By email, with a copy of the report.",
  // OF12 — quantities
  "Est-ce qu'il y a beaucoup de dossiers à traiter?": "Are there many files to process?",
  "Oui, plusieurs dossiers sont urgents, mais quelques-uns peuvent attendre.": "Yes, several files are urgent, but a few can wait.",
  "La plupart sont complets?": "Are most of them complete?",
  "Oui, la majorité des dossiers sont prêts.": "Yes, the majority of the files are ready.",
  "Comment allons-nous répartir le travail?": "How are we going to divide up the work?",
  "Chaque équipe prendra une section.": "Each team will take one section.",
  "Combien de dossiers par équipe?": "How many files per team?",
  "Plusieurs dossiers par équipe, selon les priorités.": "Several files per team, depending on the priorities.",
  // OF13 — past events
  "En quelle année avez-vous commencé à Santé Canada?": "What year did you start at Health Canada?",
  "J'ai commencé en 1998. Je travaillais aux ressources humaines.": "I started in 1998. I was working in human resources.",
  "Qu'est-ce qui est arrivé ensuite?": "What happened next?",
  "J'ai participé à un concours et j'ai obtenu le poste que je voulais.": "I entered a competition and got the position I wanted.",
  "Autrefois, comment alliez-vous au bureau?": "In the past, how did you get to the office?",
  "Je prenais l'autobus tous les matins.": "I took the bus every morning.",
  "Et hier?": "And yesterday?",
  "Hier, j'ai pris le train parce que l'autobus était en retard.": "Yesterday I took the train because the bus was late.",
  // OF14 — reporting incidents
  "Qu'est-ce qui s'est passé hier soir?": "What happened last night?",
  "Il y a eu un accident au coin de la rue.": "There was an accident at the corner of the street.",
  "Est-ce qu'il y a eu des blessés?": "Were there any injuries?",
  "Non, mais il s'est produit beaucoup de dommages.": "No, but there was a lot of damage.",
  "Est-ce que la réunion a eu lieu ce matin?": "Did the meeting take place this morning?",
  "Non, elle a été annulée.": "No, it was cancelled.",
  "Quand est-ce qu'elle va se tenir?": "When is it going to be held?",
  "Elle aura lieu demain à 9 h.": "It will take place tomorrow at 9 a.m.",
  // OF15 — requests
  "Pourriez-vous me faire une photocopie?": "Could you make me a photocopy?",
  "Oui, bien sûr.": "Yes, of course.",
  "Je vous demanderais aussi de remettre le rapport avant jeudi.": "I'd also ask you to hand in the report before Thursday.",
  "As-tu reçu ton chèque?": "Did you receive your cheque?",
  "Non, je ne l'ai pas eu.": "No, I didn't get it.",
  "Combien de jours a-t-on pour faire une réclamation?": "How many days do we have to file a claim?",
  "On a dix jours.": "We have ten days.",
  // OF16 — offers and reactions
  "Je t'apporte le manuel?": "Shall I bring you the manual?",
  "Ah oui! Bonne idée.": "Oh yes! Good idea.",
  "Est-ce que je peux aussi t'aider avec le rapport?": "Can I also help you with the report?",
  "Volontiers, merci.": "Gladly, thank you.",
  "Est-ce que je peux vous être utile?": "Can I be of help to you?",
  "Non merci, ça va comme ça.": "No thanks, I'm fine.",
  "Quelque chose à grignoter?": "Something to nibble on?",
  "Merci quand même, mais je n'ai pas faim.": "Thanks anyway, but I'm not hungry.",
  // OF17 — availability
  "Pourrais-je parler à madame Latulipe?": "Could I speak to Mrs. Latulipe?",
  "Je regrette, elle est en vacances cette semaine.": "I'm sorry, she's on vacation this week.",
  "Est-ce que madame Simard est revenue?": "Has Mrs. Simard come back?",
  "Oui, elle est à son bureau.": "Yes, she's at her desk.",
  "Le dossier sera-t-il disponible demain après-midi?": "Will the file be available tomorrow afternoon?",
  "Oui, vous pourrez l'avoir.": "Yes, you'll be able to have it.",
  "Il vous reste un numéro de la revue Le jour?": "Do you have any copies of the magazine Le jour left?",
  "Malheureusement, il n'y en a plus.": "Unfortunately, there are none left.",
  // OF18 — wishes / preferences (subjonctif)
  "Où veux-tu que je mette les boîtes?": "Where do you want me to put the boxes?",
  "Je veux que tu les mettes ici.": "I want you to put them here.",
  "Quand est-ce que tu veux que je fasse ça?": "When do you want me to do that?",
  "J'aimerais que tu fasses ça tout de suite.": "I'd like you to do that right away.",
  "Vous préférez le thé ou le café?": "Do you prefer tea or coffee?",
  "Je préfère le thé.": "I prefer tea.",
  "Laquelle des deux salles préférez-vous?": "Which of the two rooms do you prefer?",
  "J'aime mieux la salle 354.": "I prefer room 354.",
  // OF19 — describing things / giving opinions
  "Pourriez-vous me décrire l'objet perdu?": "Could you describe the lost item for me?",
  "C'est un sac à main en cuir brun avec bandoulière.": "It's a brown leather handbag with a shoulder strap.",
  "Dans quel état est-il?": "What condition is it in?",
  "Il est en bon état.": "It's in good condition.",
  "Que penses-tu de l'exercice de feu?": "What do you think of the fire drill?",
  "Je trouve que c'est une bonne idée.": "I think it's a good idea.",
  "À ton avis, la bibliothèque répond-elle aux besoins?": "In your opinion, does the library meet people's needs?",
  "Selon moi, vous donnez un excellent service.": "In my opinion, you provide excellent service.",
  // OF20 — describing / evaluating people
  "Ta nouvelle collègue, peux-tu me la décrire?": "Your new colleague — can you describe her for me?",
  "Elle est grande, brune et elle porte souvent un tailleur vert.": "She's tall, brunette, and often wears a green suit.",
  "Est-ce qu'elle a un signe distinctif?": "Does she have any distinguishing feature?",
  "Oui, elle a un grain de beauté sur la joue droite.": "Yes, she has a beauty mark on her right cheek.",
  "Que penses-tu de notre première candidate?": "What do you think of our first candidate?",
  "À mon avis, elle pourrait faire une bonne employée.": "In my opinion, she could make a good employee.",
  "Trouves-tu qu'elle est assez dynamique?": "Do you find her dynamic enough?",
  "Je ne sais pas. Elle me semble un peu rigide.": "I don't know. She seems a bit rigid to me.",
  // OF29 — ability / capability (conditionnel)
  "Qui serait capable de faire les invitations?": "Who would be able to do the invitations?",
  "Louise serait bonne là-dedans. Elle peut faire ça.": "Louise would be good at that. She can do it.",
  "Et qui est capable de parler en public?": "And who is able to speak in public?",
  "Pierre pourrait très bien s'occuper du discours.": "Pierre could handle the speech very well.",
  // OF30 — permission
  "Est-ce que je pourrais partir un peu plus tôt aujourd'hui?": "Could I leave a little earlier today?",
  "Oui, je te le permets, mais assure-toi d'aviser ton équipe.": "Yes, I'll allow it, but make sure you inform your team.",
  "Est-ce qu'on peut sortir les périodiques de la bibliothèque?": "Can periodicals be taken out of the library?",
  "Non, c'est formellement interdit.": "No, it's strictly forbidden.",
};

// ── Authored content for empty activities (keyed by OF::title) ──
type Filler = { fr: string; en: string; help: string };
const FILL: Record<string, Filler> = {
  "OF28::Prioriser pendant une absence": { fr: "En cas d'absence, traitez d'abord les dossiers urgents. = In case of absence, deal with the urgent files first.\nLe reste peut attendre mon retour. = The rest can wait until I'm back.\nSi c'est urgent, adressez-vous à ma collègue. = If it's urgent, go to my colleague.", en: "Formulas for setting priorities while you are away.", help: "Use these phrases to say what must be done first and what can wait." },
  "OF29::Concours AS-04": { fr: "Le concours AS-04 est ouvert aux candidats internes. = The AS-04 competition is open to internal candidates.\nLa date limite pour postuler est le 15 mars. = The deadline to apply is March 15.\nLes candidats retenus seront convoqués en entrevue. = Selected candidates will be invited to an interview.", en: "Vocabulary for a staffing competition (concours).", help: "Read these notice sentences; tap a line for the English." },
  "OF30::Autorisation conditionnelle": { fr: "J'autorise la dépense à condition que vous gardiez les reçus. = I authorize the expense, provided you keep the receipts.\nVous pouvez partir plus tôt, à condition de finir le rapport. = You may leave early, provided you finish the report.\nC'est accordé, mais seulement si le budget le permet. = It's granted, but only if the budget allows.", en: "Granting permission with a condition attached.", help: "Notice « à condition que » + subjunctive and « à condition de » + infinitive." },
  "OF32::Demande admissible": { fr: "Votre demande est admissible. = Your request is eligible.\nElle remplit toutes les conditions. = It meets all the conditions.\nMalheureusement, cette dépense n'est pas admissible. = Unfortunately, this expense is not eligible.", en: "Saying whether a request meets the conditions.", help: "Use « admissible / non admissible » to judge a request." },
  "OF34::Hypothèse de travail": { fr: "Partons de l'hypothèse que le budget sera approuvé. = Let's start from the assumption that the budget will be approved.\nSi c'était le cas, on commencerait en avril. = If that were the case, we'd start in April.\nSupposons que l'équipe soit au complet. = Suppose the team is complete.", en: "Stating a working hypothesis to reason about a plan.", help: "Notice the conditional and « supposons que » + subjunctive." },
  "OF36::Compte rendu bref": { fr: "Voici un bref compte rendu de la réunion. = Here is a brief summary of the meeting.\nEn résumé, le projet avance bien. = In short, the project is progressing well.\nLes points principaux sont les suivants. = The main points are as follows.", en: "Opening lines for a short report.", help: "Use these to introduce a brief summary or report." },
  "OF38::Décision et effets": { fr: "La direction a décidé de reporter le lancement. = Management decided to postpone the launch.\nPar conséquent, l'échéance change. = Consequently, the deadline changes.\nCela aura un effet sur le budget. = This will have an effect on the budget.", en: "Announcing a decision and its consequences.", help: "Notice the cause/consequence markers « par conséquent », « cela aura un effet »." },
  "OF40::Clarifier un point de vue": { fr: "Ce que je veux dire, c'est que le délai est trop court. = What I mean is that the deadline is too short.\nAutrement dit, il faut plus de temps. = In other words, we need more time.\nLaisse-moi préciser ma pensée. = Let me clarify what I mean.\nEn fait, je parlais du deuxième rapport. = Actually, I was talking about the second report.", en: "Reformulating to make a point of view clear.", help: "Use these openers to restate an idea more clearly." },
  "OF40::Demander et donner un conseil": { fr: "Qu'est-ce que tu me conseilles? = What do you advise me to do?\nÀ ta place, je parlerais au gestionnaire. = If I were you, I'd talk to the manager.\nTu devrais vérifier auprès des RH. = You should check with HR.\nJe te conseille d'attendre. = I advise you to wait.", en: "Asking for and giving advice.", help: "Notice « à ta place + conditionnel » and « tu devrais »." },
  "OF40::Faire une suggestion": { fr: "Je suggère qu'on reporte la réunion. = I suggest we postpone the meeting.\nEt si on essayait une autre méthode? = What if we tried another method?\nOn pourrait diviser le travail. = We could split up the work.\nPourquoi ne pas demander l'avis de Marie? = Why not ask Marie's opinion?", en: "Formulas for making a suggestion.", help: "Use these to propose an idea politely." },
  "OF40::Réagir à une suggestion": { fr: "C'est une bonne idée! = That's a good idea!\nJe suis d'accord avec toi. = I agree with you.\nJe ne suis pas sûr que ce soit possible. = I'm not sure that's possible.\nÇa pourrait marcher, mais... = That could work, but...", en: "Accepting, hesitating about, or rejecting a suggestion.", help: "Use these to react to someone else's idea." },
  "OF40::Persuader avec des arguments": { fr: "D'une part…, d'autre part… = On one hand…, on the other hand…\nDe plus, cette solution coûte moins cher. = Moreover, this solution costs less.\nL'avantage principal, c'est le gain de temps. = The main advantage is the time saved.\nC'est pourquoi je recommande cette option. = That's why I recommend this option.", en: "Linking words and arguments to persuade.", help: "Chain arguments with « d'une part / d'autre part / de plus »." },
};

function helpFor(t: any): string {
  if (t.table) return "Reference table — review each row: the left column names the category and the right gives the form, meaning or example.";
  const body = typeof t.fr === "string" ? t.fr : "";
  if (body.includes(" = ")) return "Each line pairs a French expression with its English meaning — tap or hover a line to review it.";
  return "Worked example — tap or hover any French sentence to reveal its English translation.";
}

let mods = 0, fixedLines = 0, addedEn = 0, titlesFixed = 0, filled = 0, removed = 0, helps = 0;

for (let of = 1; of <= 40; of++) {
  const p = join(ROOT, "content", "modules", `OF${of}.json`);
  if (!existsSync(p)) continue;
  const m = JSON.parse(readFileSync(p, "utf8"));
  const learn = m.stages?.learn;
  if (!learn) continue;
  let changed = false;

  // 1 & 2 — dialogues: text→fr, add translations
  for (const d of learn.dialogues ?? []) {
    for (const l of d.lines ?? []) {
      if (l.fr == null && typeof l.text === "string") { l.fr = l.text; delete l.text; fixedLines++; changed = true; }
      if (!l.en && l.fr && TRANS[norm(l.fr)]) { l.en = TRANS[norm(l.fr)]; addedEn++; changed = true; }
    }
  }

  // 3, 4, 5 — example texts
  const kept: any[] = [];
  for (const t of learn.exampleTexts ?? []) {
    const hasBody = typeof t.fr === "string" && t.fr.trim().length > 0;
    const isEmpty = !hasBody && !t.table;

    // 4 — empty activities
    if (isEmpty) {
      if (/note de fin/i.test(t.title ?? "")) { removed++; changed = true; continue; } // drop booklet end-notes
      const fill = FILL[`OF${of}::${t.title}`];
      if (fill) { t.fr = fill.fr; t.en = t.en || fill.en; t.help = fill.help; filled++; changed = true; }
    }

    // 3 — titles: promote first line when missing, strip "Activité NN —" prefix
    if (!t.title && typeof t.fr === "string" && t.fr.trim()) {
      const lines = t.fr.split("\n");
      const first = (lines[0] ?? "").trim();
      const cleaned = first.replace(/^Activité[\s\d,]*(et[\s\d,]*)*[—:–-]\s*/i, "").trim();
      t.title = cleaned || first;
      const rest = lines.slice(1).join("\n").trim();
      if (rest) t.fr = rest; // remove the title line from the body
      titlesFixed++; changed = true;
    } else if (typeof t.title === "string") {
      const cleaned = t.title.replace(/^Activité[\s\d,]*(et[\s\d,]*)*[—:–-]\s*/i, "").trim();
      if (cleaned && cleaned !== t.title) { t.title = cleaned; titlesFixed++; changed = true; }
    }

    // 5 — help text
    if (!t.help) { t.help = helpFor(t); helps++; changed = true; }

    kept.push(t);
  }
  if (learn.exampleTexts) learn.exampleTexts = kept;

  if (changed) { writeFileSync(p, JSON.stringify(m, null, 2)); mods++; }
}

console.log(`Modules updated: ${mods}`);
console.log(`Dialogue lines repaired (text→fr): ${fixedLines}`);
console.log(`Dialogue translations added: ${addedEn}`);
console.log(`Titles promoted/cleaned: ${titlesFixed}`);
console.log(`Empty activities filled: ${filled} · end-notes removed: ${removed}`);
console.log(`Help lines added: ${helps}`);
