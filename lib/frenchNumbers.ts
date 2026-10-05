export const MAX_FRENCH_INTEGER = 999_999_999_999_999n;

export type FrenchFormatMode =
  | "cardinal"
  | "percent"
  | "currency"
  | "ordinal"
  | "date"
  | "time"
  | "digits";

export type FrenchCurrency = "CAD" | "USD" | "EUR";
export type FrenchGender = "masculine" | "feminine";

export type FrenchFormatOptions = {
  mode: FrenchFormatMode;
  currency?: FrenchCurrency;
  gender?: FrenchGender;
};

export type FrenchFormatResult =
  | { ok: true; text: string; normalizedInput: string }
  | { ok: false; error: string; example: string };

export type NumberDifficulty = "beginner" | "intermediate" | "advanced" | "mixed";
export type NumberCategory = "cardinals" | "formats" | "ordinals" | "math";
export type NumberAnswerKind = "words" | "number" | "choice";

export type NumberQuestion = {
  id: string;
  category: NumberCategory;
  prompt: string;
  instruction: string;
  answer: string;
  answerKind: NumberAnswerKind;
  options?: string[];
  rule: string;
};

export type NumberSessionConfig = {
  count: number;
  difficulty: NumberDifficulty;
  categories: NumberCategory[];
  seed?: number;
};

const SMALL = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
] as const;

const TENS: Record<number, string> = {
  20: "vingt",
  30: "trente",
  40: "quarante",
  50: "cinquante",
  60: "soixante",
};

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
] as const;

const DIGITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"] as const;

const FORMAT_EXAMPLES: Record<FrenchFormatMode, string> = {
  cardinal: "Exemple : -12 345,07",
  percent: "Exemple : 15,5 %",
  currency: "Exemple : 1 250,50 $",
  ordinal: "Exemple : 21",
  date: "Exemple : 2026-10-05 ou 05/10/2026",
  time: "Exemple : 14:30 ou 14 h 30",
  digits: "Exemple : +1 613-555-0123",
};

function underHundred(value: number, terminal: boolean, feminine: boolean): string {
  if (value <= 16) {
    if (value === 1 && feminine) return "une";
    return SMALL[value];
  }
  if (value < 20) return `dix-${SMALL[value - 10]}`;

  if (value < 70) {
    const tens = Math.floor(value / 10) * 10;
    const rest = value % 10;
    const base = TENS[tens];
    if (rest === 0) return base;
    if (rest === 1) return `${base} et ${feminine ? "une" : "un"}`;
    return `${base}-${underHundred(rest, terminal, feminine)}`;
  }

  if (value < 80) {
    const rest = value - 60;
    if (rest === 11) return "soixante et onze";
    return `soixante-${underHundred(rest, terminal, feminine)}`;
  }

  const rest = value - 80;
  if (rest === 0) return terminal ? "quatre-vingts" : "quatre-vingt";
  return `quatre-vingt-${underHundred(rest, terminal, feminine)}`;
}

function underThousand(value: number, terminal: boolean, feminine: boolean): string {
  if (value < 100) return underHundred(value, terminal, feminine);
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const head = hundreds === 1 ? "cent" : `${SMALL[hundreds]} cent${rest === 0 && terminal ? "s" : ""}`;
  return rest === 0 ? head : `${head} ${underHundred(rest, terminal, feminine)}`;
}

