import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateVariants, isAIConfigured, type PromptType } from "@/lib/ai";

/**
 * POST /api/admin/ai/variants
 * Generates 3 A/B variants for comparison.
 * Body: { type: PromptType, context?: string, instruction?: string }
 * Returns: { variants: string[] }
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  if (!isAIConfigured()) return NextResponse.json({ error: "AI nie je nakonfigurované." }, { status: 503 });

  try {
    const { type, context, instruction } = await req.json();
    if (!type) return NextResponse.json({ error: "Chýba type." }, { status: 422 });

    const variants = await generateVariants({ type: type as PromptType, context, instruction });
    return NextResponse.json({ variants });
  } catch (error) {
    console.error("[ai/variants] error:", error);
    return NextResponse.json(
      {
        error: "Generovanie variantov zlyhalo.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
