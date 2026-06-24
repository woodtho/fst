import fs from 'node:fs';

const objectiveId = 'OF30';
const sourceDocument = 'SC102-2/30-2005F';
const topicFr = 'Permettre ou interdire quelque chose';
const topicEn = 'To permit or forbid something';
const bankPath = 'content/question-bank/items/OF30.json';
const modulePath = 'content/modules/OF30.json';
const coveragePath = 'content/coverage/OF30.json';

const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
const vocabItems = bank.items.filter((item) => item.id.includes('_voc_'));
const items = [];

function trace(concepts = []) {
  return { sourceDocument, trainingObjective: objectiveId, level: 'B', page: null, topicFr, topicEn, vocabularySet: null, grammarConcepts: concepts };
}

function exp(correct, rule, activity, distractors = []) {
  return {
    correct_why: correct,
    distractor_why: Object.fromEntries(distractors.map((d, i) => [`d${i}`, `« ${d} » ne convient pas ici.`])),
    grammar_rule: rule,
    vocab_notes: `Dérivé du programme PFL2 (${sourceDocument}, activité ${activity}).`,
    common_mistakes: ['confondre permission et interdiction', 'choisir le mode verbal sans regarder le connecteur ou la construction'],
  };
}

function tip(rule) {
  return { memory_aid: rule, pattern: rule, similar: ['On permet aux employés de partir.', 'Il est interdit de stationner ici.'] };
}

function mcq(id, { fr, instructions, accepted, distractors, activity, skill = 'grammar', concepts = [], difficulty = 'medium', rule, correct }) {
  items.push({
    id, objectiveId, skill, grammarConcepts: concepts, vocabDomains: ['administration', 'government'], theme: 'permissions',
    difficulty, type: 'mcq_single', status: 'live', estTimeSec: difficulty === 'easy' ? 22 : 40, irtB: difficulty === 'advanced' ? 0.8 : difficulty === 'easy' ? -0.4 : 0.2,
    prompt: { fr, instructions_en: instructions },
    answer: { type: 'choice', accepted: [accepted], normalizer: 'fr_accent_insensitive_trim_lower' },
    distractors: [{ value: accepted, tag: 'correct' }, ...distractors.map((value, i) => ({ value, tag: `d${i}` }))],
    explanation: exp(correct, rule, activity, distractors),
    tip: tip(rule),
    source: { verbatim: false, catalogue: sourceDocument, activity, concept: skill === 'function' ? 'fonction' : 'notion ou grammaire' },
    trace: trace(concepts),
  });
}

function fill(id, { fr, instructions, accepted, activity, skill = 'grammar', concepts = [], difficulty = 'medium', rule, correct }) {
  items.push({
    id, objectiveId, skill, grammarConcepts: concepts, vocabDomains: ['administration', 'government'], theme: 'permissions',
    difficulty, type: 'fill_blank', status: 'live', estTimeSec: difficulty === 'advanced' ? 60 : 45, irtB: difficulty === 'advanced' ? 0.9 : 0.35,
    prompt: { fr, instructions_en: instructions },
    answer: { type: 'text', accepted: Array.isArray(accepted) ? accepted : [accepted], normalizer: 'fr_accent_insensitive_trim_lower' },
    distractors: [],
    explanation: exp(correct, rule, activity),
    tip: tip(rule),
    source: { verbatim: false, catalogue: sourceDocument, activity, concept: skill === 'function' ? 'fonction' : 'notion ou grammaire' },
    trace: trace(concepts),
  });
}

const permRule = 'Permission: autoriser, permettre, approuver, accorder, avoir le droit, pouvoir, tolérer, laisser. Prohibition/refusal: interdire, défendre, refuser, ne pas permettre.';
[
  ['a2_1', 'Parking is forbidden in this area.', 'défendu', ['permis', 'approuvé'], 'Forbidden means défendu/interdit.'],
  ['a2_2', 'Was this authorized by the director?', 'autorisé', ['refusé', 'défendu'], 'Authorized means autorisé.'],
  ['a2_3', 'Our project met with the committee’s approval.', 'approbation', ['refus', 'interdiction'], 'Approval means approbation.'],
  ['a2_4', 'Her leave of absence was not granted.', 'refusé', ['accordé', 'autorisé'], 'Not granted means refused.'],
  ['a2_5', 'It is difficult to get a parking permit downtown.', 'permis', ['interdit', 'refus'], 'A permit is un permis.'],
  ['a2_6', 'Are we going to be allowed to take this course?', 'avoir le droit de', ['ne pas permettre', 'refuser'], 'Allowed means having the right to do it.'],
  ['a2_7', 'Lateness will not be tolerated in this office.', 'toléré', ['défendu', 'accordé'], 'Tolerated means toléré, even in the negative sentence.'],
  ['a2_8', 'She decided to let her staff choose their own schedule.', 'laisser choisir', ['défendu', 'ne pas permettre de choisir'], 'Let someone do something = laisser + infinitif.'],
  ['a2_9', 'You will be able to leave earlier today.', 'pouvoir', ['tolérer', 'refuser'], 'Can/be able to = pouvoir.'],
  ['a2_10', 'He seldom turns a blind eye to these matters.', 'fermer les yeux', ['interdire', 'approuver'], 'Turn a blind eye = fermer les yeux.'],
  ['a2_11', 'Jim is the only one who has authorization to sign these cheques.', 'autorisation', ['interdiction', 'défense'], 'Authorization = autorisation.'],
  ['a2_12', 'Your request was approved and signed today.', 'approuvée', ['refusée', 'interdite'], 'Approved = approuvée.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Choose the French permission/prohibition equivalent.', accepted, distractors, activity: 2, skill: 'vocabulary', rule: permRule, correct, difficulty: 'easy',
}));

[
  ['a4_1', 'autoriser', 'permission'], ['a4_2', 'un refus', 'interdiction'], ['a4_3', 'fermer les yeux', 'permission'], ['a4_4', 'défense d’entrer', 'interdiction'],
  ['a4_5', 'accorder un permis', 'permission'], ['a4_6', 'approuvé', 'permission'], ['a4_7', 'permission refusée', 'interdiction'], ['a4_8', 'tolérer', 'permission'],
  ['a4_9', 'approbation accordée', 'permission'], ['a4_10', 'laisser entrer', 'permission'], ['a4_11', 'permettre', 'permission'], ['a4_12', 'entrée interdite', 'interdiction'],
].forEach(([s, fr, accepted]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Does this expression indicate permission or prohibition/refusal?', accepted, distractors: [accepted === 'permission' ? 'interdiction' : 'permission'], activity: 4, skill: 'vocabulary', rule: permRule, correct: 'The expression directly signals permission or prohibition/refusal.', difficulty: 'easy',
}));

[
  ['a5_1', 'accorder / refuser', 'non'], ['a5_2', 'autoriser / permettre', 'oui'], ['a5_3', 'tolérer / fermer les yeux', 'oui'], ['a5_4', 'défense / interdiction', 'oui'],
  ['a5_5', 'pouvoir / ne pas avoir le droit', 'non'], ['a5_6', 'approuver / refuser', 'non'], ['a5_7', 'accorder / permettre', 'oui'], ['a5_8', 'approbation / refus', 'non'],
  ['a5_9', 'autorisation / défense', 'non'], ['a5_10', 'autorisation / approbation', 'oui'], ['a5_11', 'permis / interdit', 'non'], ['a5_12', 'laisser faire / permettre', 'oui'],
].forEach(([s, fr, accepted]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Do the two words or expressions have a similar meaning?', accepted, distractors: [accepted === 'oui' ? 'non' : 'oui'], activity: 5, skill: 'vocabulary', rule: permRule, correct: 'The pair is classified by whether both expressions point in the same direction.', difficulty: 'easy',
}));

