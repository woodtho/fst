import assert from "node:assert/strict";
import { VERBS } from "../lib/conjugation.ts";
import { buildArcadeSession, resolveGameScope } from "../lib/games.ts";
import { grade } from "../lib/grading.ts";
import { VERB_CONSTRUCTIONS, getVerbConstructions } from "../lib/verbConstructions.ts";
import { VERB_PREPOSITION_ITEMS, Y_EN_ITEMS } from "../lib/verbGameItems.ts";

const verbs = new Set(VERB_CONSTRUCTIONS.map((construction) => construction.infinitive));
assert.equal(verbs.size, 90, "reference verb count");
assert.equal(new Set(VERB_CONSTRUCTIONS.map((construction) => construction.id)).size, VERB_CONSTRUCTIONS.length, "unique construction ids");
const knownVerbs = new Set(VERBS.map((verb) => verb.inf));
for (const construction of VERB_CONSTRUCTIONS) {
  assert.ok(knownVerbs.has(construction.infinitive), construction.infinitive);
  assert.ok(construction.pattern && construction.exampleFr && construction.exampleEn && construction.meaningEn, construction.id);
  if (construction.replacement === "y") assert.ok(construction.preposition === "à" || construction.complement === "place", construction.id);
  if (construction.replacement === "en") assert.ok(construction.preposition === "de", construction.id);
}

const parler = getVerbConstructions("parler");
assert.deepEqual(new Set(parler.map((construction) => construction.preposition)), new Set(["à", "de"]));
assert.equal(parler.find((construction) => construction.preposition === "à")?.replacement, "lui/leur");
assert.equal(parler.find((construction) => construction.preposition === "de")?.replacement, "en");
assert.equal(getVerbConstructions("attendre")[0]?.preposition, "none");

assert.ok(VERB_PREPOSITION_ITEMS.length >= 100);
assert.ok(Y_EN_ITEMS.length >= 50);
for (const items of [VERB_PREPOSITION_ITEMS, Y_EN_ITEMS]) {
  assert.ok(items.some((item) => item.type === "mcq_single"));
  assert.ok(items.some((item) => item.type === "fill_blank"));
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
}

for (const [key, mode] of [["prepositions", "verb-prepositions"], ["y-en", "y-en"]] as const) {
  const resolved = resolveGameScope("conjugation", key);
  assert.ok(resolved);
  const session = buildArcadeSession(resolved!.items, mode);
  assert.equal(session.length, 18);
  assert.equal(session.filter((item) => item.type === "mcq_single").length, 9);
  assert.equal(session.filter((item) => item.type === "fill_blank").length, 9);
  assert.equal(new Set(session.map((item) => item.id)).size, 18);
  for (const item of session) {
    assert.equal("answer" in item, false, item.id);
    assert.equal("explanation" in item, false, item.id);
  }
}

const parlesEn = Y_EN_ITEMS.find((item) => item.id === "y-en-fill-23")!;
assert.equal(grade(parlesEn, "Parles-en!").isCorrect, true);
assert.equal(grade(parlesEn, "Parles–en !").isCorrect, true, "dash normalization");
assert.equal(grade(parlesEn, "Parle-en!").isCorrect, false, "euphonious s remains meaningful");
const jyVais = Y_EN_ITEMS.find((item) => item.id === "y-en-fill-1")!;
assert.equal(grade(jyVais, "J'y vais").isCorrect, true, "apostrophe normalization");
assert.equal(grade(jyVais, "J’en vais").isCorrect, false, "wrong pronoun rejected");
const person = Y_EN_ITEMS.find((item) => item.id === "y-en-fill-12")!;
assert.equal(grade(person, "Je lui parle.").isCorrect, true);
assert.equal(grade(person, "J’y parle.").isCorrect, false, "y does not replace a person here");
const contraction = VERB_PREPOSITION_ITEMS.find((item) => item.id === "verb-prep-contraction-6")!;
assert.equal(grade(contraction, "de l'").isCorrect, true, "apostrophe variants work in contractions");
assert.equal(grade(contraction, "du").isCorrect, false, "wrong contraction rejected");

console.log(`Verb construction tests passed (${verbs.size} verbs, ${VERB_CONSTRUCTIONS.length} constructions, two balanced game pools).`);
