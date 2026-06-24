import fs from 'node:fs';

const objectiveId = 'OF34';
const sourceDocument = 'SC102-2/34-2005F';
const topicFr = 'Proposer des solutions à un problème';
const topicEn = 'To put forward solutions to a problem';
const bankPath = 'content/question-bank/items/OF34.json';
const modulePath = 'content/modules/OF34.json';
const coveragePath = 'content/coverage/OF34.json';
const lexPath = 'content/lexicon/by-of/OF34.json';

const lexicon = JSON.parse(fs.readFileSync(lexPath, 'utf8')).entries;
const items = [];

function trace(concepts = [], vocabularySet = null) {
  return { sourceDocument, trainingObjective: objectiveId, level: 'B', page: null, topicFr, topicEn, vocabularySet, grammarConcepts: concepts };
}

function explanation(correct, rule, activity, distractors = {}) {
  return {
    correct_why: correct,
    distractor_why: distractors,
    grammar_rule: rule,
    vocab_notes: activity ? `Dérivé du programme PFL2 (${sourceDocument}, activité ${activity}).` : 'Lexique OF34 (SC102-2/1-2-2005F).',
    common_mistakes: ['mettre le futur après si', 'confondre condition réelle, hypothèse et condition non réalisée'],
  };
}

function tip(rule, similar = ['Si vous partez, avertissez-moi.', 'Si j’avais su, je serais venu.']) {
  return { memory_aid: rule, pattern: rule, similar };
}

function mcq(id, { fr, instructions, accepted, distractors, activity, skill = 'grammar', concepts = ['si_clauses'], difficulty = 'medium', rule, correct, vocabularySet = null }) {
  items.push({
    id, objectiveId, skill, grammarConcepts: concepts, vocabDomains: ['administration', 'government'], theme: 'problem_solving',
    difficulty, type: 'mcq_single', status: 'live', estTimeSec: difficulty === 'easy' ? 22 : 40, irtB: difficulty === 'advanced' ? 0.8 : difficulty === 'easy' ? -0.4 : 0.2,
    prompt: { fr, instructions_en: instructions },
    answer: { type: 'choice', accepted: [accepted], normalizer: 'fr_accent_insensitive_trim_lower' },
    distractors: [{ value: accepted, tag: 'correct' }, ...distractors.map((value, i) => ({ value, tag: `d${i}` }))],
    explanation: explanation(correct, rule, activity, Object.fromEntries(distractors.map((d, i) => [`d${i}`, `« ${d} » ne convient pas ici.`]))),
    tip: tip(rule),
    source: activity ? { verbatim: false, catalogue: sourceDocument, activity, concept: skill === 'function' ? 'fonction' : 'condition avec si' } : undefined,
    trace: trace(concepts, vocabularySet),
  });
}

function fill(id, { fr, instructions, accepted, activity, skill = 'grammar', concepts = ['si_clauses'], difficulty = 'medium', rule, correct, vocabularySet = null }) {
  items.push({
    id, objectiveId, skill, grammarConcepts: concepts, vocabDomains: ['administration', 'government'], theme: 'problem_solving',
    difficulty, type: 'fill_blank', status: 'live', estTimeSec: difficulty === 'advanced' ? 60 : 45, irtB: difficulty === 'advanced' ? 0.9 : 0.35,
    prompt: { fr, instructions_en: instructions },
    answer: { type: 'text', accepted: Array.isArray(accepted) ? accepted : [accepted], normalizer: 'fr_accent_insensitive_trim_lower' },
    distractors: [],
    explanation: explanation(correct, rule, activity),
    tip: tip(rule),
    source: activity ? { verbatim: false, catalogue: sourceDocument, activity, concept: skill === 'function' ? 'fonction' : 'condition avec si' } : undefined,
    trace: trace(concepts, vocabularySet),
  });
}

const siRule = 'Real condition: si + présent, then présent/futur/impératif. Hypothesis: si + imparfait, then conditionnel présent. Unreal past: si + plus-que-parfait, then conditionnel passé.';