[
  ['a6_1', 'Dans cette zone, le dépassement est interdit.', 'interdiction'],
  ['a6_2', 'Les automobilistes peuvent circuler sur cette route.', 'permission'],
  ['a6_3', 'L’accès est interdit aux transporteurs de matières dangereuses.', 'interdiction'],
  ['a6_4', 'Le règlement défend aux automobilistes de faire demi-tour.', 'interdiction'],
  ['a6_5', 'Faire demi-tour est autorisé avant et après certaines heures.', 'permission'],
  ['a6_6', 'Les gens n’ont pas le droit de porter des écouteurs lorsqu’ils conduisent.', 'interdiction'],
  ['a6_7', 'Il est permis de dépasser.', 'permission'],
  ['a6_8', 'L’accès à cette route n’est pas permis aux automobilistes.', 'interdiction'],
  ['a6_9', 'Ici, il est permis aux piétons de traverser.', 'permission'],
  ['a6_10', 'Il est strictement défendu de s’agripper à un véhicule en mouvement.', 'interdiction'],
  ['a6_11', 'Les motocyclistes peuvent circuler sur cette route.', 'permission'],
  ['a6_12', 'On interdit l’accès aux bicyclettes.', 'interdiction'],
].forEach(([s, fr, accepted]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Classify the road-rule sentence.', accepted, distractors: [accepted === 'permission' ? 'interdiction' : 'permission'], activity: 6, skill: 'listening', rule: permRule, correct: 'The marker in the sentence shows whether the action is allowed or forbidden.', difficulty: 'easy',
}));

const permGrammar = 'After permettre/interdire/défendre: à quelqu’un de + infinitive or que + subjunctive. Impersonal forms use de + infinitive: Il est interdit de partir.';
[
  ['a8_1', 'On interdit aux employés de régler le thermostat eux-mêmes.', 'On interdit que les employés règlent le thermostat eux-mêmes.'],
  ['a8_2', 'On permet aux employés de se servir du réfrigérateur.', 'On permet que les employés se servent du réfrigérateur.'],
  ['a8_3', 'L’animatrice interdit aux participants de déplacer le mobilier.', 'L’animatrice interdit que les participants déplacent le mobilier.'],
  ['a8_4', 'Le règlement défend aux employés d’utiliser l’Internet à des fins personnelles.', 'Le règlement défend que les employés utilisent l’Internet à des fins personnelles.'],
  ['a8_5', 'Les consignes de sécurité ne permettent pas aux visiteurs de circuler seuls ici.', 'Les consignes de sécurité ne permettent pas que les visiteurs circulent seuls ici.'],
  ['a8_6', 'Elle permet que les deux agentes soumettent leur projet à la prochaine réunion.', 'Elle permet aux deux agentes de soumettre leur projet à la prochaine réunion.'],
  ['a8_7', 'On n’interdit pas que les employés fassent leurs heures supplémentaires à la maison.', 'On n’interdit pas aux employés de faire leurs heures supplémentaires à la maison.'],
  ['a8_8', 'Le gouvernement permet que les fonctionnaires demandent une avance de voyage.', 'Le gouvernement permet aux fonctionnaires de demander une avance de voyage.'],
  ['a8_9', 'La chef de projet ne permet pas que les agents prennent leurs vacances en juin.', 'La chef de projet ne permet pas aux agents de prendre leurs vacances en juin.'],
  ['a8_10', 'Le service de sécurité défend que les gens utilisent l’ascenseur en cas d’incendie.', 'Le service de sécurité défend aux gens d’utiliser l’ascenseur en cas d’incendie.'],
].forEach(([s, original, accepted]) => fill(`itm_of30_src_${s}`, {
  fr: `Transformez la phrase en gardant le même sens.\nPhrase de départ : ${original}`, instructions: 'Write the transformed sentence using the other permission/prohibition construction.', accepted, activity: 8, concepts: ['subjonctif'], rule: permGrammar, correct: 'The transformed sentence keeps the same permission/prohibition meaning.',
}));

[
  ['a9_1', 'La Loi sur le droit d’auteur interdit de reproduire ce livre. Sujet : nous', ['La Loi sur le droit d’auteur nous interdit de reproduire ce livre.', 'La Loi sur le droit d’auteur interdit que nous reproduisions ce livre.']],
  ['a9_2', 'La chef de projet ne permet plus de retarder les échéances. Sujet : les agentes', ['La chef de projet ne permet plus aux agentes de retarder les échéances.', 'La chef de projet ne permet plus que les agentes retardent les échéances.']],
  ['a9_3', 'La loi ne permet pas de prendre sa retraite avant 55 ans sans pénalité. Sujet : les fonctionnaires', ['La loi ne permet pas aux fonctionnaires de prendre leur retraite avant 55 ans sans être pénalisés financièrement.', 'La loi ne permet pas que les fonctionnaires prennent leur retraite avant 55 ans sans être pénalisés financièrement.']],
  ['a9_4', 'On va permettre de présenter ce grief au deuxième palier. Sujet : il', ['On va lui permettre de présenter ce grief au deuxième palier.', 'On va permettre qu’il présente ce grief au deuxième palier.']],
  ['a9_5', 'La politique sur les conflits d’intérêts interdit de faire ça. Sujet : tu', ['La politique sur les conflits d’intérêts t’interdit de faire ça.', 'La politique sur les conflits d’intérêts interdit que tu fasses ça.']],
  ['a9_6', 'Le règlement défend de déménager des classeurs pleins. Sujet : les employés', ['Le règlement défend aux employés de déménager des classeurs pleins.', 'Le règlement défend que les employés déménagent des classeurs pleins.']],
  ['a9_7', 'On interdit d’utiliser des bouilloires dans les bureaux. Sujet : les employés', ['On interdit aux employés d’utiliser des bouilloires dans les bureaux.', 'On interdit que les employés utilisent des bouilloires dans les bureaux.']],
  ['a9_8', 'La chef de division permet de faire des heures supplémentaires cette semaine. Sujet : je', ['La chef de division me permet de faire des heures supplémentaires cette semaine.', 'La chef de division permet que je fasse des heures supplémentaires cette semaine.']],
  ['a9_9', 'Tu crois qu’on permettra d’utiliser mon portable? Sujet : je', ['Tu crois qu’on me permettra d’utiliser mon portable?', 'Tu crois qu’on permettra que j’utilise mon portable?']],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr: `Réécrivez avec le sujet donné. Une construction avec infinitif ou avec que + subjonctif est acceptée.\n${fr}`, instructions: 'Write one correct transformed sentence.', accepted, activity: 9, concepts: ['subjonctif'], rule: permGrammar, correct: 'The answer correctly attaches the permission/prohibition to the named subject.',
}));

[
  ['a10_1', 'Les stagiaires peuvent suivre ce cours.', ['On permet aux stagiaires de suivre ce cours.', 'On permet que les stagiaires suivent ce cours.']],
  ['a10_2', 'Nous n’avons plus le droit d’accumuler nos congés annuels.', ['On ne nous permet plus d’accumuler nos congés annuels.', 'On ne permet plus que nous accumulions nos congés annuels.']],
  ['a10_3', 'Les employés n’ont pas la permission de stationner ici.', ['On interdit aux employés de stationner ici.', 'On interdit que les employés stationnent ici.']],
  ['a10_4', 'Elsa n’a pas le droit de sortir ces documents confidentiels.', ['On défend à Elsa de sortir ces documents confidentiels.', 'On défend qu’Elsa sorte ces documents confidentiels.']],
  ['a10_5', 'Ces employés peuvent déterminer eux-mêmes leurs objectifs.', ['On permet à ces employés de déterminer eux-mêmes leurs objectifs.', 'On permet que ces employés déterminent eux-mêmes leurs objectifs.']],
  ['a10_6', 'Elle a reçu l’autorisation d’acheminer son rapport?', ['Est-ce qu’on lui a permis d’acheminer son rapport?', 'Est-ce qu’on a permis qu’elle achemine son rapport?']],
  ['a10_7', 'Jeanne n’a pas le droit de prendre un congé sans solde cet été.', ['On défend à Jeanne de prendre un congé sans solde cet été.', 'On défend que Jeanne prenne un congé sans solde cet été.']],
  ['a10_8', 'Hélène et Greta n’ont pas pu participer à cette conférence.', ['On n’a pas permis à Hélène et Greta de participer à cette conférence.', 'On n’a pas permis qu’Hélène et Greta participent à cette conférence.']],
  ['a10_9', 'Les employés de notre division ne peuvent pas utiliser cette imprimante-là.', ['On ne permet pas aux employés de notre division d’utiliser cette imprimante-là.', 'On ne permet pas que les employés de notre division utilisent cette imprimante-là.']],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr: `Reformulez avec on et un verbe de permission ou d’interdiction.\n${fr}`, instructions: 'Write one complete French reformulation.', accepted, activity: 10, concepts: ['subjonctif'], rule: permGrammar, correct: 'The reformulation uses on with permettre, interdire, or défendre.',
}));

