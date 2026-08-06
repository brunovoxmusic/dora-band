import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import { ensureZaiConfig } from "@/lib/zai-config";
import { readFile } from "fs/promises";
import path from "path";

/**
 * AI alt-text generator.
 *
 * POST { mediaId, apply } — reads the image file from disk, converts to base64,
 * sends to the VLM, receives a descriptive alt-text, and (apply=true) persists it.
 */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { mediaId, apply } = await req.json().catch(() => ({}));
    if (!mediaId) return NextResponse.json({ error: "mediaId je povinné." }, { status: 422 });

    const item = await db.mediaItem.findUnique({ where: { id: mediaId } });
    if (!item) return NextResponse.json({ error: "Médium nenájdené." }, { status: 404 });

    // Resolve the file path on disk (supports /uploads/... and /gallery/...)
    const publicPath = item.url.startsWith("/") ? item.url : `/${item.url}`;
    const filePath = path.join(process.cwd(), "public", publicPath);

    let imageBase64: string;
    let mimeType: string;
    try {
      const buf = await readFile(filePath);
      imageBase64 = buf.toString("base64");
      mimeType = item.url.endsWith(".png") ? "image/png" : "image/jpeg";
    } catch {
      return NextResponse.json({ error: "Súbor obrázku nebol nájdený na disku." }, { status: 404 });
    }

    await ensureZaiConfig();
    let zai;
    try {
      zai = await ZAI.create();
    } catch (createErr) {
      console.error("[ai] ZAI.create() failed:", createErr);
      return NextResponse.json({ error: "AI služba nie je nakonfigurovaná. Chýba .z-ai-config súbor.", details: createErr instanceof Error ? createErr.message : String(createErr) }, { status: 503 });
    }
    const response = await zai.chat.completions.createVision({
      model: "glm-4v-plus",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Popíš tento obrázok stručne (max 20 slov) v slovenčine ako prístupný alt-text pre webovú galériu kapely D.O.R.A. Popiš, čo je na obrázku vidno (osoby, nástroje, prostredie, akcia). Vráť iba popis bez úvodzoviek a bez dodatočných komentárov.",
            },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const altText = response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "");
    if (!altText) return NextResponse.json({ error: "AI nedokázala popísať obrázok." }, { status: 502 });

    if (apply) {
      await db.mediaItem.update({ where: { id: mediaId }, data: { altText } });
    }

    return NextResponse.json({ ok: true, altText, mediaId, applied: !!apply });
  } catch (err) {
    console.error("[ai/alttext] error:", err);
    return NextResponse.json({ error: "AI generovanie alt-textu zlyhalo." }, { status: 500 });
  }
}
