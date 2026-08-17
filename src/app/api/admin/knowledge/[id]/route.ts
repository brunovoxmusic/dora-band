import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** PATCH — update knowledge item (with mass-assignment whitelist) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.category === "string") data.category = b.category;
    if (typeof b.key === "string") data.key = b.key;
    if (typeof b.value === "string") data.value = b.value;
    if (typeof b.source === "string") data.source = b.source;
    if (typeof b.verified === "boolean") {
      data.verified = b.verified;
      data.verifiedAt = b.verified ? new Date() : null;
      data.verifiedBy = b.verified ? "admin" : null;
    }
    if (typeof b.confidence === "number") data.confidence = b.confidence;

    const item = await db.knowledgeItem.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

/** DELETE — delete knowledge item */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.knowledgeItem.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
