import type { Item } from "./content.ts";
import { VERB_CONSTRUCTIONS, type VerbConstruction } from "./verbConstructions.ts";

type YEnCase = {
  source: string;
  target: string;
  replaced: string;
  focus: "y" | "en" | "person";
  difficulty: Item["difficulty"];
  rule: string;
};

const Y_EN_CASES: YEnCase[] = [
  { source: "Je vais au bureau.", target: "J’y vais.", replaced: "au bureau", focus: "y", difficulty: "easy", rule: "Y replaces a place introduced by à." },
  { source: "Nous pensons à ce projet.", target: "Nous y pensons.", replaced: "à ce projet", focus: "y", difficulty: "easy", rule: "Y replaces à followed by a thing." },
  { source: "Elle participe à la réunion.", target: "Elle y participe.", replaced: "à la réunion", focus: "y", difficulty: "easy", rule: "Y replaces à la réunion." },
  { source: "Ils répondent à la demande.", target: "Ils y répondent.", replaced: "à la demande", focus: "y", difficulty: "easy", rule: "Y replaces à followed by a thing." },
  { source: "Tu t’habitues au nouvel horaire.", target: "Tu t’y habitues.", replaced: "au nouvel horaire", focus: "y", difficulty: "medium", rule: "Y comes before the conjugated verb and after a reflexive pronoun." },
  { source: "Il a réfléchi à la proposition.", target: "Il y a réfléchi.", replaced: "à la proposition", focus: "y", difficulty: "medium", rule: "In a compound tense, y comes before the auxiliary." },
  { source: "Nous allons participer à l’atelier.", target: "Nous allons y participer.", replaced: "à l’atelier", focus: "y", difficulty: "medium", rule: "When y belongs to an infinitive, it goes immediately before that infinitive." },
  { source: "Je ne vais pas à la réunion.", target: "Je n’y vais pas.", replaced: "à la réunion", focus: "y", difficulty: "medium", rule: "In a negative sentence, y remains before the verb." },
  { source: "Va au bureau!", target: "Vas-y!", replaced: "au bureau", focus: "y", difficulty: "advanced", rule: "At the affirmative imperative, y follows the verb with a hyphen; va adds an euphonious s." },
  { source: "Ne va pas au bureau!", target: "N’y va pas!", replaced: "au bureau", focus: "y", difficulty: "advanced", rule: "At the negative imperative, y returns before the verb and va has no added s." },
  { source: "Retourne à la réception!", target: "Retournes-y!", replaced: "à la réception", focus: "y", difficulty: "advanced", rule: "An -er imperative adds an euphonious s before y." },
  { source: "Je parle à Marie.", target: "Je lui parle.", replaced: "à Marie", focus: "person", difficulty: "medium", rule: "For a person introduced by à, use lui rather than y." },
  { source: "Nous répondons aux gestionnaires.", target: "Nous leur répondons.", replaced: "aux gestionnaires", focus: "person", difficulty: "medium", rule: "For plural people introduced by à, use leur rather than y." },
  { source: "Je parle de ce dossier.", target: "J’en parle.", replaced: "de ce dossier", focus: "en", difficulty: "easy", rule: "En replaces de followed by a thing." },
  { source: "Elle revient de Montréal.", target: "Elle en revient.", replaced: "de Montréal", focus: "en", difficulty: "easy", rule: "En can replace a place of origin introduced by de." },
  { source: "Nous avons besoin de temps.", target: "Nous en avons besoin.", replaced: "de temps", focus: "en", difficulty: "easy", rule: "En replaces the de-complement in avoir besoin de." },
  { source: "Il s’occupe du rapport.", target: "Il s’en occupe.", replaced: "du rapport", focus: "en", difficulty: "medium", rule: "En follows the reflexive pronoun and replaces de + thing." },
  { source: "J’ai trois dossiers.", target: "J’en ai trois.", replaced: "dossiers", focus: "en", difficulty: "medium", rule: "En replaces a counted noun; the quantity stays in the sentence." },
  { source: "Elle achète du café.", target: "Elle en achète.", replaced: "du café", focus: "en", difficulty: "easy", rule: "En replaces a partitive noun phrase." },
  { source: "Nous avons discuté de cette option.", target: "Nous en avons discuté.", replaced: "de cette option", focus: "en", difficulty: "medium", rule: "In a compound tense, en comes before the auxiliary." },
  { source: "Je vais parler de ce problème.", target: "Je vais en parler.", replaced: "de ce problème", focus: "en", difficulty: "medium", rule: "When en belongs to an infinitive, it goes immediately before that infinitive." },
  { source: "Je ne parle pas de ce sujet.", target: "Je n’en parle pas.", replaced: "de ce sujet", focus: "en", difficulty: "medium", rule: "In a negative sentence, en remains before the verb." },
  { source: "Parle de ce dossier!", target: "Parles-en!", replaced: "de ce dossier", focus: "en", difficulty: "advanced", rule: "An -er imperative adds an euphonious s before en." },
  { source: "Ne parle pas de ce dossier!", target: "N’en parle pas!", replaced: "de ce dossier", focus: "en", difficulty: "advanced", rule: "At the negative imperative, en goes before the verb with no added s." },
  { source: "Prenez des exemplaires!", target: "Prenez-en!", replaced: "des exemplaires", focus: "en", difficulty: "advanced", rule: "At the affirmative imperative, en follows the verb with a hyphen." },
  { source: "Elle est fière de son équipe.", target: "Elle en est fière.", replaced: "de son équipe", focus: "en", difficulty: "advanced", rule: "En can replace a complement of an adjective introduced by de." },
  { source: "Donnez des documents à Marie!", target: "Donnez-lui-en!", replaced: "des documents à Marie", focus: "en", difficulty: "advanced", rule: "With two imperative pronouns, lui precedes en." },
  { source: "N’allez pas à cette réunion!", target: "N’y allez pas!", replaced: "à cette réunion", focus: "y", difficulty: "advanced", rule: "At the negative imperative, y goes before the verb." },
];

