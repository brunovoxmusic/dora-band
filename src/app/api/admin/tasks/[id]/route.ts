import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    // P0-5: Whitelist povolených polí — zabráni mass-assignment
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.title === "string") data.title = b.title;
    if (typeof b.description === "string") data.description = b.description || null;
    if (b.dueDate !== undefined) data.dueDate = b.dueDate ? new Date(b.dueDate) : null;
    if (typeof b.priority === "string") data.priority = b.priority;
    if (typeof b.status === "string") data.status = b.status;
    if (typeof b.gigId === "string") data.gigId = b.gigId || null;
    if (typeof b.aiGenerated === "boolean") data.aiGenerated = b.aiGenerated;

    const item = await db.task.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
  } catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { id } = await params;
  try { await db.task.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Nenájdené." }, { status: 404 }); }
}