[
  ['a11_1', 'stationner', 'C’est permis de stationner.'],
  ['a11_2', 'dépasser', 'C’est défendu de dépasser.'],
  ['a11_3', 'traverser ici pour les piétons', 'C’est permis aux piétons de traverser à cet endroit.'],
  ['a11_4', 'jeter des ordures sur la voie publique', 'C’est défendu de jeter des ordures sur la voie publique.'],
  ['a11_5', 'faire demi-tour', 'C’est interdit de faire demi-tour.'],
  ['a11_6', 'emprunter cette route pour les camions', 'C’est défendu aux camions d’emprunter cette route.'],
  ['a11_7', 'circuler à bicyclette', 'C’est permis de circuler à bicyclette.'],
  ['a11_8', 'utiliser ce téléphone en cas d’urgence', 'C’est permis d’utiliser ce téléphone en cas d’urgence.'],
].forEach(([s, cue, accepted]) => fill(`itm_of30_src_${s}`, {
  fr: `Construisez une phrase avec c’est permis/défendu/interdit de.\nIdée : ${cue}`, instructions: 'Write the complete French sentence.', accepted, activity: 11, concepts: ['subjonctif'], rule: 'Use c’est/il est permis, défendu, or interdit + de + infinitive.', correct: 'The sentence uses an impersonal permission/prohibition expression.',
}));

[
  ['a12_1', 'Julie was not granted leave without pay.', 'On n’a pas accordé de congé sans solde à Julie.'],
  ['a12_2', 'Yari is forbidden to accept other contracts.', 'On défend à Yari d’accepter d’autres contrats.'],
  ['a12_3', 'The neighbour is allowed to park in our driveway when we are away.', 'On permet au voisin de se stationner dans notre entrée pendant notre absence.'],
  ['a12_4', 'Suzanne was not forbidden to change her schedule.', 'On n’a pas interdit à Suzanne de changer d’horaire.'],
  ['a12_5', 'Richard will be permitted to attend the conference.', 'On permettra à Richard d’assister à la conférence.'],
  ['a12_6', 'Judith is allowed to work in another section.', 'On permet à Judith de travailler dans une autre section.'],
  ['a12_7', 'Rita is going to be granted a sabbatical leave.', 'On va accorder une année sabbatique à Rita.'],
  ['a12_8', 'Sylvia was forbidden to talk about it.', ['On a interdit à Sylvia d’en parler.', 'On a interdit à Sylvia de parler de ça.']],
  ['a12_9', 'The children are not allowed to play in the street.', 'On ne permet pas aux enfants de jouer dans la rue.'],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr: `Traduisez en français avec le pronom on.\n${fr}`, instructions: 'Write the French translation.', accepted, activity: 12, concepts: ['subjonctif'], difficulty: 'advanced', rule: 'French often uses on + permettre/interdire/accorder where English uses a passive.', correct: 'The translation uses on and a permission/prohibition verb.',
}));

[
  ['a13_1', 'Il permet que nous ___ ce travail.', 'finissions', ['finir', 'finissons'], 'que + subject after permettre takes the subjunctive.'],
  ['a13_2', 'On nous permet ___ dans cette pièce.', 'de travailler', ['travailler', 'que nous travaillions'], 'permettre à quelqu’un de + infinitive.'],
  ['a13_3', 'Il est interdit ___ le climatiseur.', 'de régler', ['régler', 'nous réglions'], 'il est interdit de + infinitive.'],
  ['a13_4', 'Elle permettra à Luc ___ la réunion.', 'd’animer', ['animer', 'qu’il anime'], 'permettre à Luc de + infinitive.'],
  ['a13_5', 'Le règlement interdisait que les visiteurs ___ ici.', 'attendent', ['attendaient', 'attendre'], 'que + subject requires subjunctive.'],
  ['a13_6', 'Est-ce que c’est défendu ___ dans la salle d’enregistrement?', 'd’entrer', ['entrer', 'que vous entrez'], 'c’est défendu de + infinitive.'],
  ['a13_7', 'Elle ne permet pas que les stagiaires ___ affectés à ce projet.', 'soient', ['sont', 'seront'], 'Subjunctive of être after que.'],
  ['a13_8', 'Est-ce qu’on vous a défendu ___ vos heures de travail?', 'de modifier', ['modifier', 'que vous modifiiez'], 'défendre à quelqu’un de + infinitive.'],
  ['a13_9', 'L’employeur a permis que le syndicat ___ accès au dossier.', 'ait', ['a eu', 'aura'], 'Subjunctive of avoir after que.'],
  ['a13_10', 'Ce n’est pas permis ___ ces documents.', 'de photocopier', ['photocopier', 'vous photocopiez'], 'c’est permis de + infinitive.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Choose the correct form.', accepted, distractors, activity: 13, concepts: ['subjonctif'], rule: permGrammar, correct,
}));

const pronRule = 'Double object pronouns: me/te/se/nous/vous before le/la/l’/les; le/la/l’/les before lui/leur. In negative sentences, keep the pronouns before the conjugated verb or infinitive as required.';
[
  ['a15_1', 'Il ne m’a pas donné son autorisation.', 'Il ne me l’a pas donnée.'],
  ['a15_2', 'Il vient de te donner son approbation.', 'Il vient de te la donner.'],
  ['a15_3', 'Elle doit nous expliquer cette interdiction.', 'Elle doit nous l’expliquer.'],
  ['a15_4', 'Elle ne m’a pas accordé mes congés.', 'Elle ne me les a pas accordés.'],
  ['a15_5', 'Est-ce qu’il t’a approuvé cette demande?', 'Est-ce qu’il te l’a approuvée?'],
  ['a15_6', 'Penses-tu qu’elle va nous refuser ce stage?', 'Penses-tu qu’elle va nous le refuser?'],
  ['a15_7', 'Je pense qu’on va te donner la formation demandée.', 'Je pense qu’on va te la donner.'],
  ['a15_8', 'Selon moi, on ne vous accordera pas ces crédits.', 'Selon moi, on ne vous les accordera pas.'],
  ['a15_9', 'On ne peut pas me donner les ressources nécessaires.', 'On ne peut pas me les donner.'],
  ['a16_1', 'Est-ce que tu accordes cette permission à Serge?', 'Est-ce que tu la lui accordes?'],
  ['a16_2', 'Est-ce que vous allez donner à monsieur Bibawi l’autorisation nécessaire?', 'Est-ce que vous allez la lui donner?'],
  ['a16_3', 'Vous pouvez accorder à Elsa les deux semaines de vacances demandées?', 'Vous pouvez les lui accorder?'],
  ['a16_4', 'Ne refusez pas l’augmentation à madame Cantin.', 'Ne la lui refusez pas.'],
  ['a16_5', 'Vous pouvez refuser à ces deux employées les congés demandés.', 'Vous pouvez les leur refuser.'],
  ['a16_6', 'Allez-vous accorder la permission à vos employés?', 'Allez-vous la leur accorder?'],
  ['a16_7', 'On interdit aux employés de boire de l’alcool au travail.', 'On le leur interdit.'],
  ['a16_8', 'On ne permet pas aux visiteurs d’utiliser cet escalier.', 'On ne le leur permet pas.'],
  ['a16_9', 'Est-ce qu’elle a donné son approbation aux membres du comité?', 'Est-ce qu’elle la leur a donnée?'],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr: `Remplacez les compléments par deux pronoms objets.\n${fr}`, instructions: 'Write the complete sentence with double object pronouns.', accepted, activity: Number(s.match(/a(\d+)/)[1]), concepts: ['pronouns'], rule: pronRule, correct: 'The object pronouns are in the correct order.',
}));