/** Spell a non-decimal integer using traditional Canadian French number spelling. */
export function spellFrenchCardinal(
  value: bigint,
  context: { feminine?: boolean } = {},
): string {
  if (value > MAX_FRENCH_INTEGER || value < -MAX_FRENCH_INTEGER) {
    throw new RangeError(`Value must be between -${MAX_FRENCH_INTEGER} and ${MAX_FRENCH_INTEGER}.`);
  }
  if (value === 0n) return "zéro";
  if (value < 0n) return `moins ${spellFrenchCardinal(-value, context)}`;

  const scales = [
    { divisor: 1_000_000_000_000n, singular: "billion", plural: "billions", noun: true },
    { divisor: 1_000_000_000n, singular: "milliard", plural: "milliards", noun: true },
    { divisor: 1_000_000n, singular: "million", plural: "millions", noun: true },
    { divisor: 1_000n, singular: "mille", plural: "mille", noun: false },
  ] as const;

  let remaining = value;
  const parts: string[] = [];
  for (const scale of scales) {
    const group = remaining / scale.divisor;
    if (group === 0n) continue;
    remaining %= scale.divisor;
    const groupNumber = Number(group);
    if (scale.divisor === 1_000n && group === 1n) {
      parts.push("mille");
      continue;
    }
    const words = underThousand(groupNumber, scale.noun, false);
    const label = group > 1n ? scale.plural : scale.singular;
    parts.push(`${words} ${label}`);
  }

  if (remaining > 0n) {
    parts.push(underThousand(Number(remaining), true, context.feminine === true));
  }
  return parts.join(" ");
}

function ordinalizeLastWord(cardinal: string): string {
  return cardinal.replace(/([a-zà-ÿ]+)$/iu, (raw) => {
    const word = raw.toLocaleLowerCase("fr-CA");
    const special: Record<string, string> = {
      un: "unième",
      deux: "deuxième",
      trois: "troisième",
      quatre: "quatrième",
      cinq: "cinquième",
      neuf: "neuvième",
      mille: "millième",
      million: "millionième",
      millions: "millionième",
      milliard: "milliardième",
      milliards: "milliardième",
      billion: "billionième",
      billions: "billionième",
      cent: "centième",
      cents: "centième",
      vingt: "vingtième",
      vingts: "vingtième",
    };
    if (special[word]) return special[word];
    return `${word.endsWith("e") ? word.slice(0, -1) : word}ième`;
  });
}

export function spellFrenchOrdinal(value: bigint, gender: FrenchGender = "masculine"): string {
  if (value <= 0n) throw new RangeError("An ordinal must be a positive whole number.");
  if (value > MAX_FRENCH_INTEGER) throw new RangeError(`The maximum supported ordinal is ${MAX_FRENCH_INTEGER}.`);
  if (value === 1n) return gender === "feminine" ? "première" : "premier";
  return ordinalizeLastWord(spellFrenchCardinal(value));
}

type ParsedNumeric = {
  sign: "" | "+" | "-";
  integer: bigint;
  integerDigits: string;
  fraction: string;
};

function fail(mode: FrenchFormatMode, error: string): FrenchFormatResult {
  return { ok: false, error, example: FORMAT_EXAMPLES[mode] };
}

function stripModeSymbols(input: string, mode: FrenchFormatMode): string {
  let value = input.trim().replace(/[\u00a0\u202f]/g, " ");
  if (mode === "percent") value = value.replace(/\s*%\s*$/, "");
  if (mode === "currency") {
    value = value.replace(/(?:CA\$|US\$|CAD|USD|EUR|\$|€)/giu, " ").trim();
  }
  return value;
}

function parseNumeric(input: string, mode: FrenchFormatMode, maxFraction = 12): ParsedNumeric | FrenchFormatResult {
  const stripped = stripModeSymbols(input, mode);
  const normalizedSpaces = stripped.replace(/\s+/g, " ").trim();
  const match = /^([+-]?)(\d+|\d{1,3}(?: \d{3})+)(?:([,.])(\d+))?$/.exec(normalizedSpaces);
  if (!match) return fail(mode, "Enter one number using spaces for digit grouping and a comma or point for decimals.");
  const integerDigits = match[2].replace(/ /g, "").replace(/^0+(?=\d)/, "");
  const fraction = match[4] ?? "";
  if (fraction.length > maxFraction) return fail(mode, `Use no more than ${maxFraction} decimal places.`);
  const integer = BigInt(integerDigits);
  if (integer > MAX_FRENCH_INTEGER) return fail(mode, "That value is larger than the supported trillion range.");
  return { sign: match[1] as ParsedNumeric["sign"], integer, integerDigits, fraction };
}

