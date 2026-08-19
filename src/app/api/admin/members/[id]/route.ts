import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof b.name === "string") data.name = b.name;
    if (typeof b.role === "string") data.role = b.role;
    if (typeof b.roleEn === "string") data.roleEn = b.roleEn || null;
    if (typeof b.bio === "string") data.bio = b.bio || null;
    if (typeof b.initials === "string") data.initials = b.initials;
    if (typeof b.since === "string") data.since = b.since;
    if (typeof b.photo === "string") data.photo = b.photo || null;
    if (typeof b.order === "number") data.order = b.order;
    if (typeof b.active === "boolean") data.active = b.active;
    const item = await db.bandMember.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ error: "Nenájdené." }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    await db.bandMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Nenájdené." }, { status: 404 });
  }
}
