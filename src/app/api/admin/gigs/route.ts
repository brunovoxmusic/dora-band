import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function guard(req: NextRequest) {
  const s = await getSession(req);
  return !!s;
}

// GET all gigs (admin: includes past)
export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.gig.findMany({ orderBy: { date: "desc" }, take: 200 });
  return NextResponse.json({ items });
}

// POST create gig
export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const { title, date, venue, city, country, ticketUrl, ticketPrice, status, notes } = b;
    if (!title || !date || !venue || !city) {
      return NextResponse.json({ error: "title, date, venue, city sú povinné." }, { status: 422 });
    }
    const item = await db.gig.create({
      data: {
        title,
        date: new Date(date),
        venue,
        city,
        country: country || "SK",
        ticketUrl: ticketUrl || null,
        ticketPrice: ticketPrice || null,
        status: status || "upcoming",
        notes: notes || null,
      },
    });

    // Trigger AI orchestrator (async, non-blocking)
    import("@/lib/agents/orchestrator")
      .then(({ orchestrator }) => orchestrator("gig_created", item))
      .catch((e) => console.error("[orchestrator] gig_created trigger failed:", e));

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[admin/gigs POST]", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
