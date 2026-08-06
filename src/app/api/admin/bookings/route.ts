import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status && status !== "all" ? { status } : undefined;
  const items = await db.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { contact: true } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const item = await db.booking.create({ data: { contactId: b.contactId || null, gigId: b.gigId || null, status: b.status || "lead", aiMatchScore: b.aiMatchScore || null, aiAnalysis: b.aiAnalysis || null, proposedFee: b.proposedFee || null, actualFee: b.actualFee || null } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[bookings POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
