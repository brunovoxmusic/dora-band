import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/admin/members — zoznam všetkých členov */
export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const items = await db.bandMember.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[members GET] error:", err);
    // Ak BandMember tabuľka neexistuje, vráť prázdne zoznam
    return NextResponse.json({ items: [], error: "Tabuľka členov neexistuje v databáze. Spustite seed." });
  }
}

/** POST /api/admin/members — vytvor nového člena */
export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "Meno je povinné." }, { status: 422 });
    const item = await db.bandMember.create({
      data: {
        name: b.name,
        role: b.role || "Hudobník",
        roleEn: b.roleEn || null,
        bio: b.bio || null,
        initials: b.initials || b.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        since: b.since || "—",
        photo: b.photo || null,
        order: b.order ?? 0,
        active: b.active !== false,
      },
    });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[members POST]", err);
    return NextResponse.json(
      { error: "Vytvorenie zlyhalo. Skúste spustiť seed v admin nastaveniach." },
      { status: 500 }
    );
  }
}
