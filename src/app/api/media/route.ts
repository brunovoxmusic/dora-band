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
      select: {
        id: true,
        title: true,
        url: true,
        thumbnailUrl: true,
        category: true,
        caption: true,
        altText: true,
        credits: true,
        featured: true,
        heroBackground: true,
        order: true,
        // Nové polia — použijeme select aby sme predišli chybe ak stĺpec neexistuje v DB
        fileType: true,
        linkedSections: true,
        fileSize: true,
        fileName: true,
      },
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[public/media GET] error:", err);
    // Fallback: skús bez nových stĺpcov (ak DB nemá fileType stĺpec)
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get("category");
      const where = category && category !== "all" ? { category } : undefined;
      const items = await db.mediaItem.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        take: 100,
        select: {
          id: true,
          title: true,
          url: true,
          thumbnailUrl: true,
          category: true,
          caption: true,
          altText: true,
          credits: true,
          featured: true,
          heroBackground: true,
          order: true,
        },
      });
      return NextResponse.json({ items });
    } catch (err2) {
      console.error("[public/media GET] fallback error:", err2);
      return NextResponse.json({ items: [] }, { status: 200 });
    }
  }
}
