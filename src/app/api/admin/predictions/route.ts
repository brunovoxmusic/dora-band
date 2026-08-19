import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M7.5 — Predictive Analytics API
 *
 * GET /api/admin/predictions
 *
 * AI-driven predikcie (rule-based fallback keď AI nie je nakonfigurované):
 * - Booking probability pre aktívne kontakty (na základe score, status, communication)
 * - Fan engagement trend (subscriber growth rate)
 * - Revenue forecast (based on confirmed gigs + merch history)
 * - Low stock risk (produkty čo čoskoro dobehnú)
 * - Gig readiness score (tasks completed vs total pre nadchádzajúce gigy)
 *
 * Každá predikcia má: type, label, value, confidence (0-1), trend (up/down/stable),
 * detail, recommendation
 */

type Prediction = {
  type: "booking" | "fan" | "revenue" | "stock" | "gig";
  label: string;
  value: string;
  confidence: number; // 0-1
  trend: "up" | "down" | "stable";
  detail: string;
  recommendation: string;
  metadata?: Record<string, unknown>;
};

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const predictions: Prediction[] = [];

    // =====================================================
    // 1. BOOKING PROBABILITY — analýza aktívnych kontaktov
    // =====================================================

    const contacts = await db.contact.findMany({
      where: { status: "active" },
      select: { id: true, name: true, organization: true, aiScore: true, status: true, _count: { select: { bookings: true, communications: true } } },
      take: 50,
    });

    const highProbabilityBookings = contacts.filter(c => (c.aiScore || 0) >= 70 && c._count.bookings === 0);
    const totalActiveContacts = contacts.length;
    const avgScore = contacts.length > 0 ? contacts.reduce((sum, c) => sum + (c.aiScore || 0), 0) / contacts.length : 0;

    predictions.push({
      type: "booking",
      label: "Booking pravdepodobnosť",
      value: `${highProbabilityBookings.length} kontaktov`,
      confidence: Math.min(0.9, 0.5 + (highProbabilityBookings.length / 20)),
      trend: highProbabilityBookings.length > 3 ? "up" : "stable",
      detail: `${highProbabilityBookings.length} z ${totalActiveContacts} aktívnych kontaktov má AI score ≥ 70 (vysoký potenciál pre booking) a zatiaľ bez potvrdenej objednávky. Priemerný AI score: ${avgScore.toFixed(0)}.`,
      recommendation: `Kontaktuj ${highProbabilityBookings.slice(0, 3).map(c => c.name).join(", ")} s personalizovanou offerou do 7 dní.`,
      metadata: {
        highProbabilityContacts: highProbabilityBookings.slice(0, 5).map(c => ({ name: c.name, organization: c.organization, score: c.aiScore })),
        avgScore,
      },
    });

    // =====================================================
    // 2. FAN ENGAGEMENT TREND — subscriber growth rate
    // =====================================================

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalSubs, last30Subs, last7Subs, activeSubs] = await Promise.all([
      db.subscriber.count(),
      db.subscriber.count({ where: { createdAt: { gte: last30Days } } }),
      db.subscriber.count({ where: { createdAt: { gte: last7Days } } }),
      db.subscriber.count({ where: { active: true } }),
    ]);

    // Weekly growth rate
    const weeklyGrowthRate = totalSubs > 0 ? (last7Subs / totalSubs) * 100 : 0;
    const monthlyGrowthRate = totalSubs > 0 ? (last30Subs / totalSubs) * 100 : 0;
    const churnRate = totalSubs > 0 ? ((totalSubs - activeSubs) / totalSubs) * 100 : 0;

    predictions.push({
      type: "fan",
      label: "Fan engagement trend",
      value: `+${weeklyGrowthRate.toFixed(1)}% / týždeň`,
      confidence: totalSubs > 10 ? 0.8 : 0.4,
      trend: weeklyGrowthRate > 2 ? "up" : weeklyGrowthRate < 0.5 ? "down" : "stable",
      detail: `${totalSubs} odberateľov celkom (${activeSubs} aktívnych). ${last7Subs} nových za týždeň, ${last30Subs} za mesiac. Mesačný growth: ${monthlyGrowthRate.toFixed(1)}%. Churn: ${churnRate.toFixed(1)}%.`,
      recommendation: weeklyGrowthRate < 1
        ? "Spusti newsletter kampaň alebo social content pre rast fanúšikovskej základne."
        : "Pokračuj v aktuálnej stratégii — growth je zdravý.",
      metadata: { totalSubs, activeSubs, last7Subs, last30Subs, weeklyGrowthRate, monthlyGrowthRate, churnRate },
    });

    // =====================================================
    // 3. REVENUE FORECAST — based on confirmed gigs + merch
    // =====================================================

    const upcomingGigs = await db.gig.findMany({
      where: { status: "upcoming", date: { gte: now } },
      select: { id: true, title: true, date: true, city: true },
      take: 20,
    });

    const gigFinances = await db.gigFinance.findMany({
      where: { gigId: { in: upcomingGigs.map(g => g.id) } },
      select: { gigId: true, fee: true, travelCost: true, accommodation: true, equipmentCost: true, promotionCost: true, otherCost: true },
    });

    const totalGigRevenue = gigFinances.reduce((sum, f) => sum + f.fee, 0);
    const totalGigCosts = gigFinances.reduce((sum, f) =>
      sum + f.travelCost + f.accommodation + f.equipmentCost + f.promotionCost + f.otherCost, 0);
    const netGigRevenue = totalGigRevenue - totalGigCosts;

    // Merch revenue forecast (extrapolácia z minulých predajov)
    const merchOrders = await db.merchOrder.findMany({
      where: { status: "confirmed", createdAt: { gte: last30Days } },
      select: { quantity: true, unitPrice: true },
    });
    const last30MerchRevenue = merchOrders.reduce((sum, o) => sum + o.quantity * o.unitPrice, 0);
    const avgMerchPerGig = upcomingGigs.length > 0 ? last30MerchRevenue / Math.max(upcomingGigs.length, 1) : 0;
    const merchForecast = avgMerchPerGig * upcomingGigs.length;

    const totalForecast = netGigRevenue + merchForecast;

    predictions.push({
      type: "revenue",
      label: "Revenue forecast (nadchádzajúce gigy)",
      value: `${totalForecast.toFixed(0)}€`,
      confidence: gigFinances.length > 0 ? 0.7 : 0.3,
      trend: totalForecast > 1000 ? "up" : "stable",
      detail: `${upcomingGigs.length} nadchádzajúcich gigov: ${totalGigRevenue.toFixed(0)}€ honorárov, ${totalGigCosts.toFixed(0)}€ nákladov → ${netGigRevenue.toFixed(0)}€ net. Merch forecast: ${merchForecast.toFixed(0)}€ (priemer ${avgMerchPerGig.toFixed(0)}€/gig).`,
      recommendation: totalGigCosts > totalGigRevenue * 0.5
        ? "Náklady sú vysoké (>50% honorára) — zváž optimalizáciu cestovných/ubytovania."
        : "Ziskovosť gigov je zdravá. Pokračuj v akvizícii podobných eventov.",
      metadata: {
        upcomingGigs: upcomingGigs.length,
        grossGigRevenue: totalGigRevenue,
        gigCosts: totalGigCosts,
        netGigRevenue,
        merchForecast,
        totalForecast,
        gigsWithoutFinance: upcomingGigs.length - gigFinances.length,
      },
    });

    // =====================================================
    // 4. LOW STOCK RISK — produkty čo čoskoro dobehnú
    // =====================================================

    const allProducts = await db.merchProduct.findMany({
      where: { active: true },
      select: { id: true, name: true, stock: true, minStock: true, price: true, category: true, _count: { select: { orders: true } } },
    });

    // Estimate days-until-stockout based on avg order velocity (last 30 days)
    const recentOrders = await db.merchOrder.findMany({
      where: { status: "confirmed", createdAt: { gte: last30Days } },
      select: { productId: true, quantity: true },
    });
    const velocityByProduct = new Map<string, number>();
    for (const o of recentOrders) {
      velocityByProduct.set(o.productId, (velocityByProduct.get(o.productId) || 0) + o.quantity);
    }

    const stockRisks = allProducts.map(p => {
      const velocity = velocityByProduct.get(p.id) || 0;
      const dailyVelocity = velocity / 30;
      const daysUntilOut = dailyVelocity > 0 ? Math.floor(p.stock / dailyVelocity) : Infinity;
      return { ...p, velocity, dailyVelocity, daysUntilOut };
    }).filter(p => p.daysUntilOut < 60 || p.stock <= p.minStock)
      .sort((a, b) => a.daysUntilOut - b.daysUntilOut)
      .slice(0, 5);

    predictions.push({
      type: "stock",
      label: "Low stock risk",
      value: `${stockRisks.length} produkty`,
      confidence: stockRisks.length > 0 ? 0.85 : 0.5,
      trend: stockRisks.length > 2 ? "down" : "stable",
      detail: stockRisks.length === 0
        ? "Žiadne produkty s rizikom vypredania v nasledujúcich 60 dňoch."
        : stockRisks.map(p =>
            `${p.name}: ${p.stock}ks skladom, ${p.velocity}ks/mes, ${p.daysUntilOut === Infinity ? "bez predaja" : `doba ${p.daysUntilOut} dní`}`
          ).join(" | "),
      recommendation: stockRisks.length > 0
        ? `Objednaj doplnenie pre: ${stockRisks.slice(0, 3).map(p => p.name).join(", ")}.`
        : "Sklad je v poriadku.",
      metadata: { stockRisks: stockRisks.map(p => ({ name: p.name, stock: p.stock, daysUntilOut: p.daysUntilOut })) },
    });

    // =====================================================
    // 5. GIG READINESS — task completion pre nadchádzajúce gigy
    // =====================================================

    const upcomingGigsWithTasks = await Promise.all(
      upcomingGigs.slice(0, 5).map(async g => {
        const tasks = await db.task.findMany({
          where: { gigId: g.id },
          select: { id: true, status: true },
        });
        const total = tasks.length;
        const done = tasks.filter(t => t.status === "done").length;
        const open = total - done;
        const readiness = total > 0 ? (done / total) * 100 : 100;
        const daysUntil = Math.ceil((g.date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return { ...g, total, done, open, readiness, daysUntil };
      })
    );

    const avgReadiness = upcomingGigsWithTasks.length > 0
      ? upcomingGigsWithTasks.reduce((sum, g) => sum + g.readiness, 0) / upcomingGigsWithTasks.length
      : 100;
    const criticalGigs = upcomingGigsWithTasks.filter(g => g.readiness < 50 && g.daysUntil < 14);

    predictions.push({
      type: "gig",
      label: "Gig readiness",
      value: `${avgReadiness.toFixed(0)}% priemer`,
      confidence: 0.9,
      trend: avgReadiness >= 80 ? "up" : avgReadiness < 50 ? "down" : "stable",
      detail: upcomingGigsWithTasks.length === 0
        ? "Žiadne nadchádzajúce gigy na analýzu."
        : `${upcomingGigsWithTasks.length} nadchádzajúcich gigov s ${upcomingGigsWithTasks.reduce((s, g) => s + g.open, 0)} otvorenými úlohami. ${criticalGigs.length} gigov je kritických (readiness <50%, do 14 dní).`,
      recommendation: criticalGigs.length > 0
        ? `URGENT: ${criticalGigs.map(g => `"${g.title}" (${g.daysUntil}d, ${g.readiness.toFixed(0)}%)`).join(", ")} — prioritizuj dokončenie úloh!`
        : "Všetky gigy sú pripravené. Pokračuj v aktuálnom tempe.",
      metadata: {
        avgReadiness,
        criticalGigs: criticalGigs.map(g => ({ title: g.title, daysUntil: g.daysUntil, readiness: g.readiness, open: g.open })),
        upcomingGigs: upcomingGigsWithTasks.map(g => ({ title: g.title, readiness: g.readiness, open: g.open, daysUntil: g.daysUntil })),
      },
    });

    // =====================================================
    // SUMMARY — overall health score
    // =====================================================

    const healthScore = Math.round(
      (predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length) * 100
    );

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      healthScore,
      predictions,
      summary: {
        totalPredictions: predictions.length,
        highConfidence: predictions.filter(p => p.confidence >= 0.7).length,
        trends: {
          up: predictions.filter(p => p.trend === "up").length,
          down: predictions.filter(p => p.trend === "down").length,
          stable: predictions.filter(p => p.trend === "stable").length,
        },
      },
    });
  } catch (err) {
    console.error("[predictions] error:", err);
    return NextResponse.json({ error: "Generovanie predikcií zlyhalo." }, { status: 500 });
  }
}