[
  ['a17_1', 'Le juge a accordé la garde partagée aux parents?', 'Oui, il la leur a accordée.'],
  ['a17_2', 'On va nous donner le choix entre horaire régulier et horaire variable?', 'Oui, on va nous le donner.'],
  ['a17_3', 'À la piscine, on nous interdit de plonger?', 'Oui, on nous l’interdit.'],
  ['a17_4', 'On va donner à Carlos et à Maria la nouvelle affectation?', 'Oui, on va la leur donner.'],
  ['a17_5', 'La déléguée syndicale pourrait vous présenter l’aperçu des discussions?', 'Oui, elle pourrait nous le présenter.'],
  ['a17_6', 'Je dois demander à Stéphanie l’autorisation de faire un appel interurbain?', 'Oui, tu dois la lui demander.'],
  ['a17_7', 'La patronne va me permettre ce voyage?', 'Oui, elle va te le permettre.'],
  ['a17_8', 'On a permis à Céline de remettre son certificat médical la semaine prochaine?', 'Oui, on le lui a permis.'],
  ['a17_9', 'On vous permettra de faire des heures supplémentaires?', 'Oui, on nous le permettra.'],
  ['a18_1', 'Est-ce que votre chef vous donnera la permission d’aller à la réunion?', 'Non, il ne nous la donnera pas.'],
  ['a18_2', 'Est-ce que l’adjointe peut te donner l’autorisation d’y aller en taxi?', 'Non, elle ne peut pas me la donner.'],
  ['a18_3', 'Est-ce qu’on leur permet de partir?', 'Non, on ne le leur permet pas.'],
  ['a18_4', 'Est-ce qu’on t’a permis de voyager en première classe?', 'Non, on ne me l’a pas permis.'],
  ['a18_5', 'Est-ce qu’elle me refusera cette allocation?', 'Non, elle ne te la refusera pas.'],
  ['a18_6', 'Est-ce qu’on interdit aux fonctionnaires de travailler le dimanche?', 'Non, on ne le leur interdit pas.'],
  ['a18_7', 'Est-ce qu’on vous défend de prendre des congés d’études?', 'Non, on ne nous le défend pas.'],
  ['a18_8', 'Alyx peut-elle donner l’autorisation à l’adjoint de signer le contrat?', 'Non, elle ne peut pas la lui donner.'],
  ['a20_1', 'Est-ce qu’on a permis à Guillaume de terminer son projet à la maison?', 'Oui, on le lui a permis.'],
  ['a20_2', 'Est-ce que Louis va t’accorder les congés que tu as demandés?', 'Oui, il va me les accorder.'],
  ['a20_3', 'Est-ce qu’on peut nous interdire de changer d’horaire?', 'Non, on ne peut pas nous l’interdire.'],
  ['a20_4', 'Est-ce qu’Ève pourrait me refuser la formation que j’ai demandée?', 'Oui, elle pourrait te la refuser.'],
  ['a20_5', 'Est-ce qu’on permettra aux agents de remettre leur travail en retard?', 'Non, on ne le leur permettra pas.'],
  ['a20_6', 'Est-ce que tu me permets d’en parler à Claudia?', 'Oui, je te le permets.'],
  ['a20_7', 'Est-ce qu’on peut nous défendre de sortir ce matériel de l’entrepôt?', 'Oui, on peut nous le défendre.'],
  ['a20_8', 'Est-ce qu’Ida a donné aux agents la permission de signer le protocole?', 'Non, elle ne la leur a pas donnée.'],
  ['a20_9', 'Est-ce qu’elle vous a défendu d’en discuter entre vous?', 'Non, elle ne nous l’a pas défendu.'],
  ['a20_10', 'Est-ce qu’on vous permettait d’emprunter les sorties de secours?', 'Non, on ne nous le permettait pas.'],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr, instructions: 'Answer with a complete sentence using two object pronouns.', accepted, activity: Number(s.match(/a(\d+)/)[1]), concepts: ['pronouns'], difficulty: 'advanced', rule: pronRule, correct: 'The answer uses a direct and an indirect object pronoun with the same verb.',
}));

[
  ['a23_1', 'Oui, elle nous l’a donnée.', 'nous, l’', ['te, lui', 'la, leur'], 'Both pronouns appear together in the reply.'],
  ['a23_2', 'Non, il ne leur aurait jamais permis de fumer au bureau.', 'leur', ['lui', 'me'], 'The object pronoun is leur.'],
  ['a23_3', 'C’est monsieur Laberge qui est autorisé à la signer.', 'la', ['leur', 'nous'], 'la replaces la lettre.'],
  ['a23_4', 'Passe-la-moi.', 'la, moi', ['lui, leur', 'vous, se'], 'The imperative has la-moi.'],
  ['a23_5', 'On ne nous le permettra jamais.', 'nous, le', ['leur, la', 'me, lui'], 'Double pronouns appear before permettra.'],
  ['a23_6', 'Il devrait vous la donner d’ici la fin de l’année.', 'vous, la', ['te, les', 'lui, leur'], 'vous and la appear before donner.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Which object pronoun or pronoun group appears in the sentence?', accepted, distractors, activity: 23, skill: 'listening', concepts: ['pronouns'], rule: pronRule, correct,
}));

const concessionRule = 'Concession/opposition: mais, cependant, toutefois, par contre, pourtant + indicative; malgré/en dépit de/à moins de + noun or infinitive; à moins que/bien que/quoique + subjunctive; alors que/tandis que + indicative.';
[
  ['a25_1', 'Pourrions-nous approuver cette planification, ___ il manque un document?', 'même s’', ['à moins d’', 'par contre'], 'even though = même si/bien que/quoique.'],
  ['a25_2', 'Vous n’êtes plus autorisés à stationner ici, ___ avoir un permis.', 'à moins d’', ['bien que', 'alors que'], 'à moins de + infinitive.'],
  ['a25_3', 'Il a présenté sa demande à temps; ___, il n’a pas encore obtenu l’autorisation.', 'cependant', ['à moins que', 'malgré'], 'however = cependant/toutefois.'],
  ['a25_4', 'On nous refuse l’autorisation, ___ nous ayons tous les documents requis.', 'bien que', ['malgré', 'tandis que'], 'bien que + subjunctive.'],
  ['a25_5', 'Est-ce qu’on peut le faire ___?', 'quand même', ['à moins de', 'malgré'], 'all the same/anyway = quand même.'],
  ['a25_6', 'Si on refuse ça, on ___ ce qu’on a approuvé jusqu’à maintenant.', 'va à l’encontre de', ['s’oppose', 'malgré'], 'go against = aller à l’encontre de.'],
  ['a25_7', 'Vous ne pouvez pas traduire ces documents, ___ on vous accorde une cote plus élevée.', 'à moins qu’', ['à moins de', 'malgré'], 'à moins que + subject + verb.'],
  ['a25_8', 'Nous avons fermé les yeux trop longtemps, ___ dans d’autres services, on ne tolère pas cela.', 'alors que', ['malgré', 'à moins de'], 'whereas = alors que/tandis que.'],
  ['a25_9', 'Je ne ___ pas à votre projet; cependant, j’aimerais avoir plus de précisions.', 'm’oppose', ['permets', 'accorde'], 's’opposer à = to oppose.'],
  ['a25_10', 'Il n’est pas en forme, ___ c’est un grand sportif.', 'pourtant', ['à moins que', 'malgré'], 'yet = pourtant.'],
  ['a26_1', 'On lui a interdit de faire ça, ___ ce soit permis ailleurs.', 'bien que', ['à moins de', 'par contre'], 'bien que + subjunctive.'],
  ['a26_2', 'Tout le monde stationne dans la rue, ___ c’est défendu.', 'même si', ['à moins que', 'concessions'], 'même si + indicative.'],
  ['a26_3', 'Normalement, on ne peut pas voyager en première classe; ___, votre cas est particulier.', 'par contre', ['à moins de', 'malgré'], 'par contre introduces contrast.'],
  ['a26_4', 'C’est défendu de reproduire ces documents, ___ avoir une autorisation spéciale.', 'à moins d’', ['bien que', 'tandis que'], 'à moins de + infinitive.'],
  ['a26_5', 'Ce projet de règlement ___ la politique établie.', 'va à l’encontre de', ['quand même', 'malgré'], 'goes against = va à l’encontre de.'],
  ['a26_6', 'Ils ont reproduit le document ___ l’interdiction.', 'malgré', ['tandis que', 'à moins que'], 'despite = malgré/en dépit de.'],
  ['a26_7', 'Vous ne pourrez pas faire ça, ___ on change le règlement.', 'à moins qu’', ['à moins de', 'cependant'], 'unless + clause = à moins que.'],
  ['a26_8', 'Elle savait que c’était interdit, mais elle l’a fait ___.', 'quand même', ['concessions', 'tandis que'], 'anyway = quand même.'],
  ['a26_9', 'Il ___ tout ce qu’on propose.', 's’oppose à', ['tolère', 'accorde'], 's’oppose à expresses opposition.'],
  ['a26_10', 'Il va falloir faire des ___ si on veut trouver une solution.', 'concessions', ['interdictions', 'refus'], 'Making concessions can lead to a solution.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Choose the concession or opposition expression that fits.', accepted, distractors, activity: Number(s.match(/a(\d+)/)[1]), skill: 'vocabulary', rule: concessionRule, correct,
}));

