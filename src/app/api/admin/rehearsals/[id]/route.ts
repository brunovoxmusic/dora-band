import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (b.date) data.date = new Date(b.date);
    if (b.attendees !== undefined) data.attendees = JSON.stringify(b.attendees || []);
    if (b.songIds !== undefined) data.songIds = JSON.stringify(b.songIds || []);
    if (typeof b.newMaterial === "string") data.newMaterial = b.newMaterial || null;
    if (typeof b.notes === "string") data.notes = b.notes || null;
    if (typeof b.nextActions === "string") data.nextActions = b.nextActions || null;
    if (b.recordings !== undefined) data.recordings = JSON.stringify(b.recordings || []);
    if (typeof b.durationMin === "number") data.durationMin = b.durationMin;
    if (typeof b.status === "string") data.status = b.status;
    const item = await db.rehearsal.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.rehearsal.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