function signedWords(parsed: ParsedNumeric, feminine = false): string {
  const prefix = parsed.sign === "-" ? "moins " : parsed.sign === "+" ? "plus " : "";
  const integerWords = spellFrenchCardinal(parsed.integer, { feminine });
  if (!parsed.fraction) return `${prefix}${integerWords}`;
  const leadingZeroCount = parsed.fraction.match(/^0*/)?.[0].length ?? 0;
  const leadingZeros = Array.from({ length: leadingZeroCount }, () => "zéro");
  const remainingDigits = parsed.fraction.slice(leadingZeroCount);
  const fractionWords = [
    ...leadingZeros,
    ...(remainingDigits ? [spellFrenchCardinal(BigInt(remainingDigits))] : []),
  ].join(" ");
  return `${prefix}${integerWords} virgule ${fractionWords}`;
}

function formatCurrency(parsed: ParsedNumeric, currency: FrenchCurrency): string {
  const cents = Number((parsed.fraction + "00").slice(0, 2));
  const prefix = parsed.sign === "-" ? "moins " : parsed.sign === "+" ? "plus " : "";
  const major = {
    CAD: ["dollar canadien", "dollars canadiens"],
    USD: ["dollar américain", "dollars américains"],
    EUR: ["euro", "euros"],
  }[currency];
  const minor = currency === "EUR" ? ["centime", "centimes"] : ["cent", "cents"];
  const parts: string[] = [];
  if (parsed.integer > 0n || cents === 0) {
    parts.push(`${spellFrenchCardinal(parsed.integer)} ${parsed.integer === 1n ? major[0] : major[1]}`);
  }
  if (cents > 0) {
    parts.push(`${spellFrenchCardinal(BigInt(cents))} ${cents === 1 ? minor[0] : minor[1]}`);
  }
  return `${prefix}${parts.join(" et ")}`;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function formatDate(input: string): FrenchFormatResult {
  const value = input.trim();
  let year: number;
  let month: number;
  let day: number;
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    [, year, month, day] = match.map(Number);
  } else {
    match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!match) return fail("date", "Use ISO year-month-day or the unambiguous Canadian day/month/year form.");
    day = Number(match[1]); month = Number(match[2]); year = Number(match[3]);
  }
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
    return fail("date", "Enter a valid calendar date.");
  }
  const dayWords = day === 1 ? "premier" : spellFrenchCardinal(BigInt(day));
  return {
    ok: true,
    text: `le ${dayWords} ${MONTHS[month - 1]} ${spellFrenchCardinal(BigInt(year))}`,
    normalizedInput: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

function formatTime(input: string): FrenchFormatResult {
  const match = /^(\d{1,2})(?::|\s*h\s*)(\d{2})$/i.exec(input.trim());
  if (!match) return fail("time", "Use a 24-hour time with hours and two-digit minutes.");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return fail("time", "Enter a valid time between 00:00 and 23:59.");
  let text: string;
  if (hour === 0) text = "minuit";
  else if (hour === 12) text = "midi";
  else text = `${spellFrenchCardinal(BigInt(hour), { feminine: true })} heure${hour === 1 ? "" : "s"}`;
  if (minute > 0) text += ` ${spellFrenchCardinal(BigInt(minute))}`;
  return { ok: true, text, normalizedInput: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

function formatDigits(input: string): FrenchFormatResult {
  const value = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(value) || !/\d/.test(value)) {
    return fail("digits", "Use digits with optional spaces, parentheses, periods, or hyphens.");
  }
  const plus = value.startsWith("+");
  const groups = value.replace(/^\+/, "").split(/[^\d]+/).filter(Boolean);
  const words = groups.map((group) => [...group].map((digit) => DIGITS[Number(digit)]).join(" ")).join(" · ");
  return { ok: true, text: `${plus ? "plus " : ""}${words}`, normalizedInput: value };
}

export function formatFrenchValue(input: string, options: FrenchFormatOptions): FrenchFormatResult {
  const { mode } = options;
  if (!input.trim()) return fail(mode, "Enter a value to convert.");
  if (mode === "date") return formatDate(input);
  if (mode === "time") return formatTime(input);
  if (mode === "digits") return formatDigits(input);

  const parsed = parseNumeric(input, mode, mode === "currency" ? 2 : 12);
  if ("ok" in parsed) return parsed;

  if (mode === "ordinal") {
    if (parsed.fraction || parsed.sign === "-" || parsed.integer === 0n) {
      return fail(mode, "An ordinal must be a positive whole number.");
    }
    return {
      ok: true,
      text: spellFrenchOrdinal(parsed.integer, options.gender ?? "masculine"),
      normalizedInput: parsed.integer.toString(),
    };
  }
  if (mode === "currency") {
    return {
      ok: true,
      text: formatCurrency(parsed, options.currency ?? "CAD"),
      normalizedInput: `${parsed.sign}${parsed.integer}${parsed.fraction ? `,${parsed.fraction}` : ""}`,
    };
  }
  const text = signedWords(parsed);
  return {
    ok: true,
    text: mode === "percent" ? `${text} pour cent` : text,
    normalizedInput: `${parsed.sign}${parsed.integer}${parsed.fraction ? `,${parsed.fraction}` : ""}${mode === "percent" ? " %" : ""}`,
  };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function choose<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)];
}

