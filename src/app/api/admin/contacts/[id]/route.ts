import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === "string").map(String);
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.map(String) : []; } catch { return []; }
  }
  return [];
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    // P0-5: Whitelist povolených polí — zabráni mass-assignment
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.name === "string") data.name = b.name;
    if (typeof b.email === "string") data.email = b.email || null;
    if (typeof b.phone === "string") data.phone = b.phone || null;
    if (typeof b.organization === "string") data.organization = b.organization || null;
    if (typeof b.website === "string") data.website = b.website || null;
    if (typeof b.city === "string") data.city = b.city || null;
    if (typeof b.country === "string") data.country = b.country;
    if (typeof b.notes === "string") data.notes = b.notes || null;
    if (typeof b.aiScore === "number") data.aiScore = b.aiScore;
    if (typeof b.status === "string") data.status = b.status;
    if (typeof b.type === "string") data.type = b.type;
    if (b.tags !== undefined) data.tags = JSON.stringify(parseTags(b.tags));

    const item = await db.contact.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: { ...item, tags: parseTags(item.tags) } });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.contact.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
