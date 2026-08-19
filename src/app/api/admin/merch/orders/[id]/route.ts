import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M7.4 — Merch Order detail (PATCH, DELETE)
 */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};

    if (b.status !== undefined) data.status = b.status;
    if (b.paymentMethod !== undefined) data.paymentMethod = b.paymentMethod;
    if (b.buyerName !== undefined) data.buyerName = b.buyerName;
    if (b.buyerEmail !== undefined) data.buyerEmail = b.buyerEmail;
    if (b.notes !== undefined) data.notes = b.notes;
    if (b.quantity !== undefined) data.quantity = parseInt(b.quantity, 10);
    if (b.unitPrice !== undefined) data.unitPrice = parseFloat(b.unitPrice);

    const order = await db.merchOrder.update({ where: { id }, data });
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("[merch/orders PATCH]", err);
    return NextResponse.json({ error: "Aktualizácia zlyhala." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const { id } = await params;
  try {
    // Re-stock the product when deleting a confirmed order
    const order = await db.merchOrder.findUnique({ where: { id } });
    if (order && order.status === "confirmed") {
      await db.$transaction([
        db.merchOrder.delete({ where: { id } }),
        db.merchProduct.update({
          where: { id: order.productId },
          data: { stock: { increment: order.quantity } },
        }),
      ]);
    } else {
      await db.merchOrder.delete({ where: { id } });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[merch/orders DELETE]", err);
    return NextResponse.json({ error: "Zmazanie zlyhalo." }, { status: 500 });
  }
}