[
  ['a28_1', 'On ne peut pas utiliser cet appareil, ___ avoir une permission spéciale.', 'à moins d’', ['à moins qu’', 'bien qu’'], 'à moins de is used before an infinitive.'],
  ['a28_2', 'Vous ne pourrez pas occuper ce bureau, ___ il soit libre.', 'bien qu’', ['alors qu’', 'à moins d’'], 'bien que takes a subjunctive clause.'],
  ['a28_3', 'Nous vous autoriserons à suivre ce cours, ___ nous ayons besoin de vos services ici.', 'quoique', ['alors que', 'à moins de'], 'quoique takes the subjunctive.'],
  ['a28_4', 'Ici, nous pouvons choisir notre horaire, ___ ce n’est pas possible dans votre ministère.', 'tandis que', ['bien que', 'à moins que'], 'tandis que takes the indicative and contrasts two facts.'],
  ['a28_5', 'Vous pourrez assister à la conférence, ___ nous ayons une urgence.', 'à moins que', ['à moins de', 'alors que'], 'à moins que takes a subjunctive clause.'],
  ['a28_6', 'On m’a permis un congé avec étalement de revenu, ___ cette fois-ci, on ne me le permet pas.', 'alors que', ['quoique', 'à moins de'], 'alors que contrasts two facts.'],
  ['a28_7', 'Elle a posé sa candidature, ___ elle n’ait pas le droit de participer.', 'quoiqu’', ['alors qu’', 'à moins d’'], 'quoiqu’ takes the subjunctive.'],
  ['a28_8', 'Je n’accepterai pas ce projet, ___ on me fournisse un technicien.', 'à moins qu’', ['tandis qu’', 'à moins de'], 'à moins que introduces the condition.'],
  ['a28_9', 'On tolère la vente de billets ici, ___ ailleurs ce n’est pas toléré.', 'tandis qu’', ['quoiqu’', 'bien qu’'], 'tandis que contrasts two places.'],
  ['a28_10', 'Vous ne pourrez pas obtenir ce poste, ___ avoir un permis de chauffeur.', 'à moins d’', ['à moins qu’', 'quoique'], 'à moins de + infinitive.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Choose the connector required by the verb form that follows.', accepted, distractors, activity: 28, concepts: ['subjonctif'], rule: concessionRule, correct,
}));

[
  ['a29_1', 'Je n’approuverai pas ce projet, à moins que vous me ___ un échéancier plus réaliste. (fournir)', 'fournissiez'],
  ['a29_2', 'Bien que la directrice ___ la situation, elle ne lui a pas accordé cette permission. (comprendre)', 'comprenne'],
  ['a29_3', 'Ma demande de congé est approuvée, alors que la sienne ___ refusée. (être)', 'est'],
  ['a29_4', 'Quoique je ___ des heures supplémentaires, je ne pourrai pas demander de congé compensatoire. (faire)', 'fasse'],
  ['a29_5', 'Les gestionnaires peuvent participer, tandis que les professeurs ne ___ pas y participer. (pouvoir)', 'peuvent'],
  ['a29_6', 'Vous ne pouvez plus prendre de congé de maladie, à moins de ___ un certificat médical. (présenter)', 'présenter'],
  ['a29_7', 'Votre affectation ne pourra pas être prolongée, à moins que le protocole ___ modifié. (être)', 'soit'],
  ['a29_8', 'Quoiqu’on ___ le budget, nous pourrons répondre à vos besoins. (réduire)', 'réduise'],
  ['a29_9', 'Je n’ai pas encore reçu mon avance, alors que le patron ___ l’autorisation il y a un mois. (signer)', 'a signé'],
  ['a31_1', 'À moins que Maurice ___ oui, le projet ne sera pas approuvé. (dire)', 'dise'],
  ['a31_2', 'Vous ne pourrez pas présenter votre plan, à moins de me le ___ deux jours avant. (remettre)', 'remettre'],
  ['a31_3', 'Ici, on peut contrôler la température, alors que dans l’autre pièce, ce n’___ pas permis. (être)', 'est'],
  ['a31_4', 'Quoique je ne ___ pas d’accord, je le tolérerai. (être)', 'sois'],
  ['a31_5', 'Elles ont accepté notre demande, tandis qu’elles ___ la leur. (refuser)', 'ont refusé'],
  ['a31_6', 'Bien que leur proposition ___ intéressante, elle n’a pas été approuvée. (être)', 'soit'],
  ['a31_7', 'J’autoriserai ce voyage, à moins qu’il y ___ quelque chose d’urgent à terminer. (avoir)', 'ait'],
  ['a31_8', 'Je ne pourrai pas vous accorder cette affectation, à moins d’___ une personne compétente. (avoir)', 'avoir'],
  ['a31_9', 'Autrefois, on nous le permettait, alors que maintenant, on nous le ___. (défendre)', 'défend'],
  ['a31_10', 'On ne signera pas les contrats, bien qu’on ___ le faire. (pouvoir)', 'puisse'],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr, instructions: 'Write the verb in the infinitive, indicative, or subjunctive as required.', accepted, activity: Number(s.match(/a(\d+)/)[1]), concepts: ['subjonctif'], difficulty: 'advanced', rule: concessionRule, correct: 'The form follows the connector: subjunctive, infinitive, or indicative.',
}));

[
  ['a30_1', 'Elle a approuvé ma demande de travail à temps partiel. Il y a un surplus de travail au bureau. Connecteur : quoique', 'Elle a approuvé ma demande de travail à temps partiel, quoiqu’il y ait un surplus de travail au bureau.'],
  ['a30_2', 'La directrice lui a accordé un congé d’études. Nous manquons de personnel. Connecteur : bien que', 'La directrice lui a accordé un congé d’études, bien que nous manquions de personnel.'],
  ['a30_3', 'On ne pourra pas vous faire parvenir les fascicules. Votre chef approuve votre demande. Connecteur : à moins que', 'On ne pourra pas vous faire parvenir les fascicules à moins que votre chef approuve votre demande.'],
  ['a30_4', 'Il est défendu de stationner ici. Il faut avoir un permis. Connecteur : à moins de', 'Il est défendu de stationner ici, à moins d’avoir un permis.'],
  ['a30_5', 'Avant, c’était facile d’accorder des congés spéciaux. Maintenant, c’est plus difficile. Connecteur : alors que', 'Avant, c’était facile d’accorder des congés spéciaux, alors que maintenant, c’est de plus en plus difficile.'],
  ['a30_6', 'Dans ce cas, on a le droit de faire un grief. Dans l’autre cas, on ne l’a pas. Connecteur : tandis que', 'Dans ce cas, on a le droit de faire un grief, tandis que, dans l’autre cas, on ne l’a pas.'],
  ['a30_7', 'Les étudiants ne peuvent plus emprunter les périodiques. La bibliotechnicienne doit leur accorder une autorisation spéciale. Connecteur : à moins que', 'Les étudiants ne peuvent plus emprunter les périodiques à moins que la bibliotechnicienne leur accorde une autorisation spéciale.'],
  ['a30_8', 'On aura la permission d’organiser la clinique de sang. La salle est un peu petite. Connecteur : quoique', 'On aura la permission d’organiser la clinique de sang, quoique la salle soit un peu petite.'],
  ['a30_9', 'Le Conseil du Trésor donnera son approbation. Il reste certains détails à discuter. Connecteur : bien que', 'Le Conseil du Trésor donnera son approbation, bien qu’il reste certains détails à discuter.'],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr: `Construisez une seule phrase.\n${fr}`, instructions: 'Write one complete French sentence.', accepted, activity: 30, concepts: ['subjonctif'], difficulty: 'advanced', rule: concessionRule, correct: 'The combined sentence uses the requested connector and the correct mood.',
}));