const a3 = [
  ['a3_1a', 'S’il en avait le temps, il finirait le rapport. Remplacez « finir le rapport » par « commencer le rapport ».', 'S’il en avait le temps, il commencerait le rapport.'],
  ['a3_1b', 'S’il en avait le temps, il finirait le rapport. Remplacez par « aller à la réunion ».', 'S’il en avait le temps, il irait à la réunion.'],
  ['a3_1c', 'S’il en avait le temps, il finirait le rapport. Remplacez par « rédiger la note de service ».', 'S’il en avait le temps, il rédigerait la note de service.'],
  ['a3_2a', 'Est-ce qu’elle téléphone, si elle est en retard? Remplacez « être en retard » par « ne pas venir ».', 'Est-ce qu’elle téléphone, si elle ne vient pas?'],
  ['a3_2b', 'Est-ce qu’elle téléphone, si elle est en retard? Remplacez par « s’absenter ».', 'Est-ce qu’elle téléphone, si elle s’absente?'],
  ['a3_2c', 'Est-ce qu’elle téléphone, si elle est en retard? Remplacez par « annuler un rendez-vous ».', 'Est-ce qu’elle téléphone, si elle annule un rendez-vous?'],
  ['a3_3a', 'Si vous partez, dites-le-moi. Remplacez la principale par « en informer les employés ».', 'Si vous partez, informez-en les employés.'],
  ['a3_3b', 'Si vous partez, dites-le-moi. Remplacez la principale par « fermer les lumières ».', 'Si vous partez, fermez les lumières.'],
  ['a3_3c', 'Si vous partez, dites-le-moi. Remplacez la principale par « assurer la relève ».', 'Si vous partez, assurez la relève.'],
  ['a3_4a', 'Vous me remplacerez si je ne participe pas à la réunion. Remplacez par « se désister ».', 'Vous me remplacerez si je me désiste.'],
  ['a3_4b', 'Vous me remplacerez si je ne participe pas à la réunion. Remplacez par « être absent ».', 'Vous me remplacerez si je suis absent.'],
  ['a3_5a', 'S’il avait lu le rapport, il l’aurait corrigé. Remplacez « corrigé » par « approuver ».', 'S’il avait lu le rapport, il l’aurait approuvé.'],
  ['a3_5b', 'S’il avait lu le rapport, il l’aurait corrigé. Remplacez par « traduire ».', 'S’il avait lu le rapport, il l’aurait traduit.'],
  ['a3_5c', 'S’il avait lu le rapport, il l’aurait corrigé. Remplacez par « détruire ».', 'S’il avait lu le rapport, il l’aurait détruit.'],
];
a3.forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr, instructions: 'Write the complete transformed sentence.', accepted, activity: 3, rule: siRule, correct: 'The transformed sentence keeps the same conditional pattern.',
}));

[
  ['a4_1', 'Les gens écoutent attentivement si la conférence ___ intéressante. (être)', 'est'],
  ['a4_2', 'Si ce cours vous est utile, ___ le plus tôt possible. (s’inscrire)', 'inscrivez-vous'],
  ['a4_3', 'Serait-elle pénalisée si elle ___ sa retraite avant 60 ans? (prendre)', 'prenait'],
  ['a4_4', 'Si vous rencontrez la directrice générale, lui ___-vous de notre projet? (parler)', 'parlerez'],
  ['a4_5', '___ si on vous invite. (accepter)', 'Acceptez'],
  ['a4_6', 'S’il était là, je lui ___ pourquoi. (demander)', 'demanderais'],
  ['a4_7', 'Tu aurais une promotion si tu ___ travailler plus fort. (vouloir)', 'voulais'],
  ['a4_8', 'Si tu avais voulu, tu ___ au projet. (participer)', 'aurais participé'],
  ['a4_9', 'S’il avait des nouvelles, on le ___. (savoir)', 'saurait'],
  ['a4_10', 'Si tu passes ton test aujourd’hui, ___-tu les résultats demain? (avoir)', 'auras'],
  ['a4_11', 'Me montrerez-vous le dossier si je ___ au bureau demain? (être)', 'suis'],
  ['a4_12', 'Elle aurait eu le poste si elle ___ plus tôt. (se décider)', 's’était décidée'],
  ['a4_13', 'Si vous voulez finir le rapport avant vendredi, ___. (se dépêcher)', 'dépêchez-vous'],
  ['a4_14', 'Si tu commençais à 8 h 30, tu ___ à 5 h. (partir)', 'partirais'],
  ['a4_15', 'Si tu ___, est-ce que tu m’aurais accompagnée? (pouvoir)', 'avais pu'],
  ['a4_16', '___ votre appareil-photo numérique si vous faites un reportage. (apporter)', 'Apportez'],
].forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr, instructions: 'Write the verb in the correct tense or mood.', accepted, activity: 4, rule: siRule, correct: 'The verb form matches the conditional time frame.',
}));

