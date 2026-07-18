import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function guard(req: NextRequest) {
  return !!(await getSession(req));
}

export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.mediaItem.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const { title, url, thumbnailUrl, category, caption, credits, featured } = b;
    if (!title || !url) {
      return NextResponse.json({ error: "title a url sú povinné." }, { status: 422 });
    }
    const item = await db.mediaItem.create({
      data: {
        title,
        url,
        thumbnailUrl: thumbnailUrl || null,
        category: category || "concert",
        caption: caption || null,
        credits: credits || "Foto: archív D.O.R.A.",
        featured: !!featured,
      },
    });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[admin/media POST]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
