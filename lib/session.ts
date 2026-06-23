import { type Item, type SanitizedItem, sanitize } from "./content";

const ORDER: Record<string, number> = { easy: 0, medium: 1, advanced: 2 };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

/** Pick up to `limit` items and sanitize for the client. mode "ramp" sorts easy→advanced. */
export function buildSession(items: Item[], limit = 16, mode: "ramp" | "shuffle" = "ramp"): SanitizedItem[] {
  let pool = shuffle(items).slice(0, limit);
  if (mode === "ramp") pool = pool.sort((a, b) => (ORDER[a.difficulty] ?? 1) - (ORDER[b.difficulty] ?? 1));
  return pool.map(sanitize);
}
