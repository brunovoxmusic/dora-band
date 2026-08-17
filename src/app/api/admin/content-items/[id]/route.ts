import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.title === "string") data.title = b.title;
    if (typeof b.slug === "string") data.slug = b.slug;
    if (typeof b.type === "string") data.type = b.type;
    if (typeof b.status === "string") {
      data.status = b.status;
      if (b.status === "published") { data.publishedAt = new Date(); }
    }
    if (typeof b.language === "string") data.language = b.language;
    if (typeof b.author === "string") data.author = b.author || null;
    if (typeof b.body === "string") data.body = b.body;
    if (typeof b.excerpt === "string") data.excerpt = b.excerpt || null;
    if (typeof b.seoTitle === "string") data.seoTitle = b.seoTitle || null;
    if (typeof b.seoDescription === "string") data.seoDescription = b.seoDescription || null;
    if (typeof b.keywords === "string") data.keywords = b.keywords || null;
    if (typeof b.aiGenerated === "boolean") data.aiGenerated = b.aiGenerated;
    if (typeof b.aiQualityScore === "number") data.aiQualityScore = b.aiQualityScore;
    if (b.publishAt !== undefined) data.publishAt = b.publishAt ? new Date(b.publishAt) : null;
    if (typeof b.approvedBy === "string") {
      data.approvedBy = b.approvedBy;
      data.approvedAt = new Date();
    }
    const item = await db.contentItem.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.contentItem.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
