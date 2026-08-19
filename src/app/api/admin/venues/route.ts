import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.venue.findMany({ orderBy: { name: "asc" }, take: 200, include: { _count: { select: { gigs: true } } } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "Názov je povinný." }, { status: 422 });
    const item = await db.venue.create({ data: {
      name: b.name, type: b.type || "club", city: b.city || null, country: b.country || "SK",
      address: b.address || null, capacity: b.capacity || null, website: b.website || null,
      techInfo: b.techInfo || null, contactPerson: b.contactPerson || null,
      contactEmail: b.contactEmail || null, contactPhone: b.contactPhone || null,
      rating: typeof b.rating === "number" ? b.rating : null, notes: b.notes || null,
    }});
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[venues POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
