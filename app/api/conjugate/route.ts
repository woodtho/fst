import { NextResponse } from "next/server";
import { checkConjugation, type Tense, type PersonKey } from "@/lib/conjugation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: { code: "bad_json", message: "Invalid JSON" } }, { status: 400 }); }
  const { inf, tense, person, answer } = body ?? {};
  if (typeof inf !== "string" || typeof tense !== "string" || typeof person !== "string") {
    return NextResponse.json({ error: { code: "bad_request", message: "inf, tense, person required" } }, { status: 400 });
  }
  const result = checkConjugation(inf, tense as Tense, person as PersonKey, String(answer ?? ""));
  if (!result.raw) return NextResponse.json({ error: { code: "unknown_verb", message: `Unknown verb ${inf}` } }, { status: 404 });
  return NextResponse.json(result);
}
