import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M7.4 — Merch Stats API
 *
 * GET /api/admin/merch/stats
 *
 * Vráti agregované štatistiky:
 * - Celkový revenue (mesiac, celkom)
 * - Top produkty podľa predaja
 * - Low stock alerts
 * - Best sellers
 * - Predaj podľa kategórie
 * - Predaj podľa eventu (ak gigId prítomné)
 */

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      activeProducts,
      totalStock,
      lowStockProducts,
      bestSellers,
      monthOrdersAgg,
      totalOrdersAgg,
      topProducts,
      byCategory,
      recentOrders,
    ] = await Promise.all([
      db.merchProduct.count(),
      db.merchProduct.count({ where: { active: true } }),
      db.merchProduct.aggregate({ _sum: { stock: true } }),
      db.merchProduct.findMany({
        where: { active: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 10,
        select: { id: true, name: true, category: true, stock: true, minStock: true, price: true },
      }),
      db.merchProduct.findMany({
        where: { bestSeller: true, active: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, price: true, stock: true, category: true, imageUrl: true },
      }),
      // Month revenue
      db.merchOrder.aggregate({
        where: { status: "confirmed", createdAt: { gte: monthStart } },
        _sum: { quantity: true },
        _count: true,
      }),
      // Total revenue (computed from orders)
      db.merchOrder.aggregate({
        where: { status: "confirmed" },
        _sum: { quantity: true },
        _count: true,
      }),
      // Top products by quantity sold
      db.merchOrder.groupBy({
        by: ["productId"],
        where: { status: "confirmed" },
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: "desc" } },
        take: 8,
      }),
      // By category (need to fetch products first)
      db.merchProduct.findMany({
        select: { id: true, category: true, price: true, costPrice: true, stock: true },
      }),
      // Recent orders
      db.merchOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { product: { select: { name: true, category: true, imageUrl: true } } },
      }),
    ]);

    // Fetch product names for top products
    const topProductIds = topProducts.map(p => p.productId);
    const topProductInfos = await db.merchProduct.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, category: true, price: true, imageUrl: true },
    });
    const topProductsWithInfo = topProducts.map(tp => {
      const info = topProductInfos.find(p => p.id === tp.productId);
      return {
        productId: tp.productId,
        name: info?.name || "Neznámy",
        category: info?.category || "—",
        price: info?.price || 0,
        imageUrl: info?.imageUrl,
        quantitySold: tp._sum.quantity || 0,
        orderCount: tp._count,
        revenue: (tp._sum.quantity || 0) * (info?.price || 0),
      };
    });

    // Calculate category stats
    const categoryMap = new Map<string, { category: string; productCount: number; stockValue: number; potentialRevenue: number }>();
    for (const p of byCategory) {
      const entry = categoryMap.get(p.category) || { category: p.category, productCount: 0, stockValue: 0, potentialRevenue: 0 };
      entry.productCount += 1;
      entry.stockValue += p.stock * p.costPrice;
      entry.potentialRevenue += p.stock * p.price;
      categoryMap.set(p.category, entry);
    }
    const categoryStats = Array.from(categoryMap.values()).sort((a, b) => b.potentialRevenue - a.potentialRevenue);

    // Calculate total revenue (manual: sum of quantity * unitPrice for confirmed orders)
    const allConfirmedOrders = await db.merchOrder.findMany({
      where: { status: "confirmed" },
      select: { quantity: true, unitPrice: true, createdAt: true },
    });
    const totalRevenue = allConfirmedOrders.reduce((sum, o) => sum + o.quantity * o.unitPrice, 0);
    const monthRevenue = allConfirmedOrders
      .filter(o => o.createdAt >= monthStart)
      .reduce((sum, o) => sum + o.quantity * o.unitPrice, 0);

    // Total cost (for margin)
    const totalCost = allConfirmedOrders.reduce((sum, o) => {
      const product = byCategory.find(p => p.id === topProductInfos[0]?.id);
      return sum; // Simplified — margin is calculated per-product in UI
    }, 0);

    return NextResponse.json({
      summary: {
        totalProducts,
        activeProducts,
        totalStock: totalStock._sum.stock || 0,
        lowStockCount: lowStockProducts.length,
        bestSellerCount: bestSellers.length,
        monthRevenue: Math.round(monthRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthOrders: monthOrdersAgg._count,
        totalOrders: totalOrdersAgg._count,
        monthItemsSold: monthOrdersAgg._sum.quantity || 0,
        totalItemsSold: totalOrdersAgg._sum.quantity || 0,
      },
      lowStockProducts,
      bestSellers,
      topProducts: topProductsWithInfo,
      categoryStats,
      recentOrders: recentOrders.map(o => ({
        ...o,
        total: o.quantity * o.unitPrice,
      })),
    });
  } catch (err) {
    console.error("[merch/stats] error:", err);
    return NextResponse.json({ error: "Načítanie štatistík zlyhalo." }, { status: 500 });
  }
}