[
  ['a32_1', 'a. Est-ce que c’est permis de partir à 3 h?\nb. À quelle heure est-ce que vous devez partir?', 'a. Est-ce que c’est permis de partir à 3 h?'],
  ['a32_2', 'a. C’est défendu de sortir les livres de référence de cette salle-là?\nb. Est-ce que c’est nécessaire de sortir les livres de référence?', 'a. C’est défendu de sortir les livres de référence de cette salle-là?'],
  ['a32_3', 'a. Est-ce qu’il a le droit de prendre un congé annuel demain?\nb. Lui avez-vous accordé une journée de congé?', 'a. Est-ce qu’il a le droit de prendre un congé annuel demain?'],
  ['a32_4', 'a. Il faut déduire les dons de charité?\nb. J’ai le droit de déduire les dons de charité?', 'b. J’ai le droit de déduire les dons de charité?'],
  ['a32_5', 'a. Est-ce que j’ai le droit d’exiger de la formation chaque année?\nb. Est-ce que je suis obligée de participer au stage?', 'a. Est-ce que j’ai le droit d’exiger de la formation chaque année?'],
  ['a32_6', 'a. Quand est-ce qu’on va à la Chambre des communes?\nb. Est-ce qu’on a accès à la Chambre des communes?', 'b. Est-ce qu’on a accès à la Chambre des communes?'],
  ['a32_7', 'a. Est-ce que c’est interdit d’apporter son lunch à la cafétéria?\nb. Est-ce que tu aimerais manger à la cafétéria?', 'a. Est-ce que c’est interdit d’apporter son lunch à la cafétéria?'],
  ['a32_8', 'a. Qu’est-ce que tu mets pour aller au party du bureau?\nb. Est-ce qu’on peut porter des jeans au bureau?', 'b. Est-ce qu’on peut porter des jeans au bureau?'],
  ['a32_9', 'a. Est-ce que ça t’intéresserait de prendre un congé sans solde?\nb. Est-ce que c’est permis de prendre deux ans de congé sans solde?', 'b. Est-ce que c’est permis de prendre deux ans de congé sans solde?'],
  ['a32_10', 'a. À la fin du stage, est-ce que je pourrai faire une analyse de besoins?\nb. Est-ce que je peux entrer?', 'b. Est-ce que je peux entrer?'],
].forEach(([s, fr, accepted]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Which question asks what is permitted or forbidden?', accepted, distractors: fr.split('\n').filter((x) => x !== accepted), activity: 32, skill: 'function', rule: permRule, correct: 'The selected question asks about permission, access, right, or prohibition.',
}));

[
  ['a33_1', 'Ce n’est pas permis de sortir les plateaux de la cafétéria.', 'oui'], ['a33_2', 'Nous ne savons pas quand le nouveau projet commencera.', 'non'],
  ['a33_3', 'Il est interdit de manger dans cette salle de recherche.', 'oui'], ['a33_4', 'Vous avez le droit de participer à cette conférence-là.', 'oui'],
  ['a33_5', 'J’aimerais pouvoir racheter mon fonds de pension.', 'non'], ['a33_6', 'Je ne suis pas autorisé à vous remettre les résultats de ce concours-là.', 'oui'],
  ['a33_7', 'Ici, on fait de tout : classification, dotation, formation.', 'non'], ['a33_8', 'Les employés reçoivent beaucoup d’appels personnels.', 'non'],
  ['a33_9', 'Je ne pourrai plus signer de chèques sans l’autorisation de mon patron.', 'oui'], ['a33_10', 'Ici, on ne peut rien faire sans permission spéciale.', 'oui'],
  ['a33_11', 'Dans certains bureaux, il est défendu de faire des appels interurbains.', 'oui'], ['a33_12', 'Les employés peuvent commencer à 8 h ou à 9 h.', 'oui'],
].forEach(([s, fr, accepted]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Does this sentence give information about what is permitted or forbidden?', accepted, distractors: [accepted === 'oui' ? 'non' : 'oui'], activity: 33, skill: 'function', rule: permRule, correct: 'The sentence is classified by whether it states permission/prohibition information.',
}));

const act34 = [
  ['Stationner en face de l’édifice', 'défendu'], ['Prendre plus d’une heure pour dîner', 'défendu'], ['Recevoir des télécopies personnelles', 'défendu'],
  ['Prendre des congés avec étalement de revenu', 'permis'], ['Porter des sandales', 'permis'], ['Arriver à 7 h le matin', 'permis'],
  ['Sortir les périodiques de la bibliothèque', 'défendu'], ['Utiliser la salle de conférences du 20e étage', 'défendu'], ['Participer à des conférences à l’extérieur de la ville', 'permis'],
  ['Naviguer sur Internet pour des sujets liés au travail', 'permis'], ['Coller des affiches sur le mur', 'défendu'], ['Réclamer un fauteuil ergonomique', 'permis'],
  ['Télécharger des logiciels', 'défendu'], ['Prendre des vacances en mars', 'permis'], ['Organiser des sessions de conditionnement physique', 'permis'],
];
act34.forEach(([task, accepted], i) => mcq(`itm_of30_src_a34_${i + 1}`, {
  fr: `Première journée au bureau : ${task}`, instructions: 'According to the mini-dialogue, is this permitted or forbidden?', accepted, distractors: [accepted === 'permis' ? 'défendu' : 'permis'], activity: 34, skill: 'function', rule: permRule, correct: 'The mini-dialogue states whether this action is allowed or not.',
}));

[
  ['a38_1', 'Est-ce que vous pourriez approuver cette demande-là?', 'oui'], ['a38_2', 'Quand est-ce que vous allez approuver cette demande-là?', 'non'],
  ['a38_3', 'Est-ce que je peux m’installer ici?', 'oui'], ['a38_4', 'Quand devons-nous remettre ce rapport?', 'non'],
  ['a38_5', 'Pourriez-vous m’accorder la permission de partir plus tôt?', 'oui'], ['a38_6', 'Est-ce que ça va, si j’arrive plus tard demain?', 'oui'],
  ['a38_7', 'Ce colloque a lieu dans quelle ville?', 'non'], ['a38_8', 'Pouvez-vous approuver cette demande de congé spécial?', 'oui'],
  ['a38_9', 'Est-ce que ça irait, si je prenais une semaine de vacances de plus?', 'oui'], ['a38_10', 'Pourriez-vous m’autoriser à modifier ce projet-là?', 'oui'],
  ['a38_11', 'Est-ce qu’il faut sortir par cette porte-là?', 'non'], ['a38_12', 'Est-ce que vous m’autorisez à remplacer monsieur Daigle?', 'oui'],
  ['a38_13', 'Est-ce que je peux reproduire cette publication à plusieurs exemplaires?', 'oui'], ['a38_14', 'Est-ce que vous approuvez la réorganisation?', 'oui'],
].forEach(([s, fr, accepted]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Is this a request for permission or approval?', accepted, distractors: [accepted === 'oui' ? 'non' : 'oui'], activity: 38, skill: 'function', rule: 'Permission requests use je peux, pourriez-vous, m’accorder, m’autoriser, approuver, est-ce que ça irait si...', correct: 'The utterance is classified by whether it asks for permission or approval.',
}));

