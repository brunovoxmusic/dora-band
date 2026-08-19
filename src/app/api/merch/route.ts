import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public Merch API — zoznam aktívnych produktov pre verejnú stránku.
 * Nepotrebuje auth (iba aktívne produkty, bez citlivých dát ako costPrice).
 *
 * GET /api/merch — zoznam aktívnych produktov s počtom predajov
 */
export async function GET() {
  try {
    const items = await db.merchProduct.findMany({
      where: { active: true },
      orderBy: [{ bestSeller: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { orders: true } } },
      take: 12,
    });

    return NextResponse.json({
      items: items.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        sizes: typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes,
        colors: typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors,
        imageUrl: p.imageUrl,
        bestSeller: p.bestSeller,
        orderCount: p._count.orders,
      })),
    });
  } catch (err) {
    console.error("[public merch GET]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