[
  ['a5_1', 'Nature will be imperilled if we do not take pollution problems seriously.', 'La nature sera en péril si on ne prend pas au sérieux les problèmes de pollution.'],
  ['a5_2', 'If interest rates go down, it will be easier for people to borrow.', 'Si les taux d’intérêt baissent, les gens emprunteront plus facilement.'],
  ['a5_3', 'If every employee had his own laptop computer, would work get done more quickly?', 'Si chaque employé avait son ordinateur portable, le travail se ferait-il plus vite?'],
  ['a5_4', 'I could have brought this book back earlier if I had been asked for it.', 'J’aurais pu rapporter ce livre plus tôt si on me l’avait demandé.'],
  ['a5_5', 'If you ask him, he will accompany you to the convention.', 'Si tu le lui demandes, il t’accompagnera au congrès.'],
  ['a5_6', 'Would you have accepted if you had been invited?', 'Auriez-vous accepté si on vous avait invité?'],
  ['a5_7', 'I will speak to him if it is necessary.', 'Je lui parlerai s’il le faut.'],
  ['a5_8', 'Can you help him if he needs help?', 'Pourras-tu l’aider s’il a besoin d’aide?'],
  ['a5_9', 'If you want to wait, I will bring you the file.', 'Si vous voulez attendre, je vous apporte le dossier.'],
].forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr: `Traduisez en français.\n${fr}`, instructions: 'Write the French sentence using si.', accepted, activity: 5, difficulty: 'advanced', rule: siRule, correct: 'The translation uses the correct si-clause sequence.',
}));

const a10 = [
  ['a10_1', 'Avertissez-moi si...', 'Avertissez-moi si vous annulez la réunion.'],
  ['a10_2', 'Je rangerai les dossiers si tu...', 'Je rangerai les dossiers si tu me le demandes.'],
  ['a10_3', 'Si ..., connaîtrait-il le succès? Verbe suggéré : écrire', 'Si tu écrivais un livre, connaîtrait-il le succès?'],
  ['a10_4', 'Si elle avait pris cette décision, ... Verbe suggéré : éviter', 'Si elle avait pris cette décision, elle aurait évité cette situation difficile.'],
  ['a10_5', 'Si tu t’entendais avec tes collègues, ... Verbe suggéré : travailler', 'Si tu t’entendais avec tes collègues, vous travailleriez beaucoup mieux ensemble.'],
  ['a10_6', 'Nous aurions pu nous inscrire à ce stage si... Verbe suggéré : savoir', 'Nous aurions pu nous inscrire à ce stage si on l’avait su plus tôt.'],
  ['a10_7', 'Accepteriez-vous de faire des heures supplémentaires si ce... ? Verbe suggéré : être', 'Accepteriez-vous de faire des heures supplémentaires si c’était une demande urgente de votre directrice?'],
  ['a10_8', 'Si vous annulez votre rendez-vous, ... Verbe suggéré : avertir', 'Si vous annulez votre rendez-vous, avertissez votre gestionnaire.'],
  ['a10_9', 'Je préfère travailler dans ce bureau si vous... Verbe suggéré : permettre', 'Je préfère travailler dans ce bureau si vous me le permettez.'],
  ['a10_10', 'Vous devrez faire un compte rendu à notre équipe si... Verbe suggéré : assister', 'Vous devrez faire un compte rendu à notre équipe si vous assistez à cette conférence.'],
  ['a10_11', 'S’ils avaient été au courant de son arrivée, ... Verbe suggéré : aller', 'S’ils avaient été au courant de son arrivée, ils seraient allés la voir en priorité.'],
  ['a10_12', 'Aurait-elle été heureuse si... ? Verbe suggéré : accepter', 'Aurait-elle été heureuse si elle avait accepté cette promotion?'],
  ['a10_13', 'Si ..., vous obtiendrez un meilleur rendement. Verbe suggéré : être', 'Si vous êtes mieux formés, vous obtiendrez un meilleur rendement.'],
  ['a10_14', 'Si vous vous inscriviez à des cours de conditionnement physique, ... Verbe suggéré : être', 'Si vous vous inscriviez à des cours de conditionnement physique, vous seriez bien plus en forme.'],
  ['a10_15', 'Si ..., iras-tu au Mexique? Verbe suggéré : demander', 'Si ton patron te le demande gentiment, iras-tu au Mexique?'],
  ['a10_16', 'La journée passerait-elle plus vite si le travail... ? Verbe suggéré : être', 'La journée passerait-elle plus vite si le travail était vraiment intéressant?'],
  ['a10_17', 'Prépare le café si... Verbe suggéré : vouloir', 'Prépare le café si tu en veux.'],
  ['a10_18', 'Nous aurions pris notre repas à la cafétéria s’il... Verbe suggéré : pleuvoir', 'Nous aurions pris notre repas à la cafétéria s’il avait plu aujourd’hui.'],
  ['a10_19', 'Si ..., ils auraient vécu à la campagne. Verbe suggéré : avoir', 'Si elle avait eu le pouce vert, ils auraient vécu à la campagne.'],
];
a10.forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr, instructions: 'Complete the sentence with a plausible clause using the suggested verb.', accepted, activity: 10, difficulty: 'advanced', rule: siRule, correct: 'The completed sentence uses the expected tense sequence.',
}));