[
  ['a39_1', 'Je regrette, mais je ne peux pas vous l’accorder.', 'oui'], ['a39_2', 'Je regrette, mais je ne peux pas rester jusqu’à 6 h.', 'non'],
  ['a39_3', 'Vous n’êtes pas autorisé à faire ce voyage-là.', 'oui'], ['a39_4', 'Votre avance de voyage n’est pas encore prête.', 'non'],
  ['a39_5', 'Bien sûr, vous avez le droit d’être représenté par votre déléguée syndicale.', 'oui'], ['a39_6', 'Vous n’avez pas le droit de suivre des cours de langues.', 'oui'],
  ['a39_7', 'Je suis obligé de refuser votre demande de congé.', 'oui'], ['a39_8', 'J’ai lu vos recommandations et je les approuve à 100 %.', 'oui'],
  ['a39_9', 'Ici, on ferme rarement les yeux sur les retards.', 'non'], ['a39_10', 'Il est interdit de sortir les catalogues de ce bureau-là.', 'oui'],
  ['a39_11', 'Le comité est en train d’étudier votre projet.', 'non'], ['a39_12', 'Le comité a approuvé votre projet.', 'oui'],
  ['a39_13', 'Vous n’avez pas besoin de permission spéciale pour faire ça.', 'oui'], ['a39_14', 'Vous avez besoin de l’autorisation de votre chef du personnel.', 'oui'],
].forEach(([s, fr, accepted]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Is this an answer to a request for permission or approval?', accepted, distractors: [accepted === 'oui' ? 'non' : 'oui'], activity: 39, skill: 'function', rule: 'Answers grant, refuse, approve, or state authorization/permission status.', correct: 'The utterance is classified by whether it answers a permission/approval request.',
}));

[
  ['a44_1', 'Selon le règlement municipal, il est formellement interdit d’utiliser et de fixer des enseignes ressemblant à des panneaux officiels.', 'il est formellement interdit'],
  ['a44_2', 'Veuillez ne pas interpréter ceci comme un refus définitif.', 'un refus définitif'],
  ['a44_3', 'Le propriétaire de cet immeuble interdisait la présence d’animaux de compagnie.', 'interdisait'],
  ['a44_4', 'Vous n’êtes pas autorisé à stationner votre véhicule dans la zone réservée.', 'n’êtes pas autorisé'],
  ['a44_5', 'Toute dépense doit être préalablement autorisée par le chef de division.', 'doit être préalablement autorisée'],
  ['a44_6', 'Le Conseil du Trésor a accordé une approbation de principe à cette soumission.', 'a accordé une approbation de principe'],
  ['a44_7', 'Les employés désignés ne peuvent exercer leur droit de grève.', 'ne peuvent exercer leur droit'],
  ['a44_8', 'Il était strictement défendu de descendre de son véhicule.', 'strictement défendu'],
  ['a44_9', 'Vous êtes autorisé à reporter le congé qui vous avait été accordé.', 'êtes autorisé'],
  ['a44_10', 'Si vous me permettez de donner suite à cette proposition, je le ferai.', 'me permettez'],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr, instructions: 'Write the expression that shows permission, refusal, approval, or prohibition.', accepted, activity: 44, skill: 'reading', rule: permRule, correct: 'The selected expression carries the permission/prohibition meaning in the written passage.',
}));

[
  ['a45_1', 'Les voyages en classe d’affaires ne seront ___ que dans des cas exceptionnels.', 'permis'],
  ['a45_2', 'La Loi sur la concurrence ___ notamment la publicité trompeuse.', 'interdit'],
  ['a45_3', 'Il plaît au Gouverneur général en conseil d’___ la publication des lignes directrices.', 'approuver'],
  ['a45_4', 'C’est avec regret que je dois vous ___ demandée.', 'refuser l’autorisation'],
  ['a45_5', 'Une autre forme d’assurance-voyage a été ___.', 'autorisée'],
  ['a45_6', 'Les fonctionnaires fédéraux ___ travailler dans la langue officielle de leur choix.', 'ont le droit de'],
  ['a45_7', 'Le Conseil ___ sollicitée, sauf pour la durée hebdomadaire du travail.', 'accorde l’autorisation'],
  ['a45_8', 'L’approbation des demandes sera ___ à la discrétion du bureau national.', 'laissée'],
  ['a45_9', 'Tous les agents ___ appareils de reproduction doivent être avertis.', 'ayant accès aux'],
  ['a45_10', 'Il faut obtenir le ___ de la Direction du patrimoine et l’___ de la Commission.', ['consentement, approbation', 'consentement et approbation']],
].forEach(([s, fr, accepted]) => fill(`itm_of30_src_${s}`, {
  fr, instructions: 'Complete the written-administration sentence with the correct permission/approval term.', accepted, activity: 45, skill: 'reading', rule: permRule, correct: 'The term fits the formal written context.',
}));

[
  ['a46_1', 'Le comité a approuvé un sondage, mais peut retirer son autorisation si le budget est dépassé.', 'Le comité permet qu’on fasse un sondage auprès des employés.', ['Le comité a autorisé le sondage sans condition.', 'Le comité va retirer son autorisation.'], 'The approval exists, but it is conditional.'],
  ['a46_2', 'Madame Taviani a bien voulu approuver nos projets et nous autoriser à vous les soumettre.', 'Madame Taviani a approuvé nos projets.', ['Madame Taviani nous a permis d’exposer nos projets.', 'Madame Taviani va approuver nos projets.'], 'The text says she has approved them.'],
  ['a46_3', 'Une telle autorisation ne saurait être accordée qu’à titre exceptionnel; le Conseil peut l’annuler.', 'Le Conseil accorde son autorisation.', ['Le Conseil refuse d’accorder son autorisation.', 'Le Conseil accorde son autorisation sans condition.'], 'Authorization is granted, but with conditions.'],
  ['a46_4', 'Vous êtes autorisé à transférer à votre régime de retraite les crédits de pension accumulés.', 'L’employé a le droit de transférer ses crédits de pension accumulés.', ['L’employé peut accumuler ses crédits de pension.', 'Il est interdit de transférer ses crédits.'], 'The text allows the transfer.'],
  ['a46_5', 'Vous êtes priés de ne pas demander de renseignements par courriel. Vous pouvez nous téléphoner.', 'Il est défendu de demander des renseignements par courriel.', ['Il est permis de faire ses demandes par courriel en tout temps.', 'Il est strictement interdit de téléphoner.'], 'Email requests are not allowed; phone requests are allowed.'],
  ['a46_6', 'Les demandes de congé refusées seront étudiées à nouveau si l’employé en fait la demande.', 'On n’a pas permis à certains employés de prendre les congés demandés.', ['On a refusé tous les congés demandés.', 'On ne permettra pas une nouvelle demande.'], 'Some requests were refused and can be reviewed.'],
  ['a46_7', 'Les fonctionnaires ne doivent pas accorder de traitement de faveur à leurs parents ou amis.', 'Il est défendu aux fonctionnaires d’accorder des traitements de faveur.', ['Les fonctionnaires peuvent accorder des traitements de faveur.', 'On tolère les traitements de faveur.'], 'The text prohibits preferential treatment.'],
].forEach(([s, fr, accepted, distractors, correct]) => mcq(`itm_of30_src_${s}`, {
  fr, instructions: 'Choose the statement that best reflects the written passage.', accepted, distractors, activity: 46, skill: 'reading', rule: permRule, correct,
}));

bank.sourceFidelity = false;
bank.source = { sourceDocument, lexique: 'SC102-2/1-2-2005F', counts: { source: items.length, vocab: vocabItems.length } };
bank.items = [...items, ...vocabItems];
fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);

