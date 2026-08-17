import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.organization.findMany({ orderBy: { name: "asc" }, take: 200, include: { _count: { select: { contacts: true } } } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "Názov je povinný." }, { status: 422 });
    const item = await db.organization.create({ data: {
      name: b.name, type: b.type || "promoter", email: b.email || null, phone: b.phone || null,
      website: b.website || null, city: b.city || null, country: b.country || "SK",
      vatId: b.vatId || null, notes: b.notes || null,
    }});
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[organizations POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