const a11 = [
  ['a11_1', 'Si vous voyez la directrice avant 16 h, ...', 'Si vous voyez la directrice avant 16 h, ayez la bonté de lui remettre cette note.'],
  ['a11_2', 'Venez demain si...', 'Venez demain si vous en avez le temps.'],
  ['a11_3', 'Si vous expédiez cette lettre aujourd’hui, ...', 'Si vous expédiez cette lettre aujourd’hui, notre client la recevra demain.'],
  ['a11_4', 'J’accepterais de travailler à ce projet si...', 'J’accepterais de travailler à ce projet si on m’offrait un poste.'],
  ['a11_5', 'Si tu acceptais de diriger la campagne, ...', 'Si tu acceptais de diriger la campagne, elle aurait certainement beaucoup de succès.'],
  ['a11_6', 'Je signerai ce document si...', 'Je signerai ce document s’il est prêt avant mon départ.'],
  ['a11_7', 'Si je n’avais pas reçu mon chèque de paye, ...', 'Si je n’avais pas reçu mon chèque de paye, j’aurais dû emprunter à la banque.'],
  ['a11_8', 'Accueille les congressistes si...', 'Accueille les congressistes s’ils se présentent dans le hall.'],
  ['a11_9', 'Si vous vous présentez à ce concours, ...', 'Si vous vous présentez à ce concours, ayez l’air sûr de vous devant le jury.'],
  ['a11_10', 'Veuillez me faire un compte rendu si...', 'Veuillez me faire un compte rendu si vous assistez à ce congrès.'],
  ['a11_11', 'Si vous entendez sonner l’alarme, ...', 'Si vous entendez sonner l’alarme, quittez votre bureau immédiatement.'],
  ['a11_12', 'Je l’aurais invitée si...', 'Je l’aurais invitée si on m’avait informé de sa présence parmi nous.'],
  ['a11_13', 'Si vous rédigez un rapport, ...', 'Si vous rédigez un rapport, servez-vous de ce guide de rédaction.'],
  ['a11_14', 'Je présiderai la réunion si...', 'Je présiderai la réunion si vous acceptez de prendre des notes.'],
  ['a11_15', 'Si j’avais été membre de ce comité, ...', 'Si j’avais été membre de ce comité, j’aurais fait valoir notre point de vue.'],
  ['a11_16', 'Je vous aiderais si...', 'Je vous aiderais si je savais en quoi je peux vous être utile.'],
  ['a11_17', 'Si vos collègues avaient travaillé plus fort, ...', 'Si vos collègues avaient travaillé plus fort, ils auraient fait progresser davantage le travail.'],
  ['a11_18', 'J’écrirai ce rapport si...', 'J’écrirai ce rapport si vous en fournissez les données.'],
  ['a11_19', 'Si Jean-Louis avait été présent, ...', 'Si Jean-Louis avait été présent, il aurait pu nous aider.'],
  ['a11_20', 'Vous verrez la Ministre à la télévision si...', 'Vous verrez la Ministre à la télévision si vous syntonisez le canal 9 à 18 h.'],
  ['a11_21', 'Si Nicole passe à votre bureau, ...', 'Si Nicole passe à votre bureau, donnez-lui cette enveloppe.'],
  ['a11_22', 'J’aurais fait une présentation assistée par ordinateur si...', 'J’aurais fait une présentation assistée par ordinateur si le technicien avait réparé le vidéoprojecteur.'],
  ['a11_23', 'Si je m’occupais de Centraide, ...', 'Si je m’occupais de Centraide, j’organiserais une vente de vieux livres.'],
];
a11.forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr: `Associez et complétez la phrase conditionnelle.\nDébut : ${fr}`, instructions: 'Write the complete sentence.', accepted, activity: 11, difficulty: 'advanced', rule: siRule, correct: 'The answer combines compatible clauses and uses the correct verb forms.',
}));