function shuffle<T>(random: () => number, values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const next = Math.floor(random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function resolvedDifficulty(random: () => number, difficulty: NumberDifficulty): Exclude<NumberDifficulty, "mixed"> {
  return difficulty === "mixed" ? choose(random, ["beginner", "intermediate", "advanced"] as const) : difficulty;
}

function randomCardinal(random: () => number, difficulty: Exclude<NumberDifficulty, "mixed">): bigint {
  if (difficulty === "beginner") return BigInt(randomInt(random, 0, 99));
  if (difficulty === "intermediate") return BigInt(randomInt(random, 0, 999_999));
  const groups = randomInt(random, 2, 5);
  let digits = String(randomInt(random, 1, 999));
  for (let index = 1; index < groups; index++) digits += String(randomInt(random, 0, 999)).padStart(3, "0");
  return BigInt(digits);
}

function cardinalQuestion(random: () => number, difficulty: Exclude<NumberDifficulty, "mixed">, id: string): NumberQuestion {
  const value = randomCardinal(random, difficulty);
  const words = spellFrenchCardinal(value);
  if (random() < 0.5) {
    return { id, category: "cardinals", prompt: value.toLocaleString("fr-CA"), instruction: "Écrivez ce nombre en lettres.", answer: words, answerKind: "words", rule: "Respectez les traits d’union, « et » et les accords de cent et vingt." };
  }
  return { id, category: "cardinals", prompt: words, instruction: "Écrivez ce nombre en chiffres.", answer: value.toString(), answerKind: "number", rule: "Regroupez mentalement les milliers, millions, milliards et billions." };
}

function ordinalQuestion(random: () => number, difficulty: Exclude<NumberDifficulty, "mixed">, id: string): NumberQuestion {
  const max = difficulty === "beginner" ? 30 : difficulty === "intermediate" ? 999 : 999_999;
  const value = BigInt(randomInt(random, 1, max));
  const feminine = random() < 0.25;
  const answer = spellFrenchOrdinal(value, feminine ? "feminine" : "masculine");
  return {
    id,
    category: "ordinals",
    prompt: `${value}${value === 1n ? (feminine ? "re" : "er") : "e"}`,
    instruction: `Écrivez l’ordinal en lettres (${feminine ? "féminin" : "masculin"}).`,
    answer,
    answerKind: "words",
    rule: value === 1n ? "Premier devient première au féminin." : "L’ordinal se forme généralement avec -ième; cinq et neuf changent de forme.",
  };
}

function formatQuestion(random: () => number, difficulty: Exclude<NumberDifficulty, "mixed">, id: string): NumberQuestion {
  const kind = choose(random, ["percent", "currency", "date", "time", "digits"] as const);
  if (kind === "percent") {
    const whole = difficulty === "beginner" ? randomInt(random, 1, 100) : randomInt(random, 1, 999);
    const input = difficulty === "beginner" ? `${whole} %` : `${whole},${randomInt(random, 1, 9)} %`;
    const result = formatFrenchValue(input, { mode: "percent" });
    return { id, category: "formats", prompt: input, instruction: "Écrivez ce pourcentage en lettres.", answer: result.ok ? result.text : "", answerKind: "words", rule: "Le symbole % se lit « pour cent », toujours en deux mots." };
  }
  if (kind === "currency") {
    const currency = choose(random, ["CAD", "USD", "EUR"] as const);
    const whole = difficulty === "beginner" ? randomInt(random, 0, 99) : randomInt(random, 0, 99_999);
    const cents = randomInt(random, 0, 99);
    const symbol = currency === "EUR" ? "€" : currency;
    const input = `${whole},${String(cents).padStart(2, "0")} ${symbol}`;
    const result = formatFrenchValue(input, { mode: "currency", currency });
    return { id, category: "formats", prompt: input, instruction: "Écrivez cette somme en lettres.", answer: result.ok ? result.text : "", answerKind: "words", rule: "Accordez l’unité monétaire et séparez les unités des cents ou centimes avec « et »." };
  }
  if (kind === "date") {
    const year = randomInt(random, 1990, 2035);
    const month = randomInt(random, 1, 12);
    const day = randomInt(random, 1, 28);
    const input = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const result = formatFrenchValue(input, { mode: "date" });
    return { id, category: "formats", prompt: input, instruction: "Écrivez cette date en lettres.", answer: result.ok ? result.text : "", answerKind: "words", rule: "Seul le premier jour du mois est ordinal : le premier; les autres jours sont cardinaux." };
  }
  if (kind === "time") {
    const hour = randomInt(random, 0, 23);
    const minute = choose(random, [0, 5, 10, 15, 20, 30, 45, 50, 55]);
    const input = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const result = formatFrenchValue(input, { mode: "time" });
    return { id, category: "formats", prompt: input, instruction: "Écrivez cette heure en lettres.", answer: result.ok ? result.text : "", answerKind: "words", rule: "0 h se lit minuit, 12 h se lit midi; heure est féminin." };
  }
  const groups = [String(randomInt(random, 100, 999)), String(randomInt(random, 100, 999)), String(randomInt(random, 0, 9999)).padStart(4, "0")];
  const input = groups.join("-");
  const result = formatFrenchValue(input, { mode: "digits" });
  return { id, category: "formats", prompt: input, instruction: "Lisez ce numéro chiffre par chiffre.", answer: result.ok ? result.text : "", answerKind: "words", rule: "Les numéros et codes conservent chaque chiffre, y compris les zéros initiaux." };
}

function mathQuestion(random: () => number, difficulty: Exclude<NumberDifficulty, "mixed">, id: string): NumberQuestion {
  const max = difficulty === "beginner" ? 30 : difficulty === "intermediate" ? 100 : 500;
  const operator = choose(random, difficulty === "beginner" ? ["+", "-"] as const : ["+", "-", "×", "÷"] as const);
  let left = randomInt(random, 1, max);
  let right = randomInt(random, 1, max);
  let result: number;
  let operatorWords: string;
  if (operator === "+") { result = left + right; operatorWords = "plus"; }
  else if (operator === "-") {
    if (difficulty !== "advanced" && right > left) [left, right] = [right, left];
    result = left - right; operatorWords = "moins";
  } else if (operator === "×") {
    right = randomInt(random, 2, difficulty === "advanced" ? 20 : 12);
    result = left * right; operatorWords = "multiplié par";
  } else {
    right = randomInt(random, 2, difficulty === "advanced" ? 20 : 12);
    result = left;
    left *= right;
    operatorWords = "divisé par";
  }
  return {
    id,
    category: "math",
    prompt: `${spellFrenchCardinal(BigInt(left))} ${operatorWords} ${spellFrenchCardinal(BigInt(right))}`,
    instruction: "Calculez et répondez en chiffres.",
    answer: String(result),
    answerKind: "number",
    rule: `plus = + · moins = − · multiplié par = × · divisé par = ÷`,
  };
}

export function generateNumberQuestions(config: NumberSessionConfig): NumberQuestion[] {
  const categories = config.categories.length ? config.categories : ["cardinals"];
  const random = mulberry32(config.seed ?? Date.now());
  const questions: NumberQuestion[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (questions.length < config.count && attempts < config.count * 100) {
    attempts++;
    const category = choose(random, categories);
    const difficulty = resolvedDifficulty(random, config.difficulty);
    const id = `num-${config.seed ?? "session"}-${attempts}`;
    const question = category === "cardinals"
      ? cardinalQuestion(random, difficulty, id)
      : category === "ordinals"
        ? ordinalQuestion(random, difficulty, id)
        : category === "formats"
          ? formatQuestion(random, difficulty, id)
          : mathQuestion(random, difficulty, id);
    const key = `${question.prompt}|${question.instruction}`;
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(question);
  }
  return questions;
}

export function normalizeFrenchWords(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("fr-CA")
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s*[·•]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNumberAnswerCorrect(question: NumberQuestion, response: string): boolean {
  if (question.answerKind === "words" || question.answerKind === "choice") {
    return normalizeFrenchWords(response) === normalizeFrenchWords(question.answer);
  }
  const normalizeNumeric = (value: string) => {
    const compact = value.trim().replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
    if (/^[+-]?\d+$/.test(compact)) return BigInt(compact).toString();
    return compact.replace(/^\+/, "").replace(/\.0+$/, "");
  };
  try {
    return normalizeNumeric(response) === normalizeNumeric(question.answer);
  } catch {
    return false;
  }
}

export function buildSpecialCaseQuestion(index: number): NumberQuestion {
  const cases = [
    ["200", "deux cents", ["deux cent", "deux cents", "deux-cent", "deux-cent(s)"], "Cent prend un s lorsqu’il est multiplié et termine le nombre."],
    ["201", "deux cent un", ["deux cents un", "deux cent et un", "deux cent un", "deux-cent-un"], "Cent reste invariable lorsqu’un autre nombre le suit."],
    ["71", "soixante et onze", ["soixante-onze", "septante et un", "soixante et onze", "soixante-dix-un"], "On emploie « et » devant onze dans soixante et onze."],
    ["80", "quatre-vingts", ["quatre-vingt", "quatre vingts", "quatre-vingts", "huitante"], "Vingt prend un s dans quatre-vingts lorsqu’il termine le nombre."],
    ["81", "quatre-vingt-un", ["quatre-vingts-un", "quatre-vingt et un", "quatre-vingt-un", "huitante et un"], "Quatre-vingt-un n’emploie pas « et » et vingt perd son s."],
    ["80 000", "quatre-vingt mille", ["quatre-vingts mille", "quatre-vingt mille", "quatre-vingt-mille", "huitante mille"], "Vingt reste invariable devant l’adjectif numéral mille."],
    ["80 000 000", "quatre-vingts millions", ["quatre-vingt millions", "quatre-vingts millions", "quatre-vingts million", "quatre-vingt-million"], "Million est un nom; vingt peut donc garder son s devant lui."],
    ["15 %", "quinze pour cent", ["quinze pourcent", "quinze de cent", "quinze pour cent", "quinze percent"], "Pour cent s’écrit toujours en deux mots."],
  ] as const;
  const item = cases[index % cases.length];
  return {
    id: `special-${index}`,
    category: "cardinals",
    prompt: item[0],
    instruction: "Choisissez la forme traditionnelle correcte.",
    answer: item[1],
    answerKind: "choice",
    options: shuffle(mulberry32(index + 41), [...item[2]]),
    rule: item[3],
  };
}