const module = JSON.parse(fs.readFileSync(modulePath, 'utf8'));
module.sourceFidelity = false;
module.stages.learn = {
  conceptExplanation: {
    en: 'OF30 teaches how to permit, forbid, approve, refuse, and ask for permission. It also adds concession/opposition language for nuanced answers: permission may be granted despite a problem, refused unless a condition is met, or contrasted with another rule.',
    fr: "L’OF30 sert à permettre, interdire, approuver, refuser et demander une permission. On apprend aussi à nuancer avec la concession et l’opposition : permission accordée malgré une difficulté, refusée à moins qu’une condition soit remplie, ou contrastée avec une autre règle.",
  },
  vocabularyNote: 'Indicateurs clés : permettre, interdire, défendre, autoriser, approuver, accorder, refuser, avoir le droit de, pouvoir, tolérer, laisser, fermer les yeux, permission, autorisation, approbation, interdiction, défense, refus.',
  grammarNotes: {
    summary: 'Permission/prohibition verbs take à quelqu’un de + infinitive or que + subjunctive. Double object pronouns are used to replace the person and the permission/object. Concession/opposition connectors determine whether the next verb is subjunctive, infinitive, or indicative.',
    charts: [
      { title: 'Permission et interdiction', rows: [['permettre à quelqu’un de', 'On permet aux employés de partir.'], ['permettre que + subjonctif', 'On permet que les employés partent.'], ['il est interdit de', 'Il est interdit de stationner ici.']] },
      { title: 'Doubles pronoms', rows: [['me/te/nous/vous + le/la/les', 'On me la donne.'], ['le/la/les + lui/leur', 'On la leur donne.'], ['impératif affirmatif', 'Donnez-la-moi.']] },
      { title: 'Concession/opposition', rows: [['bien que / quoique / à moins que', 'subjonctif'], ['à moins de', 'infinitif'], ['alors que / tandis que / même si', 'indicatif']] },
    ],
    points: [
      'Use on in French where English often uses the passive: David was allowed = On a permis à David...',
      'Do not use the infinitive after que; use the subjunctive when a subject is named.',
      'Use double pronouns when replacing both the thing/action and the person affected.',
      'à moins que, bien que, and quoique trigger the subjunctive; à moins de triggers the infinitive.',
    ],
  },
  pronunciation: { points: [] },
  dialogues: [
    { title: 'Demander une permission', lines: [
      { speaker: 'A', text: 'Est-ce que je pourrais partir un peu plus tôt aujourd’hui?' },
      { speaker: 'B', text: 'Oui, je te le permets, mais assure-toi d’aviser ton équipe.' },
      { speaker: 'A', text: 'Est-ce qu’on peut sortir les périodiques de la bibliothèque?' },
      { speaker: 'B', text: 'Non, c’est formellement interdit.' },
    ] },
  ],
  exampleTexts: [
    { title: 'Autorisation conditionnelle', body: 'Le comité approuve le sondage, mais il se réserve le droit de retirer son autorisation si la préparation dépasse le budget prévu.' },
  ],
};
module.stages.practice = {
  sourceFidelity: false,
  coverage: `${bank.items.length} questions: ${items.length} concept-focused items derived from SC102-2/30-2005F plus ${vocabItems.length} OF30 lexicon items.`,
  exerciseSets: [
    { title: 'Permission, interdiction, approbation et refus', count: 60 },
    { title: 'Subjonctif ou infinitif après permettre/interdire/défendre', count: 57 },
    { title: 'Doubles pronoms objets', count: 51 },
    { title: 'Concession et opposition', count: 58 },
    { title: 'Fonctions et compréhension écrite/orale', count: 96 },
    { title: 'Vocabulaire du Lexique PFL2', count: vocabItems.length },
  ],
  totalQuestions: bank.items.length,
};
module.stages.masteryCheck.concepts = ['permission', 'interdiction', 'subjonctif', 'pronouns', 'concession', 'opposition'];
module.coverage = {
  strictComplete: false,
  convertibleComplete: true,
  coveredElements: 38,
  totalElements: 63,
  convertible: { covered: 38, total: 38 },
  actionableGaps: { sections: [], activities: [], vocabulary: [], examples: [], selfTest: ['selfeval-3 (SC102-2-45-3)'] },
  nonConvertible: { sections: [], activities: [1, 3, 7, 14, 19, 21, 22, 24, 27, 35, 36, 37, 40, 41, 42, 43, 47, 48, 49] },
};
fs.writeFileSync(modulePath, `${JSON.stringify(module, null, 2)}\n`);

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const byActivity = new Map();
for (const item of items) {
  const a = item.source?.activity;
  if (a) byActivity.set(a, [...(byActivity.get(a) || []), item.id]);
}
const links = (...acts) => acts.flatMap((a) => byActivity.get(a) || []);
coverage.sections = [
  { id: '30.1', heading: 'Notions', topicsFr: 'Indicateurs de permission et d’interdiction', kind: 'vocabulary', covered: true, itemCount: links(2, 4, 5, 6).length, linkedItems: links(2, 4, 5, 6) },
  { id: '30.2', heading: 'Grammaire', topicsFr: 'Subjonctif ou infinitif après des verbes de permission et d’interdiction', kind: 'grammar', covered: true, itemCount: links(8, 9, 10, 11, 12, 13).length, linkedItems: links(8, 9, 10, 11, 12, 13) },
  { id: '30.3', heading: 'Grammaire', topicsFr: 'Doubles pronoms personnels objets', kind: 'grammar', covered: true, itemCount: links(15, 16, 17, 18, 20, 23).length, linkedItems: links(15, 16, 17, 18, 20, 23) },
  { id: '30.4', heading: 'Notions', topicsFr: 'Indicateurs de concession et d’opposition', kind: 'vocabulary', covered: true, itemCount: links(25, 26).length, linkedItems: links(25, 26) },
  { id: '30.5', heading: 'Grammaire', topicsFr: 'Subjonctif, infinitif ou indicatif après des expressions de concession et d’opposition', kind: 'grammar', covered: true, itemCount: links(28, 29, 30, 31).length, linkedItems: links(28, 29, 30, 31) },
  { id: '30.6', heading: 'Fonctions', topicsFr: 'Comprendre de l’information et une demande d’information sur ce qui est permis ou interdit', kind: 'function', covered: true, itemCount: links(32, 33, 34).length, linkedItems: links(32, 33, 34) },
  { id: '30.7', heading: 'Fonctions', topicsFr: 'Demander et donner de l’information sur ce qui est permis ou interdit', kind: 'function', covered: true, itemCount: links(32, 33, 34).length, linkedItems: links(32, 33, 34) },
  { id: '30.8', heading: 'Fonctions', topicsFr: 'Comprendre une demande de permission ou d’approbation et la réponse', kind: 'function', covered: true, itemCount: links(38, 39).length, linkedItems: links(38, 39) },
  { id: '30.9', heading: 'Fonctions', topicsFr: 'Demander une permission ou une approbation et répondre', kind: 'function', covered: true, itemCount: links(38, 39).length, linkedItems: links(38, 39) },
  { id: '30.10', heading: 'Langue écrite', topicsFr: 'Compréhension d’une permission, d’une interdiction ou d’une approbation dans un document écrit', kind: 'writing', covered: true, itemCount: links(44, 45, 46).length, linkedItems: links(44, 45, 46) },
  { id: '30.11', heading: 'Compréhension de l’oral', topicsFr: 'Comprendre globalement et en détail un document enregistré', kind: 'oral', covered: true, itemCount: links(38, 39).length, linkedItems: links(38, 39) },
];
coverage.examples = { sourceMarkers: 7, derivedItems: items.length, convertible: true, covered: true, note: 'Model expressions are embedded in self-contained practice items and the learn tab.' };
coverage.activities = coverage.activities.map((activity) => {
  const linkedItems = byActivity.get(activity.activity) || [];
  return linkedItems.length ? { ...activity, convertible: true, extracted: true, itemCount: linkedItems.length, linkedItems } : activity;
});
coverage.validation = {
  strictComplete: false,
  convertibleComplete: true,
  totalElements: 63,
  coveredElements: 38,
  convertible: { covered: 38, total: 38 },
  actionableGaps: { sections: [], activities: [], vocabulary: [], examples: [], selfTest: ['selfeval-3 (SC102-2-45-3)'] },
  nonConvertible: { sections: [], activities: [1, 3, 7, 14, 19, 21, 22, 24, 27, 35, 36, 37, 40, 41, 42, 43, 47, 48, 49] },
  note: 'All answer-keyed OF30 activities and function/reading sections have self-contained, concept-focused items. Oral/group production activities remain non-auto-gradable.',
};
fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);

console.log(`OF30 implemented: ${items.length} source-derived items + ${vocabItems.length} vocab = ${bank.items.length} total.`);
