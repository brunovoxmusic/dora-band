import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const items = await db.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { id: true, email: true, active: true, source: true, createdAt: true },
  });
  return NextResponse.json({ items });
}
