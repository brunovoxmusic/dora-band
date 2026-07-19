import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.seoMeta.findMany({ orderBy: { path: "asc" } });
  return NextResponse.json({ items });
}

export async function PUT(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { path, title, description, keywords, ogImage, noindex } = await req.json().catch(() => ({}));
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "path je povinné." }, { status: 422 });
    }
    const item = await db.seoMeta.upsert({
      where: { path },
      create: {
        path,
        title: title || null,
        description: description || null,
        keywords: keywords || null,
        ogImage: ogImage || null,
        noindex: !!noindex,
      },
      update: {
        ...(title !== undefined && { title: title || null }),
        ...(description !== undefined && { description: description || null }),
        ...(keywords !== undefined && { keywords: keywords || null }),
        ...(ogImage !== undefined && { ogImage: ogImage || null }),
        ...(noindex !== undefined && { noindex: !!noindex }),
      },
    });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[seo PUT]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