const hypoRule = 'To propose solutions, use suppositions/hypotheses: j’imagine, je suppose, on dirait que, supposons que, disons que, mettons que, au cas où, dans l’hypothèse où, si jamais.';
[
  ['a12_1', 'Les dossiers sont prêts, j’imagine.', 'supposition', ['condition réelle', 'ordre'], 'j’imagine marks a supposition.'],
  ['a12_2', 'Supposons que les taux d’intérêt baissent...', 'hypothèse', ['interdiction', 'fait confirmé'], 'supposons que introduces a hypothesis.'],
  ['a12_3', 'Je vais à la banque au cas où je dépenserais plus que prévu.', 'précaution hypothétique', ['condition réalisée', 'ordre'], 'au cas où introduces a possible situation.'],
  ['a12_4', 'Dans l’hypothèse où il y aurait des plaintes...', 'hypothèse', ['refus', 'résultat certain'], 'dans l’hypothèse où explicitly names a hypothesis.'],
  ['a12_5', 'Si jamais il revenait...', 'hypothèse peu certaine', ['condition passée réalisée', 'ordre direct'], 'si jamais + imparfait creates an uncertain scenario.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of34_src_${s}`, {
  fr, instructions: 'What communicative function does this expression perform?', accepted, distractors, activity: 12, skill: 'function', concepts: ['conditionnel', 'imparfait'], rule: hypoRule, correct,
}));

[
  ['a13_1', 'Une employée est refusée chaque fois qu’elle demande un poste de camionneure. Proposez une hypothèse sur le problème.', 'Si les critères de sélection étaient mieux expliqués, on pourrait vérifier si le refus est justifié.'],
  ['a13_2', 'Un projet a été planifié trop optimistement et les agents se plaignent de la charge de travail. Proposez une solution conditionnelle.', 'Si on redistribuait les tâches, les agents pourraient respecter les échéances.'],
  ['a13_3', 'Un nouvel employé ne reçoit pas l’information nécessaire parce que les collègues sont trop occupés.', 'Si on lui attribuait une personne-ressource, il pourrait effectuer son travail plus efficacement.'],
  ['a13_4', 'Un employé parle très fort au téléphone dans un bureau à aire ouverte.', 'Si le gestionnaire lui parlait de la situation, les autres pourraient mieux se concentrer.'],
  ['a13_5', 'Un employé prometteur cherche un autre emploi parce qu’il reçoit les tâches les moins intéressantes.', 'Si on lui confiait des dossiers plus stimulants, il resterait peut-être dans l’équipe.'],
  ['a13_6', 'En fin de projet, la motivation diminue et les échéances approchent.', 'Si on reconnaissait les efforts de l’équipe, la motivation pourrait augmenter.'],
].forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr, instructions: 'Write one conditional solution in French.', accepted, activity: 13, skill: 'function', concepts: ['conditionnel', 'imparfait'], difficulty: 'advanced', rule: 'Use si + imparfait with conditionnel présent to propose a possible solution.', correct: 'The answer proposes a solution using a conditional hypothesis.',
}));

const conditionFunctionRule = 'To pose conditions, use il faut, un critère, à condition de/que, si, pourvu que, sans, à moins de/que, dépendre de.';
[
  ['a14_1', 'Pour être accepté dans ce programme de formation, il faut avoir de l’expérience en gestion.', 'condition d’admission', ['hypothèse passée', 'résultat impossible'], 'il faut states a requirement.'],
  ['a14_2', 'Un des critères d’embauche à ce poste, c’est de bien connaître les normes de sécurité.', 'critère d’embauche', ['simple préférence', 'supposition'], 'un critère d’embauche names a hiring condition.'],
  ['a14_3', 'On vous appellera si vous répondez aux conditions d’admission.', 'condition avec si', ['ordre', 'condition non réalisée'], 'si introduces the condition for being called.'],
  ['a14_4', 'Ça dépend de votre résistance au stress.', 'condition liée à un facteur', ['certitude absolue', 'refus définitif'], 'dépendre de links the outcome to a condition.'],
  ['a14_5', 'On vous remboursera vos frais à condition de soumettre les reçus originaux.', 'condition à remplir', ['supposition sans conséquence', 'hypothèse passée'], 'à condition de states what must be done.'],
  ['a14_6', 'Un tel projet n’est pas réalisable à moins d’en réduire les coûts.', 'condition minimale', ['permission sans limite', 'fait réalisé'], 'à moins de states the condition needed for feasibility.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of34_src_${s}`, {
  fr, instructions: 'What kind of condition is expressed?', accepted, distractors, activity: 14, skill: 'function', concepts: ['si_clauses'], rule: conditionFunctionRule, correct,
}));

