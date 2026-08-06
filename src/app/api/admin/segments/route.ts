import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.fanSegment.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const item = await db.fanSegment.create({ data: { name: b.name, description: b.description || null, criteria: b.criteria || "{}", subscriberIds: b.subscriberIds || [], aiGenerated: !!b.aiGenerated } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[segments POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
