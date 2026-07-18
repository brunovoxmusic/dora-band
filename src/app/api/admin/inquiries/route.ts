import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function guard(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return null;
  return session;
}

// GET /api/admin/inquiries?status=new
export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status && status !== "all" ? { status } : undefined;
  const items = await db.bookingInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ items });
}

// PATCH /api/admin/inquiries/[id] handled in [id]/route.ts
// Here we also support PATCH by body {id, status} for convenience
export async function PATCH(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const { id, status } = await req.json().catch(() => ({}));
    if (!id || !status) {
      return NextResponse.json({ error: "id a status sú povinné." }, { status: 422 });
    }
    const valid = ["new", "reviewed", "confirmed", "archived"];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: "Neplatný status." }, { status: 422 });
    }
    const updated = await db.bookingInquiry.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    console.error("[admin/inquiries PATCH]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