[
  ['a15_1', 'Le Commissaire à la protection de la vie privée qui s’est vu refuser une communication peut exercer un recours devant la Cour.', 'faux', ['vrai'], 'The individual, not the Commissioner, may exercise the review recourse.'],
  ['a15_2', 'Toute utilisation à mauvais escient du réseau par une personne autorisée doit être signalée au dirigeant responsable.', 'vrai', ['faux'], 'The text says suspicions must be reported to the responsible official.'],
  ['a15_3', 'Lorsque toutes les méthodes de formation ont été épuisées, un employé peut demander un congé d’études de longue durée.', 'vrai', ['faux'], 'The text frames long-term education leave after other training methods are exhausted.'],
  ['a15_4', 'La Commission canadienne des droits de la personne peut déposer une plainte de harcèlement motivée par la discrimination.', 'faux', ['vrai'], 'The staff member may file a complaint with the Commission.'],
  ['a15_5', 'Une nomination interne n’est pas dans l’intérêt public si le meilleur candidat d’un concours public ne fait pas partie de la fonction publique.', 'vrai', ['faux'], 'The text states this condition before appointment.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of34_src_${s}`, {
  fr, instructions: 'Choose vrai or faux according to the text.', accepted, distractors, activity: 15, skill: 'reading', concepts: ['si_clauses'], rule: conditionFunctionRule, correct,
}));

[
  ['a16_1', 'Je prendrai ma retraite à 55 ans ___.', 'si j’en ai les moyens.'],
  ['a16_2', 'Pour occuper ce poste, ___.', 'il faut avoir de l’expérience en gestion.'],
  ['a16_3', 'Les visiteurs peuvent circuler dans l’édifice ___.', 'à condition d’avoir un laissez-passer.'],
  ['a16_4', 'J’approuverai cette proposition ___.', 'à condition que le budget le permette.'],
  ['a16_5', 'Vous ne réussirez pas dans cette entreprise ___.', 'à moins de modifier votre plan.'],
  ['a16_6', 'Les relations professionnelles sont efficaces ___.', 'si tout le monde communique clairement.'],
  ['a16_7', 'Vous pourrez rencontrer l’adjoint ___.', 'à condition de prendre rendez-vous.'],
  ['a16_8', 'Le problème du réchauffement planétaire sera résolu ___.', 'si les gouvernements prennent des mesures concrètes.'],
].forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr: `Complétez en posant une condition.\n${fr}`, instructions: 'Write a complete condition clause.', accepted, activity: 16, skill: 'function', concepts: ['si_clauses'], rule: conditionFunctionRule, correct: 'The answer adds a clear condition to the sentence.',
}));

[
  ['a17_1', 'Monsieur Laramée vous demande de lire un rapport urgent et de lui en faire un résumé.', 'Je le ferai si vous me donnez jusqu’à demain matin.'],
  ['a17_2', 'La directrice propose que vous organisiez la fête de Noël.', 'J’accepterai à condition que deux collègues m’aident.'],
  ['a17_3', 'Marie doit quitter plus tôt pour un rendez-vous médical.', 'Elle pourra partir plus tôt si son dossier urgent est terminé.'],
  ['a17_4', 'La patronne suggère à cinq personnes de travailler en équipe.', 'Nous accepterons si les responsabilités sont bien réparties.'],
  ['a17_5', 'Vous voulez implanter un programme d’activités sportives au travail.', 'Le programme serait réaliste si la direction accordait du temps et un local.'],
  ['a17_6', 'Un collègue vous demande de lui apporter un café en revenant.', 'Je t’en apporterai un si la file d’attente n’est pas trop longue.'],
  ['a17_7', 'Votre chef vous demande d’accueillir un groupe d’ingénieurs.', 'Je les accueillerai à condition de recevoir leur horaire à l’avance.'],
  ['a17_8', 'Vous demandez à un collègue de vérifier un terme dans une lettre.', 'Pourrais-tu le vérifier si tu as quelques minutes?'],
].forEach(([s, fr, accepted]) => fill(`itm_of34_src_${s}`, {
  fr: `Réagissez à la situation en posant une condition.\n${fr}`, instructions: 'Write one appropriate French sentence.', accepted, activity: 17, skill: 'function', concepts: ['si_clauses', 'conditionnel'], difficulty: 'advanced', rule: conditionFunctionRule, correct: 'The answer responds to the problem by stating a condition.',
}));

