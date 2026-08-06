import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Returns media items marked as heroBackground=true, ordered by `order` then createdAt.
 * Public endpoint (no auth).
 */
export async function GET() {
  const items = await db.mediaItem.findMany({
    where: { heroBackground: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      url: true,
      altText: true,
      title: true,
    },
    take: 20,
  });
  return NextResponse.json({ items });
}
