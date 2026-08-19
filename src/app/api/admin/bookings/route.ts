import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where = status && status !== "all" ? { status } : undefined;
    const bookings = await db.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { contact: true } });
    // Safe-parse JSON String field contact.tags (JSON-encoded array of strings)
    const items = bookings.map(b => ({
      ...b,
      contact: b.contact
        ? { ...b.contact, tags: safeJsonParse<string[]>(b.contact.tags, []) }
        : b.contact,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[bookings GET]", err);
    return NextResponse.json(
      { error: "Načítanie bookingov zlyhalo.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const item = await db.booking.create({ data: { contactId: b.contactId || null, gigId: b.gigId || null, status: b.status || "lead", aiMatchScore: b.aiMatchScore || null, aiAnalysis: b.aiAnalysis || null, proposedFee: b.proposedFee || null, actualFee: b.actualFee || null } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[bookings POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