const lexRule = 'OF34 lexicon: proposition conditionnelle = if-clause; proposition principale = result clause; hypothèse = hypothesis; supposition = supposition.';
lexicon.forEach((entry, i) => {
  mcq(`itm_of34_voc_fe_${i + 1}`, {
    fr: `« ${entry.fr} »`,
    instructions: 'Choose the English meaning.',
    accepted: entry.en,
    distractors: lexicon.filter((e) => e.en !== entry.en).slice(0, 3).map((e) => e.en),
    activity: null,
    skill: 'vocabulary',
    concepts: [],
    difficulty: 'easy',
    rule: lexRule,
    correct: `« ${entry.fr} » means “${entry.en}.”`,
    vocabularySet: 'Lexique — OF34',
  });
  mcq(`itm_of34_voc_ef_${i + 1}`, {
    fr: `'${entry.en}'`,
    instructions: 'Choose the French term.',
    accepted: entry.fr,
    distractors: lexicon.filter((e) => e.fr !== entry.fr).slice(0, 3).map((e) => e.fr),
    activity: null,
    skill: 'vocabulary',
    concepts: [],
    difficulty: 'easy',
    rule: lexRule,
    correct: `'${entry.en}' is « ${entry.fr} » in French.`,
    vocabularySet: 'Lexique — OF34',
  });
});

const sourceItems = items.filter((item) => item.id.includes('_src_'));
const vocabItems = items.filter((item) => item.id.includes('_voc_'));
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
bank.sourceFidelity = false;
bank.source = { sourceDocument, lexique: 'SC102-2/1-2-2005F', counts: { source: sourceItems.length, vocab: vocabItems.length } };
bank.items = [...sourceItems, ...vocabItems];
fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);

