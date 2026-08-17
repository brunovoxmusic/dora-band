import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M7.4 — Merch Product detail (PATCH, DELETE)
 */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};

    if (b.name !== undefined) data.name = b.name;
    if (b.description !== undefined) data.description = b.description;
    if (b.category !== undefined) data.category = b.category;
    if (b.price !== undefined) data.price = parseFloat(b.price);
    if (b.costPrice !== undefined) data.costPrice = parseFloat(b.costPrice);
    if (b.stock !== undefined) data.stock = parseInt(b.stock, 10);
    if (b.minStock !== undefined) data.minStock = parseInt(b.minStock, 10);
    if (b.sizes !== undefined) data.sizes = JSON.stringify(b.sizes);
    if (b.colors !== undefined) data.colors = JSON.stringify(b.colors);
    if (b.imageUrl !== undefined) data.imageUrl = b.imageUrl;
    if (b.active !== undefined) data.active = b.active;
    if (b.bestSeller !== undefined) data.bestSeller = b.bestSeller;

    const product = await db.merchProduct.update({ where: { id }, data });
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("[merch/products PATCH]", err);
    return NextResponse.json({ error: "Aktualizácia zlyhala." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  const { id } = await params;
  try {
    await db.merchProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[merch/products DELETE]", err);
    return NextResponse.json({ error: "Zmazanie zlyhalo." }, { status: 500 });
  }
}
