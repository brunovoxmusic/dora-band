import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET — list all knowledge items, optionally filtered by category */
export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const where = category && category !== "all" ? { category } : undefined;
  const items = await db.knowledgeItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { key: "asc" }],
    take: 200,
  });
  return NextResponse.json({ items });
}

/** POST — create new knowledge item */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.category || !b.key || !b.value) {
      return NextResponse.json({ error: "category, key a value sú povinné." }, { status: 422 });
    }
    const item = await db.knowledgeItem.create({
      data: {
        category: b.category,
        key: b.key,
        value: b.value,
        source: b.source || "unverified",
        verified: !!b.verified,
        verifiedAt: b.verified ? new Date() : null,
        verifiedBy: b.verified ? "admin" : null,
        confidence: typeof b.confidence === "number" ? b.confidence : 0,
      },
    });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[knowledge POST]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