function explanation(rule: string, correct: string) {
  return { correct_why: `${correct} follows the required French construction.`, distractor_why: {}, grammar_rule: rule, vocab_notes: "Learn the verb together with its complete construction.", common_mistakes: ["Translating the English preposition word for word."] };
}
function tip(pattern: string) {
  return { memory_aid: "Learn the verb and its complement as one unit.", pattern, similar: [] };
}
function itemBase(id: string, type: string, difficulty: Item["difficulty"], prompt: Item["prompt"]): Omit<Item, "answer" | "distractors" | "explanation" | "tip"> {
  return { id, objectiveId: "VERB-CONSTRUCTIONS", skill: "grammar", difficulty, type, theme: "workplace", grammarConcepts: ["prepositions", "pronouns"], vocabDomains: ["workplace"], estTimeSec: type === "fill_blank" ? 35 : 25, prompt };
}

function blankPattern(construction: VerbConstruction) {
  if (construction.preposition === "none") return construction.pattern;
  const expression = construction.preposition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return construction.pattern.replace(new RegExp(`\\b${expression}\\b`, "u"), "___");
}

const PREPOSITIONS = ["à", "de", "avec", "pour", "sur", "en", "dans", "chez", "par"];
export const VERB_PREPOSITION_ITEMS: Item[] = VERB_CONSTRUCTIONS.map((construction, index) => {
  const isTyped = construction.preposition !== "none" && index % 2 === 1;
  const correct = construction.preposition === "none" ? "sans préposition" : construction.preposition;
  if (isTyped) {
    return {
      ...itemBase(`verb-prep-fill-${construction.id}`, "fill_blank", index % 5 === 0 ? "advanced" : "medium", { fr: `Complétez la construction : « ${blankPattern(construction)} »`, instructions_en: "Type the required French preposition." }),
      answer: { type: "text", accepted: [correct], normalizer: "fr_typography_strict" }, distractors: [],
      explanation: explanation(`The pattern is « ${construction.pattern} ».`, correct), tip: tip(construction.pattern),
    };
  }
  const wrongPrepositions = PREPOSITIONS.filter((value) => value !== correct).slice(index % 4, index % 4 + 3);
  const choices = [correct, ...wrongPrepositions, "sans préposition"].filter((value, position, all) => all.indexOf(value) === position).slice(0, 4);
  while (choices.length < 4) choices.push(PREPOSITIONS.find((value) => !choices.includes(value))!);
  return {
    ...itemBase(`verb-prep-choice-${construction.id}`, "mcq_single", index % 4 === 0 ? "easy" : "medium", { fr: `Quelle préposition complète « ${blankPattern(construction).replace("___", "…")} » ?`, instructions_en: "Choose the required preposition, or choose no preposition." }),
    answer: { type: "choice", accepted: [correct], normalizer: "fr_typography_strict" },
    distractors: choices.map((value) => ({ value, tag: value === correct ? "correct" : "wrong_construction" })),
    explanation: explanation(`The pattern is « ${construction.pattern} ». ${construction.note ?? ""}`.trim(), correct), tip: tip(construction.pattern),
  };
});

