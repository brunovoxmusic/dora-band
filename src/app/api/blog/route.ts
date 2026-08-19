import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public Blog API — zoznam publikovaných content items.
 * Nepotrebuje auth (iba published items, bez citlivých dát).
 *
 * GET /api/blog — zoznam publikovaných článkov
 * Query params:
 * - ?type=blog|news|press — filter podľa typu (default: all)
 * - ?limit=N — max počet (default: 6)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "6", 10), 20);

    const where: Record<string, unknown> = { status: "published" };
    if (type && type !== "all") where.type = type;

    const items = await db.contentItem.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        excerpt: true,
        body: true,
        publishedAt: true,
        author: true,
        aiGenerated: true,
      },
    });

    return NextResponse.json({
      items: items.map(i => ({
        ...i,
        body: i.body ? i.body.slice(0, 500) : null, // preview only
      })),
    });
  } catch (err) {
    console.error("[public blog GET]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
