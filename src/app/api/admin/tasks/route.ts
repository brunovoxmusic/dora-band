import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status && status !== "all" ? { status } : undefined;
  const items = await db.task.findMany({ where, orderBy: [{ dueDate: "asc" }, { priority: "desc" }], take: 200 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  try {
    const b = await req.json();
    const item = await db.task.create({ data: { title: b.title, description: b.description || null, dueDate: b.dueDate ? new Date(b.dueDate) : null, priority: b.priority || "medium", status: "todo", gigId: b.gigId || null, aiGenerated: !!b.aiGenerated } });
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) { console.error("[tasks POST]", err); return NextResponse.json({ error: "Serverová chyba." }, { status: 500 }); }
}
