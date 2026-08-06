import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateSuggestions, isAIConfigured } from "@/lib/ai";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  if (!isAIConfigured()) return NextResponse.json({ items: [] });
  try {
    const suggestions = await generateSuggestions();
    return NextResponse.json({ items: suggestions });
  } catch (error) {
    console.error("[ai/suggestions] error:", error);
    return NextResponse.json({ items: [] });
  }
}
