import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.name === "string") data.name = b.name;
    if (b.gigId !== undefined) data.gigId = b.gigId || null;
    if (b.items !== undefined) { data.items = JSON.stringify(b.items || []); data.trackCount = (b.items || []).length; }
    if (typeof b.totalDuration === "string") data.totalDuration = b.totalDuration || null;
    if (typeof b.status === "string") data.status = b.status;
    if (typeof b.notes === "string") data.notes = b.notes || null;
    const item = await db.setlist.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.setlist.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
