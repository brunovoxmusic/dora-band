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
    // Convert tags array → JSON string (field is String in schema, not String[])
    const { tags, ...rest } = b;
    const data: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (tags !== undefined) {
      data.tags = JSON.stringify(parseTags(tags));
    }
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
