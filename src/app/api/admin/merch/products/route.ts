import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M7.4 — Merch Products API
 *
 * GET  /api/admin/merch/products          — zoznam produktov
 * POST /api/admin/merch/products          — vytvor produkt
 */

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("active") === "true";

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (activeOnly) where.active = true;

  const items = await db.merchProduct.findMany({
    where,
    orderBy: [{ bestSeller: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { orders: true } } },
    take: 200,
  });

  return NextResponse.json({
    items: items.map(p => ({
      ...p,
      sizes: typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes,
      colors: typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors,
      orderCount: p._count.orders,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "Názov je povinný." }, { status: 422 });
    if (b.price === undefined || b.price < 0) return NextResponse.json({ error: "Cena musí byť >= 0." }, { status: 422 });

    const slug = b.slug ? slugify(b.slug) : slugify(b.name);
    // Unique slug check
    const existing = await db.merchProduct.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36).slice(-4)}` : slug;

    const product = await db.merchProduct.create({
      data: {
        name: b.name,
        slug: finalSlug,
        description: b.description || null,
        category: b.category || "other",
        price: parseFloat(b.price),
        costPrice: parseFloat(b.costPrice || 0),
        stock: parseInt(b.stock || 0, 10),
        minStock: parseInt(b.minStock || 5, 10),
        sizes: JSON.stringify(b.sizes || []),
        colors: JSON.stringify(b.colors || []),
        imageUrl: b.imageUrl || null,
        active: b.active !== false,
      },
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (err) {
    console.error("[merch/products POST]", err);
    return NextResponse.json({ error: "Vytvorenie produktu zlyhalo." }, { status: 500 });
  }
}
