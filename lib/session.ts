import { type Item, type SanitizedItem, sanitize } from "./content";

const ORDER: Record<string, number> = { easy: 0, medium: 1, advanced: 2 };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

/**
 * Pick up to `limit` items and sanitize for the client. mode "ramp" sorts easy→advanced.
 * Balances the draw so concept/grammar questions (which teach the objective's main concept)
 * make up ~60% of the session when available, instead of being drowned out by the larger
 * vocabulary pool. Falls back gracefully when one pool is small or empty.
 */
export function buildSession(items: Item[], limit = 16, mode: "ramp" | "shuffle" = "ramp"): SanitizedItem[] {
  const concept = shuffle(items.filter((it) => it.skill !== "vocabulary"));
  const vocab = shuffle(items.filter((it) => it.skill === "vocabulary"));

  const conceptTarget = Math.min(concept.length, Math.ceil(limit * 0.6));
  const vocabTarget = Math.min(vocab.length, limit - conceptTarget);
  let pool = [...concept.slice(0, conceptTarget), ...vocab.slice(0, vocabTarget)];
  // top up from whichever pool still has items if we're short of `limit`
  if (pool.length < limit) {
    const rest = shuffle([...concept.slice(conceptTarget), ...vocab.slice(vocabTarget)]);
    pool = pool.concat(rest.slice(0, limit - pool.length));
  }

  pool = mode === "ramp"
    ? pool.sort((a, b) => (ORDER[a.difficulty] ?? 1) - (ORDER[b.difficulty] ?? 1))
    : shuffle(pool);
  return pool.map(sanitize);
}
