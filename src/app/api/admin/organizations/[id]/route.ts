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
    if (typeof b.type === "string") data.type = b.type;
    if (typeof b.email === "string") data.email = b.email || null;
    if (typeof b.phone === "string") data.phone = b.phone || null;
    if (typeof b.website === "string") data.website = b.website || null;
    if (typeof b.city === "string") data.city = b.city || null;
    if (typeof b.country === "string") data.country = b.country;
    if (typeof b.vatId === "string") data.vatId = b.vatId || null;
    if (typeof b.notes === "string") data.notes = b.notes || null;
    const item = await db.organization.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.organization.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
