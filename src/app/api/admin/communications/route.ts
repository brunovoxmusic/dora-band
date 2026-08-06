import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  const where = contactId ? { contactId } : undefined;
  const items = await db.communication.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const item = await db.communication.create({ data: { contactId: b.contactId, type: b.type || "note", direction: b.direction || "outbound", subject: b.subject || null, body: b.body, aiGenerated: !!b.aiGenerated, aiTone: b.aiTone || null } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[comms POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
