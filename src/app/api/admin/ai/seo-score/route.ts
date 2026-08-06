import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { scoreSEO, isAIConfigured } from "@/lib/ai";

/**
 * POST /api/admin/ai/seo-score
 * Scores SEO quality of title + description + keywords.
 * Body: { title: string, description: string, keywords: string }
 * Returns: { score, titleLength, descLength, hasKeywords, suggestions }
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  if (!isAIConfigured()) return NextResponse.json({ error: "AI nie je nakonfigurované." }, { status: 503 });

  try {
    const { title, description, keywords } = await req.json();
    if (!title || !description) return NextResponse.json({ error: "title a description sú povinné." }, { status: 422 });

    const result = await scoreSEO({ title, description, keywords: keywords || "" });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[ai/seo-score] error:", error);
    return NextResponse.json({ error: "SEO scoring zlyhal." }, { status: 500 });
  }
}
