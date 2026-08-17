import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    // P0-5: Whitelist povolených polí — zabráni mass-assignment
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.name === "string") data.name = b.name;
    if (typeof b.type === "string") data.type = b.type;
    if (typeof b.subject === "string") data.subject = b.subject || null;
    if (typeof b.body === "string") data.body = b.body;
    if (typeof b.status === "string") data.status = b.status;
    if (typeof b.segmentId === "string") data.segmentId = b.segmentId || null;
    if (b.scheduledAt !== undefined) data.scheduledAt = b.scheduledAt ? new Date(b.scheduledAt) : null;
    if (b.sentAt !== undefined) data.sentAt = b.sentAt ? new Date(b.sentAt) : null;
    if (typeof b.aiGenerated === "boolean") data.aiGenerated = b.aiGenerated;

    const item = await db.campaign.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.campaign.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
