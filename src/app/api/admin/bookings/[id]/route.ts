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
    if (typeof b.contactId === "string") data.contactId = b.contactId || null;
    if (typeof b.gigId === "string") data.gigId = b.gigId || null;
    if (typeof b.status === "string") data.status = b.status;
    if (typeof b.aiMatchScore === "number") data.aiMatchScore = b.aiMatchScore;
    if (typeof b.aiAnalysis === "string") data.aiAnalysis = b.aiAnalysis || null;
    if (typeof b.proposedFee === "string") data.proposedFee = b.proposedFee || null;
    if (typeof b.actualFee === "string") data.actualFee = b.actualFee || null;

    const item = await db.booking.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.booking.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
