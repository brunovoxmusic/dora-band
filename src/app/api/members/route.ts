import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/members — verejný zoznam aktívnych členov */
export async function GET() {
  try {
    const items = await db.bandMember.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
