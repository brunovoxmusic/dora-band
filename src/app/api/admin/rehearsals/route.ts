import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status && status !== "all" ? { status } : undefined;
  const items = await db.rehearsal.findMany({ where, orderBy: { date: "desc" }, take: 100 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.date) return NextResponse.json({ error: "Dátum je povinný." }, { status: 422 });
    const item = await db.rehearsal.create({
      data: {
        date: new Date(b.date),
        attendees: JSON.stringify(b.attendees || []),
        songIds: JSON.stringify(b.songIds || []),
        newMaterial: b.newMaterial || null,
        notes: b.notes || null,
        nextActions: b.nextActions || null,
        recordings: JSON.stringify(b.recordings || []),
        durationMin: typeof b.durationMin === "number" ? b.durationMin : null,
        status: b.status || "planned",
      },
    });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[rehearsals POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
