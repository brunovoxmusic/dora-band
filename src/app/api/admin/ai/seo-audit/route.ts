import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllContent } from "@/lib/content";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

/**
 * AI SEO audit.
 *
 * Gathers the current site content + SEO meta + media alt-text coverage,
 * sends it to the LLM, and receives a structured audit with scores and
 * actionable recommendations.
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const content = await getAllContent();
    const seoRows = await db.seoMeta.findMany();
    const media = await db.mediaItem.findMany({ select: { id: true, title: true, altText: true, category: true } });

    const mediaWithoutAlt = media.filter((m) => !m.altText).map((m) => ({ title: m.title, category: m.category }));
    const mediaWithAlt = media.length - mediaWithoutAlt.length;
    const altCoverage = media.length > 0 ? Math.round((mediaWithAlt / media.length) * 100) : 0;

    // Build a compact report for the LLM
    const report = {
      metaTitle: content.find((c) => c.key === "seo.metaTitle")?.value,
      metaDescription: content.find((c) => c.key === "seo.metaDescription")?.value,
      keywords: content.find((c) => c.key === "seo.keywords")?.value,
      heroTitle: content.find((c) => c.key === "hero.title")?.value,
      heroTagline: content.find((c) => c.key === "hero.tagline")?.value,
      bandBio: content.find((c) => c.key === "band.bio")?.value,
      seoMetaRows: seoRows.length,
      customSeoPaths: seoRows.map((r) => r.path),
      mediaTotal: media.length,
      mediaWithAlt,
      mediaWithoutAltCount: mediaWithoutAlt.length,
      altCoveragePercent: altCoverage,
    };

    const prompt = `Si senior SEO inžinier. Vykonaj audit SEO tejto webstránky kapely D.O.R.A. a vráť výsledok VO FORMÁTE JSON s týmito kľúčmi:
{
  "score": <číslo 0-100, celkové SEO skóre>,
  "summary": "<1-2 vety zhrnujúce stav>",
  "strengths": ["<silná stránka 1>", "..."],
  "issues": [{"severity": "high|medium|low", "area": "<oblasť>", "problem": "<popis>", "fix": "<konkrétne riešenie>"}],
  "recommendations": ["<prioritná odporúčanie 1>", "..."]
}

Analyzuj najmä: meta title dĺžku (ideálne 50-60 znakov), meta description (120-160 znakov), kľúčové slová, alt-text coverage, chýbajúce SEO meta pre podstránky, obsahovú kvalitu.

ÚDAJE O STRÁNKE:
${JSON.stringify(report, null, 2)}`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: "Si senior SEO inžinier. Vraciaš iba platný JSON bez markdown ohraničenia." },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let audit;
    try {
      audit = JSON.parse(cleaned);
    } catch {
      audit = { score: 0, summary: "Nepodarilo sa parsovať AI odpoveď.", raw: cleaned };
    }

    return NextResponse.json({ ok: true, audit, stats: report });
  } catch (err) {
    console.error("[ai/seo-audit] error:", err);
    return NextResponse.json({ error: "SEO audit zlyhal." }, { status: 500 });
  }
}
