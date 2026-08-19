import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    const rows = await db.contentItem.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100 });
    // Safe-parse JSON String fields mediaIds + tags (JSON-encoded arrays)
    const items = rows.map(c => ({
      ...c,
      mediaIds: safeJsonParse<string[]>(c.mediaIds, []),
      tags: safeJsonParse<string[]>(c.tags, []),
    }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[content-items GET]", err);
    return NextResponse.json(
      { error: "Načítanie obsahu zlyhalo.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.title) return NextResponse.json({ error: "Názov je povinný." }, { status: 422 });
    // Generate slug from title if not provided
    const slug = b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const item = await db.contentItem.create({ data: {
      title: b.title, slug, type: b.type || "blog", status: b.status || "draft",
      language: b.language || "sk", author: b.author || null, body: b.body || "",
      excerpt: b.excerpt || null, seoTitle: b.seoTitle || null, seoDescription: b.seoDescription || null,
      keywords: b.keywords || null, aiGenerated: !!b.aiGenerated,
      publishAt: b.publishAt ? new Date(b.publishAt) : null,
    }});
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[content-items POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
