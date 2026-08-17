import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET — get finance for a gig (by gigId query param) */
export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const gigId = searchParams.get("gigId");
  if (!gigId) return NextResponse.json({ error: "gigId parameter is required." }, { status: 422 });
  const item = await db.gigFinance.findUnique({ where: { gigId } });
  return NextResponse.json({ item });
}

/** PUT — upsert finance for a gig */
export async function PUT(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.gigId) return NextResponse.json({ error: "gigId is required." }, { status: 422 });
    const data = {
      fee: typeof b.fee === "number" ? b.fee : 0,
      travelCost: typeof b.travelCost === "number" ? b.travelCost : 0,
      accommodation: typeof b.accommodation === "number" ? b.accommodation : 0,
      equipmentCost: typeof b.equipmentCost === "number" ? b.equipmentCost : 0,
      promotionCost: typeof b.promotionCost === "number" ? b.promotionCost : 0,
      otherCost: typeof b.otherCost === "number" ? b.otherCost : 0,
      notes: b.notes || null,
    };
    const item = await db.gigFinance.upsert({
      where: { gigId: b.gigId },
      create: { gigId: b.gigId, ...data },
      update: data,
    });
    const totalCosts = data.travelCost + data.accommodation + data.equipmentCost + data.promotionCost + data.otherCost;
    const netValue = data.fee - totalCosts;
    return NextResponse.json({ ok: true, item, netValue, totalCosts });
  } catch (err) { console.error("[gig-finance PUT]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
