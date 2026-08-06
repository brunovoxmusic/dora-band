import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const item = await db.campaign.create({ data: { name: b.name, type: b.type || "newsletter", subject: b.subject || null, body: b.body || "", status: "draft", segmentId: b.segmentId || null, aiGenerated: !!b.aiGenerated } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[campaigns POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
