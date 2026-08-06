import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllContent } from "@/lib/content";
import ZAI from "z-ai-web-dev-sdk";
import { ensureZaiConfig } from "@/lib/zai-config";

type GenType = "bio" | "faq" | "copytext" | "metaDescription" | "metaTitle" | "socialPost" | "pressRelease";

const SYSTEM_PROMPT = `Si profesionálny copywriter a SEO špecialista pre slovenskú funky-punkovú kapelu D.O.R.A. (Dnes Od Rána Abstinujem) z Púchova, založenú v roku 1996. Píšeš v slovenčine, v energickom, autentickom a punkovo-rebelskom tóne. Výsledok vraciaš ako čistý text bez markdown formátovania (okrem prípadov, keď je explicitne požadované).`;

function buildPrompt(type: GenType, instruction: string, context: string): string {
  const ctx = `\n\nKONTEXT O KAPELE:\n${context}\n`;
  switch (type) {
    case "bio":
      return `Napíš krátky bio kapely D.O.R.A. (80–120 slov) vhodný pre festivalový katalóg alebo PR materiál. ${instruction ? "Dodatočné inštrukcie: " + instruction : ""}${ctx}`;
    case "faq":
      return `Vygeneruj 3 časté otázky a odpovede (FAQ) o kapele D.O.R.A. vo formáte:\nQ: otázka\nA: odpoveď\n\nTémy: booking, technické požiadavky, hudobný štýl. ${instruction ? "Dodatočné inštrukcie: " + instruction : ""}${ctx}`;
    case "copytext":
      return `Napíš propagačný copy-text (festivalová pozvánka, 120–180 slov) pre kapelu D.O.R.A. ${instruction ? "Dodatočné inštrukcie: " + instruction : ""}${ctx}`;
    case "metaDescription":
      return `Navrhni SEO meta description (max 160 znakov) pre stránku kapely D.O.R.A. Musí byť výstižná, obsahovať kľúčové slová a vzbudiť záujem. ${instruction ? "Dodatočné inštrukcie: " + instruction : ""}${ctx}`;
    case "metaTitle":
      return `Navrhni SEO meta title (max 60 znakov) pre stránku kapely D.O.R.A. ${instruction ? "Dodatočné inštrukcie: " + instruction : ""}${ctx}`;
    case "socialPost":
      return `Napíš príspevok na sociálne siete (Facebook/Instagram, max 280 znakov) s hashtagmi o kapele D.O.R.A. ${instruction ? "Dodatočné inštrukcie: " + instruction : ""}${ctx}`;
    case "pressRelease":
      return `Napíš krátku tlačovú správu (200–300 slov) o kapele D.O.R.A. — oznámenie vystúpenia na festivale. ${instruction ? "Dodatočné inštrukcie: " + instruction : ""}${ctx}`;
    default:
      return instruction + ctx;
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { type, instruction } = await req.json().catch(() => ({}));
    if (!type) return NextResponse.json({ error: "type je povinné." }, { status: 422 });

    // Build context from current content
    const items = await getAllContent();
    const contextLines = items
      .filter((i) => ["band", "hero", "contact"].includes(i.category))
      .map((i) => `- ${i.label}: ${i.value}`)
      .join("\n");
    const context = contextLines || "Kapela D.O.R.A. — funky-punk z Púchova, založená 1996.";

    const prompt = buildPrompt(type as GenType, instruction || "", context);

    await ensureZaiConfig();
    let zai;
    try {
      zai = await ZAI.create();
    } catch (createErr) {
      console.error("[ai/generate] ZAI.create() failed:", createErr);
      return NextResponse.json(
        {
          error:
            "AI služba nie je nakonfigurovaná. Chýba .z-ai-config súbor. Na Verceli pridajte súbor do project root alebo nastavte env premenné pre z-ai-web-dev-sdk.",
          details: createErr instanceof Error ? createErr.message : String(createErr),
        },
        { status: 503 }
      );
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return NextResponse.json({ error: "Prázdna odpoveď z AI." }, { status: 502 });

    return NextResponse.json({ ok: true, text, type, prompt });
  } catch (err) {
    console.error("[ai/generate] error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `AI generovanie zlyhalo: ${errorMsg}` },
      { status: 500 }
    );
  }
}
