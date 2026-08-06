import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function parseIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === "string").map(String);
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.map(String) : []; } catch { return []; }
  }
  return [];
}

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.fanSegment.findMany({ orderBy: { createdAt: "desc" } });
  const decoded = items.map((s) => ({ ...s, subscriberIds: parseIds(s.subscriberIds) }));
  return NextResponse.json({ items: decoded });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const idsArr = parseIds(b.subscriberIds);
    const item = await db.fanSegment.create({ data: { name: b.name, description: b.description || null, criteria: b.criteria || "{}", subscriberIds: JSON.stringify(idsArr), aiGenerated: !!b.aiGenerated } });
    return NextResponse.json({ ok: true, item: { ...item, subscriberIds: idsArr } }, { status: 201 });
  } catch (err) { console.error("[segments POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