const CONTRACTION_CASES = [
  { sentence: "Je vais ___ bureau.", answer: "au", rule: "à + le contracts to au." },
  { sentence: "Nous répondons ___ clients.", answer: "aux", rule: "à + les contracts to aux." },
  { sentence: "Elle parle ___ dossier urgent.", answer: "du", rule: "de + le contracts to du." },
  { sentence: "Ils discutent ___ nouvelles priorités.", answer: "des", rule: "de + les contracts to des." },
  { sentence: "Je pense ___ échéance.", answer: "à l’", rule: "Before a vowel, à + l’ remains à l’." },
  { sentence: "Elle vient ___ atelier.", answer: "de l’", rule: "Before a vowel, de + l’ remains de l’." },
  { sentence: "On joue ___ soccer après le travail.", answer: "au", rule: "jouer à + le soccer becomes jouer au soccer." },
  { sentence: "Vous jouez ___ échecs.", answer: "aux", rule: "jouer à + les échecs becomes jouer aux échecs." },
  { sentence: "Il s’occupe ___ rapport.", answer: "du", rule: "s’occuper de + le rapport becomes s’occuper du rapport." },
  { sentence: "Nous avons besoin ___ chiffres définitifs.", answer: "des", rule: "avoir besoin de + les chiffres becomes avoir besoin des chiffres." },
  { sentence: "Je téléphone ___ fournisseur.", answer: "au", rule: "téléphoner à + le fournisseur becomes téléphoner au fournisseur." },
  { sentence: "Elle revient ___ bureau régional.", answer: "du", rule: "venir de + le bureau becomes venir du bureau." },
] as const;

VERB_PREPOSITION_ITEMS.push(...CONTRACTION_CASES.map((example, index): Item => {
  const typed = index % 2 === 1;
  const base = itemBase(`verb-prep-contraction-${index + 1}`, typed ? "fill_blank" : "mcq_single", index >= 8 ? "advanced" : "medium", { fr: `Complétez : « ${example.sentence} »`, instructions_en: typed ? "Type the contracted preposition." : "Choose the correct contracted preposition." });
  return {
    ...base,
    answer: { type: typed ? "text" : "choice", accepted: [example.answer], normalizer: "fr_typography_strict" },
    distractors: typed ? [] : [example.answer, "à le", "de le", example.answer === "aux" ? "des" : "aux"].filter((value, position, all) => all.indexOf(value) === position).slice(0, 4).map((value) => ({ value, tag: value === example.answer ? "correct" : "wrong_contraction" })),
    explanation: explanation(example.rule, example.answer),
    tip: tip(example.rule),
  };
}));

function swappedPronoun(answer: string) {
  if (/\by\b|[’']y\b/i.test(answer)) return answer.replace(/([’'])y\b/gi, "$1en").replace(/\by\b/gi, "en");
  if (/\ben\b|[’']en\b/i.test(answer)) return answer.replace(/([’'])en\b/gi, "$1y").replace(/\ben\b/gi, "y");
  if (/\blui\b/i.test(answer)) return answer.replace(/\blui\b/i, "y");
  if (/\bleur\b/i.test(answer)) return answer.replace(/\bleur\b/i, "y");
  return `${answer} y`;
}

export const Y_EN_ITEMS: Item[] = Y_EN_CASES.flatMap((example, index) => {
  const wrong = [swappedPronoun(example.target), example.source, example.target.replace(/-/g, " ")]
    .filter((value, position, all) => value !== example.target && all.indexOf(value) === position);
  while (wrong.length < 3) wrong.push(`${example.target.replace(/[.!]$/, "")} en.`);
  const options = [example.target, ...wrong.slice(0, 3)];
  return [
    {
      ...itemBase(`y-en-choice-${index + 1}`, "mcq_single", example.difficulty, { fr: `Remplacez « ${example.replaced} » : ${example.source}`, instructions_en: "Choose the correct replacement sentence." }),
      answer: { type: "choice", accepted: [example.target], normalizer: "fr_typography_strict" },
      distractors: options.map((value) => ({ value, tag: value === example.target ? "correct" : "pronoun_or_position" })),
      explanation: explanation(example.rule, example.target), tip: tip(example.focus === "person" ? "à + person → lui / leur" : `${example.focus} replaces the highlighted complement`),
    },
    {
      ...itemBase(`y-en-fill-${index + 1}`, "fill_blank", example.difficulty, { fr: `Réécrivez en remplaçant « ${example.replaced} » : ${example.source}`, instructions_en: "Type the complete sentence with the correct pronoun and word order." }),
      answer: { type: "text", accepted: [example.target], normalizer: "fr_typography_strict" }, distractors: [],
      explanation: explanation(example.rule, example.target), tip: tip(example.focus === "person" ? "à + person → lui / leur" : `${example.focus} replaces the highlighted complement`),
    },
  ] as Item[];
});

export function getVerbGameItems(kind?: "prepositions" | "y-en"): Item[] {
  if (kind === "prepositions") return VERB_PREPOSITION_ITEMS;
  if (kind === "y-en") return Y_EN_ITEMS;
  return [...VERB_PREPOSITION_ITEMS, ...Y_EN_ITEMS];
}
