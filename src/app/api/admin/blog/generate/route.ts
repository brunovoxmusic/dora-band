import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getModel, isAIConfigured, getModelName } from "@/lib/ai";
import { ensureAIAvailable } from "@/lib/ai/provider";
import { generateText } from "ai";
import { withUsageTracking } from "@/lib/ai/usage";
import { sanitizeForPrompt } from "@/lib/ai/sanitize";

/**
 * POST /api/admin/blog/generate
 *
 * AI generovanie blog post / článku s rozšírenými možnosťami.
 *
 * Body:
 *   - type: blog | news | press | event
 *   - topic: téma článku
 *   - tone: casual | professional | punk | formal
 *   - length: short (100-200) | medium (200-400) | long (400-600)
 *   - keywords: voliteľné kľúčové slová
 *   - context: voliteľný kontext (napr. o koncerte)
 *
 * Returns: { title, slug, excerpt, body, seoTitle, seoDescription, keywords }
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    if (!isAIConfigured()) {
      return NextResponse.json({ error: "AI nie je nakonfigurované. Nastavte GROQ_API_KEY." }, { status: 503 });
    }

    const isAvailable = await ensureAIAvailable();
    if (!isAvailable) {
      return NextResponse.json({ error: "AI model nie je dostupný — žiadny funkčný Groq model." }, { status: 503 });
    }

    const body = await req.json();
    const { type, topic, tone, length, keywords, context } = body as {
      type: string;
      topic: string;
      tone: string;
      length: string;
      keywords?: string;
      context?: string;
    };

    if (!topic) return NextResponse.json({ error: "Téma je povinná." }, { status: 422 });

    const safeTopic = sanitizeForPrompt(topic, 200);
    const safeKeywords = keywords ? sanitizeForPrompt(keywords, 200) : "";
    const safeContext = context ? sanitizeForPrompt(context, 500) : "";

    const typeLabels: Record<string, string> = {
      blog: "blog článok", news: "novinku", press: "tlačovú správu", event: "popis eventu",
    };
    const typeLabel = typeLabels[type] || "článok";

    const toneMap: Record<string, string> = {
      casual: "uvoľnený, priateľský tón",
      professional: "profesionálny, informatívny tón",
      punk: "energický, punkový, rebélsky tón (ako kapela D.O.R.A.)",
      formal: "formálny, oficiálny tón",
    };
    const toneDesc = toneMap[tone] || toneMap.punk;

    const lengthMap: Record<string, string> = {
      short: "100-200 slov",
      medium: "200-400 slov",
      long: "400-600 slov",
    };
    const lengthDesc = lengthMap[length] || lengthMap.medium;

    const prompt = `Si profesionálny copywriter pre slovenskú funky-punkovú kapelu D.O.R.A. (Dnes Od Rána Abstinujem) z Púchova, založenú v 1996.

Vygeneruj ${typeLabel} v slovenčine s týmito parametrami:

TÉMA: ${safeTopic}
TÓN: ${toneDesc}
DĹŽKA: ${lengthDesc}
${safeKeywords ? `KĽÚČOVÉ SLOVÁ: ${safeKeywords}\n` : ""}${safeContext ? `KONTEXT: ${safeContext}\n` : ""}
Vráť IBA platný JSON v tomto formáte (bez markdown code blocks):
{
  "title": "atraktívny nadpis článku (max 80 znakov)",
  "excerpt": "1-2 vety perexu (max 160 znakov)",
  "body": "plný text článku (odseky oddelené \\n\\n)",
  "seoTitle": "SEO meta title (max 60 znakov)",
  "seoDescription": "SEO meta description (max 160 znakov)",
  "keywords": "kľúčové slová oddelené čiarkou"
}

Pravidlá:
- Píš v slovenčine
- Buď konkrétny a autentický
- Spomeň názov kapely D.O.R.A. aspoň raz
- Ak je tón punk, používaj energický jazyk
- Text musí byť unikátny a originálny`;

    const result = await withUsageTracking("blog-generate", getModelName("writing"), () =>
      generateText({
        model: getModel("writing"),
        system: "Si profesionálny copywriter a SEO špecialista pre slovenskú kapelu D.O.R.A. Vráť iba platný JSON.",
        prompt,
      }),
      { userId: "admin", promptPreview: safeTopic },
    );

    // Parse JSON z AI odpovede
    let article;
    try {
      const cleaned = result.text.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
      article = JSON.parse(cleaned);
    } catch {
      // Ak JSON parse zlyhá, použijeme raw text ako body
      article = {
        title: topic,
        excerpt: result.text.slice(0, 160),
        body: result.text,
        seoTitle: topic.slice(0, 60),
        seoDescription: result.text.slice(0, 160),
        keywords: safeKeywords,
      };
    }

    // Generuj slug
    const slug = article.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    return NextResponse.json({
      ok: true,
      article: {
        ...article,
        slug,
        type: type || "blog",
        aiGenerated: true,
      },
    });
  } catch (err) {
    console.error("[blog/generate] error:", err);
    return NextResponse.json(
      { error: "AI generovanie zlyhalo.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
