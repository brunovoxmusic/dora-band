import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json().catch(() => ({}));
    const { title, url, thumbnailUrl, category, caption, altText, credits, featured, heroBackground, fileType, linkedSections, fileSize, fileName } = b;
    const item = await db.mediaItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || null }),
        ...(category !== undefined && { category }),
        ...(caption !== undefined && { caption: caption || null }),
        ...(altText !== undefined && { altText: altText || null }),
        ...(credits !== undefined && { credits }),
        ...(featured !== undefined && { featured: !!featured }),
        ...(heroBackground !== undefined && { heroBackground: !!heroBackground }),
        ...(fileType !== undefined && { fileType }),
        ...(linkedSections !== undefined && { linkedSections: JSON.stringify(linkedSections || []) }),
        ...(fileSize !== undefined && { fileSize }),
        ...(fileName !== undefined && { fileName }),
      },
    });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[admin/media PATCH]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    await db.mediaItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Záznam nebol nájdený." }, { status: 404 });
  }
}
