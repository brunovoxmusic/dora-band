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

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const gigId = searchParams.get("gigId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (gigId) where.gigId = gigId;

    const orders = await db.merchOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true, category: true, imageUrl: true, sizes: true, colors: true } } },
      take: 200,
    });

    // Safe-parse JSON String fields on related product (sizes/colors sú JSON-encoded array)
    const items = orders.map(o => ({
      ...o,
      product: o.product
        ? {
            ...o.product,
            sizes: safeJsonParse<string[]>(o.product.sizes, []),
            colors: safeJsonParse<string[]>(o.product.colors, []),
          }
        : o.product,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[merch/orders GET]", err);
    return NextResponse.json(
      { error: "Načítanie objednávok zlyhalo.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
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

    // C.2: Stock sufficiency check — over dostupnosť skladu pred objednávkou
    const orderStatus = (b.status as string) || "confirmed";
    if (orderStatus === "confirmed" && !b.skipStockUpdate && product.stock < quantity) {
      return NextResponse.json(
        { error: `Nedostatok skladom. Dostupné: ${product.stock} ks, požadované: ${quantity} ks.` },
        { status: 422 }
      );
    }

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
        // C.2: Atomic stock check + decrement (anti race condition)
        const updated = await tx.merchProduct.update({
          where: { id: b.productId },
          data: { stock: { decrement: quantity } },
        });
        // Ak stock po decremente je záporný, rollback (nemalo by sa stať kvôli pre-checku)
        if (updated.stock < 0) {
          throw new Error("Stock insufficiency detected post-decrement — rolling back");
        }
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

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
