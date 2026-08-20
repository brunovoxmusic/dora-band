import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where = category && category !== "all" ? { category } : undefined;

    const items = await db.mediaItem.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: 100,
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[public/media GET] error:", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
