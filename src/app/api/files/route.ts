import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public Files API — súbory prepojené so sekciami.
 *
 * GET /api/files?section=press — súbory prepojené s "press" sekciou
 * GET /api/files?type=pdf — filtrovať podľa typu
 * GET /api/files?category=logo — filtrovať podľa kategórie
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get("section");
    const fileType = url.searchParams.get("type");
    const category = url.searchParams.get("category");

    const items = await db.mediaItem.findMany({
      where: {
        AND: [
          // Ak section je zadaný, filtruj súbory ktoré majú túto sekciu v linkedSections
          ...(section ? [{
            OR: [
              { linkedSections: { contains: `"${section}"` } },
              { category: section }, // fallback: category matching
            ],
          }] : []),
          ...(fileType ? [{ fileType }] : []),
          ...(category ? [{ category }] : []),
        ],
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true, title: true, url: true, thumbnailUrl: true,
        category: true, fileType: true, caption: true, fileSize: true,
        fileName: true, linkedSections: true, credits: true,
      },
    });

    return NextResponse.json({
      items: items.map(i => ({
        ...i,
        linkedSections: typeof i.linkedSections === "string"
          ? JSON.parse(i.linkedSections || "[]")
          : i.linkedSections || [],
      })),
    });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