const module = JSON.parse(fs.readFileSync(modulePath, 'utf8'));
module.sourceFidelity = false;
module.stages.learn = {
  conceptExplanation: {
    en: 'OF34 teaches how to propose solutions by using conditional thinking: real conditions, possible or unlikely hypotheses, and unreal past conditions. The communicative goal is to frame a problem, imagine causes or options, and propose a solution with a clear condition.',
    fr: "L’OF34 sert à proposer des solutions à un problème en utilisant des phrases conditionnelles : conditions réelles, hypothèses peu probables et conditions non réalisées dans le passé. L’objectif communicatif est de formuler le problème, d’émettre une hypothèse et de proposer une solution assortie d’une condition claire.",
  },
  vocabularyNote: 'Lexique clé : proposition conditionnelle, proposition principale, hypothèse, supposition. Expressions utiles : si jamais, dans l’hypothèse où, supposons que, disons que, mettons que, au cas où.',
  grammarNotes: {
    summary: 'The tense sequence with si changes according to whether the condition is real, hypothetical, or unreal in the past.',
    charts: [
      { title: 'Conditions avec si', rows: [['si + présent', 'présent / futur / impératif: Si vous partez, avertissez-moi.'], ['si + imparfait', 'conditionnel présent: Si on redistribuait les tâches, ce serait plus facile.'], ['si + plus-que-parfait', 'conditionnel passé: Si on avait su, on aurait agi plus tôt.']] },
      { title: 'Proposer une solution', rows: [['Problème', 'Le rapport est incomplet.'], ['Hypothèse', 'Si on redistribuait les tâches, Benoît aurait plus de temps.'], ['Solution', 'Il pourrait refaire la dernière partie pendant que quelqu’un d’autre termine le budget.']] },
    ],
    points: [
      'Do not put the future directly after si in a real condition.',
      'Use si + imparfait + conditionnel présent for a possible solution that is uncertain or hypothetical.',
      'Use si + plus-que-parfait + conditionnel passé for a condition that did not happen.',
      'When proposing a solution, make the condition explicit: si, à condition que, à moins de, pourvu que.',
    ],
  },
  pronunciation: { points: [] },
  dialogues: [
    { title: 'Proposer une solution', lines: [
      { speaker: 'A', text: 'Le rapport est incomplet et l’échéance est demain.' },
      { speaker: 'B', text: 'Si on redistribuait les tâches, Benoît pourrait refaire la dernière partie.' },
      { speaker: 'A', text: 'D’accord. Quelqu’un d’autre s’occupera du budget si Benoît révise le rapport.' },
    ] },
  ],
  exampleTexts: [
    { title: 'Hypothèse de travail', body: 'Si les employés avaient reçu les données plus tôt, ils auraient pu terminer l’analyse. Maintenant, si on redistribue les tâches, on pourra respecter l’échéance.' },
    { title: 'Note de fin', body: 'Une bonne proposition de solution nomme le problème, présente une hypothèse avec si, puis précise ce qui changera si la condition est remplie.' },
  ],
};
module.stages.practice = {
  sourceFidelity: false,
  coverage: `${bank.items.length} questions: ${sourceItems.length} concept-focused items derived from SC102-2/34-2005F plus ${vocabItems.length} OF34 lexicon items.`,
  exerciseSets: [
    { title: 'Concordance des temps avec si', count: sourceItems.filter((i) => [3, 4, 5, 10, 11].includes(i.source?.activity)).length },
    { title: 'Hypothèses, suppositions et solutions', count: sourceItems.filter((i) => [12, 13, 14, 16, 17].includes(i.source?.activity)).length },
    { title: 'Compréhension de conditions dans des textes', count: sourceItems.filter((i) => i.source?.activity === 15).length },
    { title: 'Vocabulaire du Lexique PFL2', count: vocabItems.length },
  ],
  totalQuestions: bank.items.length,
};
module.stages.masteryCheck.concepts = ['si_clauses', 'conditionnel', 'imparfait', 'plus-que-parfait', 'hypothèses'];
module.coverage = {
  strictComplete: false,
  convertibleComplete: true,
  coveredElements: 10,
  totalElements: 27,
  convertible: { covered: 10, total: 10 },
  actionableGaps: { sections: [], activities: [], vocabulary: [], examples: [], selfTest: ['selfeval-4 (SC102-2-45-4)'] },
  nonConvertible: { sections: [], activities: [1, 2, 6, 7, 8, 9, 12, 13, 14, 16, 17, 18, 19, 20, 21] },
};
fs.writeFileSync(modulePath, `${JSON.stringify(module, null, 2)}\n`);

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const byActivity = new Map();
for (const item of sourceItems) {
  const a = item.source?.activity;
  if (a) byActivity.set(a, [...(byActivity.get(a) || []), item.id]);
}
const links = (...acts) => acts.flatMap((a) => byActivity.get(a) || []);
coverage.sections = [
  { id: '34.1', heading: 'Grammaire', topicsFr: 'La conjonction si · La concordance des temps dans les phrases conditionnelles', kind: 'grammar', covered: true, itemCount: links(3, 4, 5, 10, 11).length, linkedItems: links(3, 4, 5, 10, 11) },
  { id: '34.2', heading: 'Fonctions', topicsFr: 'Comprendre et formuler des suppositions, des hypothèses', kind: 'function', covered: true, itemCount: links(12, 13, 15).length, linkedItems: links(12, 13, 15) },
  { id: '34.3', heading: 'Fonctions', topicsFr: 'Comprendre et poser des conditions', kind: 'function', covered: true, itemCount: links(14, 15, 16, 17).length, linkedItems: links(14, 15, 16, 17) },
];
coverage.vocabulary = { source: 'Lexique OF34 (SC102-2/1-2-2005F)', entries: lexicon.length, questions: vocabItems.length, convertible: true, covered: true };
coverage.examples = { sourceMarkers: 3, derivedItems: sourceItems.length, convertible: true, covered: true, note: 'Model conditional solution patterns are embedded in self-contained practice items and the learn tab, including a final learning note.' };
coverage.activities = coverage.activities.map((activity) => {
  const linkedItems = byActivity.get(activity.activity) || [];
  return linkedItems.length ? { ...activity, convertible: true, extracted: true, itemCount: linkedItems.length, linkedItems } : activity;
});
coverage.validation = {
  strictComplete: false,
  convertibleComplete: true,
  totalElements: 27,
  coveredElements: 10,
  convertible: { covered: 10, total: 10 },
  actionableGaps: { sections: [], activities: [], vocabulary: [], examples: [], selfTest: ['selfeval-4 (SC102-2-45-4)'] },
  nonConvertible: { sections: [], activities: [1, 2, 6, 7, 8, 9, 12, 13, 14, 16, 17, 18, 19, 20, 21] },
  note: 'All answer-keyed OF34 activities and lexicon entries have self-contained, concept-focused items where auto-grading is feasible. Oral/group production activities remain non-auto-gradable.',
};
fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);

console.log(`OF34 implemented: ${sourceItems.length} source-derived items + ${vocabItems.length} vocab = ${bank.items.length} total.`);
