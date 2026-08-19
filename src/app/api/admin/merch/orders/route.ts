import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M7.4 — Merch Orders API
 *
 * GET  /api/admin/merch/orders         — zoznam objednávok
 * POST /api/admin/merch/orders         — vytvor objednávku
 *                                       (automaticky decrement stock)
 */

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const gigId = searchParams.get("gigId");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (gigId) where.gigId = gigId;

  const items = await db.merchOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true, category: true, imageUrl: true } } },
    take: 200,
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const b = await req.json();
    if (!b.productId) return NextResponse.json({ error: "productId je povinný." }, { status: 422 });
    if (!b.quantity || b.quantity < 1) return NextResponse.json({ error: "quantity musí byť >= 1." }, { status: 422 });

    const product = await db.merchProduct.findUnique({ where: { id: b.productId } });
    if (!product) return NextResponse.json({ error: "Produkt neexistuje." }, { status: 404 });

    const unitPrice = b.unitPrice !== undefined ? parseFloat(b.unitPrice) : product.price;
    const quantity = parseInt(b.quantity, 10);

    // Use transaction: create order + decrement stock
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.merchOrder.create({
        data: {
          type: b.type || "event",
          gigId: b.gigId || null,
          productId: b.productId,
          quantity,
          unitPrice,
          size: b.size || null,
          color: b.color || null,
          buyerName: b.buyerName || null,
          buyerEmail: b.buyerEmail || null,
          status: b.status || "confirmed",
          paymentMethod: b.paymentMethod || "cash",
          notes: b.notes || null,
        },
      });

      // Decrement stock (only for confirmed orders)
      if (newOrder.status === "confirmed" && !b.skipStockUpdate) {
        const updated = await tx.merchProduct.update({
          where: { id: b.productId },
          data: { stock: { decrement: quantity } },
        });
        // Auto-mark as bestseller if sold > 20 units total
        const totalSold = await tx.merchOrder.aggregate({
          where: { productId: b.productId, status: "confirmed" },
          _sum: { quantity: true },
        });
        if ((totalSold._sum.quantity || 0) >= 20 && !updated.bestSeller) {
          await tx.merchProduct.update({ where: { id: b.productId }, data: { bestSeller: true } });
        }
      }
      return newOrder;
    });

    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (err) {
    console.error("[merch/orders POST]", err);
    return NextResponse.json({ error: "Vytvorenie objednávky zlyhalo." }, { status: 500 });
  }
}
