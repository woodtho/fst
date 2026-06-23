import { NextResponse } from "next/server";
import { getItem } from "@/lib/content";
import { grade } from "@/lib/grading";

export const runtime = "nodejs"; // needs fs access for the content layer

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "bad_json", message: "Invalid JSON" } }, { status: 400 });
  }

  const { itemId, response } = body ?? {};
  if (typeof itemId !== "string") {
    return NextResponse.json({ error: { code: "missing_item", message: "itemId required" } }, { status: 400 });
  }

  const item = getItem(itemId);
  if (!item) {
    return NextResponse.json({ error: { code: "not_found", message: `Unknown item ${itemId}` } }, { status: 404 });
  }

  const result = grade(item, response);
  return NextResponse.json(result);
}
