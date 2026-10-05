import assert from "node:assert/strict";
import {
  MAX_FRENCH_INTEGER,
  buildFormatLabQuestion,
  buildNumberCompareQuestion,
  buildNumberSequenceQuestion,
  formatFrenchValue,
  generateNumberQuestions,
  isNumberAnswerCorrect,
  spellFrenchCardinal,
  spellFrenchOrdinal,
} from "../lib/frenchNumbers.ts";

const cardinals: Array<[bigint, string]> = [
  [0n, "zéro"], [1n, "un"], [16n, "seize"], [17n, "dix-sept"],
  [21n, "vingt et un"], [31n, "trente et un"], [41n, "quarante et un"],
  [51n, "cinquante et un"], [61n, "soixante et un"], [70n, "soixante-dix"],
  [71n, "soixante et onze"], [80n, "quatre-vingts"], [81n, "quatre-vingt-un"],
  [90n, "quatre-vingt-dix"], [91n, "quatre-vingt-onze"], [99n, "quatre-vingt-dix-neuf"],
  [100n, "cent"], [200n, "deux cents"], [201n, "deux cent un"],
  [280n, "deux cent quatre-vingts"], [1_000n, "mille"],
  [80_000n, "quatre-vingt mille"], [200_000n, "deux cent mille"],
  [80_000_000n, "quatre-vingts millions"], [200_000_000n, "deux cents millions"],
  [1_000_000_000n, "un milliard"], [1_000_000_000_000n, "un billion"],
  [MAX_FRENCH_INTEGER, "neuf cent quatre-vingt-dix-neuf billions neuf cent quatre-vingt-dix-neuf milliards neuf cent quatre-vingt-dix-neuf millions neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf"],
];

for (const [value, expected] of cardinals) assert.equal(spellFrenchCardinal(value), expected, String(value));
assert.equal(spellFrenchCardinal(21n, { feminine: true }), "vingt et une");
assert.equal(spellFrenchCardinal(-42n), "moins quarante-deux");
assert.throws(() => spellFrenchCardinal(MAX_FRENCH_INTEGER + 1n), RangeError);

assert.equal(spellFrenchOrdinal(1n), "premier");
assert.equal(spellFrenchOrdinal(1n, "feminine"), "première");
assert.equal(spellFrenchOrdinal(5n), "cinquième");
assert.equal(spellFrenchOrdinal(9n), "neuvième");
assert.equal(spellFrenchOrdinal(21n), "vingt et unième");
assert.equal(spellFrenchOrdinal(80n), "quatre-vingtième");
assert.equal(spellFrenchOrdinal(200n), "deux centième");

function expectText(input: string, mode: Parameters<typeof formatFrenchValue>[1], expected: string) {
  const result = formatFrenchValue(input, mode);
  assert.equal(result.ok, true, input);
  if (result.ok) assert.equal(result.text, expected, input);
}

expectText("-2,05", { mode: "cardinal" }, "moins deux virgule zéro cinq");
expectText("+12.50", { mode: "cardinal" }, "plus douze virgule cinquante");
expectText("12,345", { mode: "cardinal" }, "douze virgule trois cent quarante-cinq");
expectText("1,0050", { mode: "cardinal" }, "un virgule zéro zéro cinquante");
expectText("15,5 %", { mode: "percent" }, "quinze virgule cinq pour cent");
expectText("1,01 $", { mode: "currency", currency: "CAD" }, "un dollar canadien et un cent");
expectText("2.50 EUR", { mode: "currency", currency: "EUR" }, "deux euros et cinquante centimes");
expectText("2024-02-29", { mode: "date" }, "le vingt-neuf février deux mille vingt-quatre");
expectText("01/10/2026", { mode: "date" }, "le premier octobre deux mille vingt-six");
expectText("00:00", { mode: "time" }, "minuit");
expectText("12:00", { mode: "time" }, "midi");
expectText("21 h 05", { mode: "time" }, "vingt et une heures cinq");
expectText("+1 613-055-0123", { mode: "digits" }, "plus un · six un trois · zéro cinq cinq · zéro un deux trois");

assert.equal(formatFrenchValue("2023-02-29", { mode: "date" }).ok, false);
assert.equal(formatFrenchValue("24:00", { mode: "time" }).ok, false);
assert.equal(formatFrenchValue("1,234", { mode: "currency" }).ok, false);
assert.equal(formatFrenchValue("12 34", { mode: "cardinal" }).ok, false);
assert.equal(formatFrenchValue("1000000000000000", { mode: "cardinal" }).ok, false);

const session = generateNumberQuestions({ count: 30, difficulty: "mixed", categories: ["cardinals", "formats", "ordinals", "math"], seed: 12345 });
assert.equal(session.length, 30);
assert.equal(new Set(session.map((question) => `${question.prompt}|${question.instruction}`)).size, 30);
assert.deepEqual(session, generateNumberQuestions({ count: 30, difficulty: "mixed", categories: ["cardinals", "formats", "ordinals", "math"], seed: 12345 }));
for (const question of session) {
  assert.equal(isNumberAnswerCorrect(question, question.answer), true, question.id);
  assert.ok(question.prompt.length > 0 && question.rule.length > 0);
}

const strictQuestion = { ...session[0], answer: "deux cents", answerKind: "words" as const };
assert.equal(isNumberAnswerCorrect(strictQuestion, "Deux cents"), true);
assert.equal(isNumberAnswerCorrect(strictQuestion, "deux cent"), false);
const codeQuestion = { ...session[0], answer: "six un trois · zéro cinq", answerKind: "words" as const };
assert.equal(isNumberAnswerCorrect(codeQuestion, "six un trois zéro cinq"), true);

for (const build of [buildFormatLabQuestion, buildNumberCompareQuestion, buildNumberSequenceQuestion]) {
  const questions = Array.from({ length: 20 }, (_, index) => build(index, "mixed", 2468));
  assert.deepEqual(questions, Array.from({ length: 20 }, (_, index) => build(index, "mixed", 2468)));
  assert.equal(new Set(questions.map((question) => question.id)).size, 20);
  assert.equal(new Set(questions.map((question) => `${question.prompt}|${question.options?.join("|") ?? ""}`)).size, 20);
  for (const question of questions) {
    assert.equal(isNumberAnswerCorrect(question, question.answer), true, question.id);
    if (question.options) {
      assert.equal(new Set(question.options).size, question.options.length, question.id);
      assert.ok(question.options.includes(question.answer), question.id);
    }
  }
}

console.log(`French number tests passed (${cardinals.length} cardinal boundaries + formatter and generator coverage).`);
