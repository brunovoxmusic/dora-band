import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json().catch(() => ({}));
    const { title, date, venue, city, country, ticketUrl, ticketPrice, status, notes } = b;
    const item = await db.gig.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(venue !== undefined && { venue }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(ticketUrl !== undefined && { ticketUrl: ticketUrl || null }),
        ...(ticketPrice !== undefined && { ticketPrice: ticketPrice || null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[admin/gigs PATCH]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    await db.gig.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Záznam nebol nájdený." }, { status: 404 });
  }
}
