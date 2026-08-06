import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const where = type && type !== "all" ? { type } : undefined;
  const items = await db.contact.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { communications: true, bookings: true } } } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const item = await db.contact.create({ data: { type: b.type || "fan", name: b.name, email: b.email || null, phone: b.phone || null, organization: b.organization || null, website: b.website || null, city: b.city || null, country: b.country || "SK", notes: b.notes || null, tags: b.tags || [] } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[contacts POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
