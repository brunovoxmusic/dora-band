import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllContent } from "@/lib/content";
import ZAI from "z-ai-web-dev-sdk";

/**
 * AI keyword research.
 *
 * Analyzes current site content + band context and suggests SEO keywords
 * grouped by intent (primary, secondary, long-tail, local).
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const content = await getAllContent();
    const contextLines = content
      .filter((i) => ["band", "hero", "seo"].includes(i.category))
      .map((i) => `- ${i.label}: ${i.value}`)
      .join("\n");

    const prompt = `Si SEO špecialista pre slovenskú funky-punkovú kapelu D.O.R.A. z Púchova. Na základe kontextu navrhni kľúčové slová pre SEO. Vráť VO FORMÁTE JSON:
{
  "primary": ["<hlavné kľúčové slovo 1>", "..."],
  "secondary": ["<sekundárne 1>", "..."],
  "longTail": ["<long-tail fráza 1>", "..."],
  "local": ["<lokálne kľúčové slovo 1>", "..."],
  "competition": [{"keyword": "<slovo>", "difficulty": "<low|medium|high>", "searchVolume": "<odhad>"}]
}

KONTEXT:
${contextLines}`;

    let zai;
    try {
      zai = await ZAI.create();
    } catch (createErr) {
      console.error("[ai] ZAI.create() failed:", createErr);
      return NextResponse.json({ error: "AI služba nie je nakonfigurovaná. Chýba .z-ai-config súbor.", details: createErr instanceof Error ? createErr.message : String(createErr) }, { status: 503 });
    }
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: "Si SEO špecialista. Vraciaš iba platný JSON bez markdown." },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      result = { error: "Nepodarilo sa parsovať odpoveď.", raw: cleaned };
    }

    return NextResponse.json({ ok: true, keywords: result });
  } catch (err) {
    console.error("[ai/keywords] error:", err);
    return NextResponse.json({ error: "AI keyword research zlyhal." }, { status: 500 });
  }
}
