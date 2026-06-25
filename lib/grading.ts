// Server-side grading. Mirrors the answer model from docs/02-question-bank-architecture.md.
import type { Item } from "./content";

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalize(value: string, normalizer?: string): string {
  let v = value ?? "";
  switch (normalizer) {
    case "fr_accent_insensitive_trim_lower":
      v = stripAccents(v).trim().toLocaleLowerCase("fr-CA");
      break;
    case "trim_lower":
      v = v.trim().toLocaleLowerCase("fr-CA");
      break;
    default:
      v = v.trim().toLocaleLowerCase("fr-CA");
  }
  // collapse internal whitespace and drop trailing sentence punctuation
  return v.replace(/\s+/g, " ").replace(/[.!?]+$/g, "").trim();
}

export type GradeResult = {
  isCorrect: boolean;
  partialScore: number;
  correctAnswer: string;
  explanation: any;
  tip: any;
};

export function grade(item: Item, rawResponse: unknown): GradeResult {
  const norm = item.answer.normalizer;
  // Coerce response to a comparable string (sequence types arrive as arrays).
  let responseStr: string;
  if (Array.isArray(rawResponse)) responseStr = (rawResponse as string[]).join(" ");
  else responseStr = String(rawResponse ?? "");

  const got = normalize(responseStr, norm);
  const accepted = item.answer.accepted.map((a) => normalize(a, norm));

  let isCorrect = accepted.includes(got);

  // Optional regex fallback (matched against the trimmed raw response, case-insensitive).
  if (!isCorrect && item.answer.regex) {
    try {
      isCorrect = new RegExp(item.answer.regex, "i").test(responseStr.trim());
    } catch {
      /* malformed regex in content — ignore, rely on accepted set */
    }
  }

  return {
    isCorrect,
    partialScore: isCorrect ? 1 : 0,
    correctAnswer: item.answer.accepted[0],
    explanation: item.explanation,
    tip: item.tip,
  };
}
