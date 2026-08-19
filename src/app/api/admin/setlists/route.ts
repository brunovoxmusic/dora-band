import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const gigId = searchParams.get("gigId");
  const where = gigId ? { gigId } : undefined;
  const items = await db.setlist.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "Názov je povinný." }, { status: 422 });
    const items = b.items || [];
    const item = await db.setlist.create({ data: {
      gigId: b.gigId || null, name: b.name, items: JSON.stringify(items),
      totalDuration: b.totalDuration || null, trackCount: items.length,
      status: b.status || "draft", notes: b.notes || null,
    }});
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[setlists POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
