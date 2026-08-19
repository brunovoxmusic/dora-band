import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * M4.5 — AI Cost Tracking API
 *
 * GET /api/admin/ai-usage
 *
 * Vráti agregované štatistiky AI volaní:
 * - Celkové náklady (mesiac, deň)
 * - Top modely podľa nákladov
 * - Top tasky podľa nákladov
 * - Posledných 50 volaní
 * - Denný trend (posledných 14 dní)
 * - Success rate
 *
 * Query params:
 * - ?days=N (počet dní pre agregáciu, default 30)
 * - ?limit=N (počet záznamov v recent list, default 50)
 */

export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Neoprávnený." }, { status: 401 });

  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalCalls,
      successfulCalls,
      failedCalls,
      monthAgg,
      todayAgg,
      totalAgg,
      recentCalls,
      byModel,
      byTask,
      byProvider,
      byDay,
    ] = await Promise.all([
      db.aiUsageLog.count({ where: { createdAt: { gte: since } } }),
      db.aiUsageLog.count({ where: { createdAt: { gte: since }, success: true } }),
      db.aiUsageLog.count({ where: { createdAt: { gte: since }, success: false } }),
      db.aiUsageLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { costUsd: true, totalTokens: true, promptTokens: true, completionTokens: true },
        _avg: { latencyMs: true },
        _count: true,
      }),
      db.aiUsageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
      }),
      db.aiUsageLog.aggregate({
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
      }),
      db.aiUsageLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          provider: true,
          model: true,
          task: true,
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          latencyMs: true,
          costUsd: true,
          success: true,
          errorMessage: true,
          promptPreview: true,
          createdAt: true,
        },
      }),
      db.aiUsageLog.groupBy({
        by: ["model"],
        where: { createdAt: { gte: since } },
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
        orderBy: { _sum: { costUsd: "desc" } },
      }),
      db.aiUsageLog.groupBy({
        by: ["task"],
        where: { createdAt: { gte: since } },
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
        orderBy: { _sum: { costUsd: "desc" } },
      }),
      db.aiUsageLog.groupBy({
        by: ["provider"],
        where: { createdAt: { gte: since } },
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
      }),
      db.aiUsageLog.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        select: { costUsd: true, totalTokens: true, createdAt: true, success: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Build daily aggregation in JS (cross-DB compatible)
    const dailyMap = new Map<string, { date: string; cost: number; tokens: number; calls: number; errors: number }>();
    for (const call of byDay) {
      const dayKey = call.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(dayKey) || { date: dayKey, cost: 0, tokens: 0, calls: 0, errors: 0 };
      entry.cost += call.costUsd;
      entry.tokens += call.totalTokens;
      entry.calls += 1;
      if (!call.success) entry.errors += 1;
      dailyMap.set(dayKey, entry);
    }
    const dailyTrend = Array.from(dailyMap.values()).map(d => ({
      ...d,
      cost: Math.round(d.cost * 10000) / 10000,
    }));

    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100;
    const monthCost = monthAgg._sum.costUsd || 0;
    const todayCost = todayAgg._sum.costUsd || 0;
    const totalCost = totalAgg._sum.costUsd || 0;
    const avgLatency = monthAgg._avg.latencyMs || 0;

    return NextResponse.json({
      period: { days, since: since.toISOString(), until: new Date().toISOString() },
      summary: {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: Math.round(successRate * 100) / 100,
        monthCost: Math.round(monthCost * 10000) / 10000,
        todayCost: Math.round(todayCost * 10000) / 10000,
        totalCost: Math.round(totalCost * 10000) / 10000,
        monthTokens: monthAgg._sum.totalTokens || 0,
        todayTokens: todayAgg._sum.totalTokens || 0,
        totalTokens: totalAgg._sum.totalTokens || 0,
        monthCalls: monthAgg._count,
        todayCalls: todayAgg._count,
        avgLatencyMs: Math.round(avgLatency),
      },
      byModel: byModel.map(m => ({
        model: m.model,
        cost: Math.round((m._sum.costUsd || 0) * 10000) / 10000,
        tokens: m._sum.totalTokens || 0,
        calls: m._count,
      })),
      byTask: byTask.map(t => ({
        task: t.task,
        cost: Math.round((t._sum.costUsd || 0) * 10000) / 10000,
        tokens: t._sum.totalTokens || 0,
        calls: t._count,
      })),
      byProvider: byProvider.map(p => ({
        provider: p.provider,
        cost: Math.round((p._sum.costUsd || 0) * 10000) / 10000,
        tokens: p._sum.totalTokens || 0,
        calls: p._count,
      })),
      dailyTrend,
      recentCalls: recentCalls.map(c => ({
        ...c,
        costUsd: Math.round(c.costUsd * 10000) / 10000,
      })),
    });
  } catch (err) {
    console.error("[ai-usage GET]", err);
    return NextResponse.json(
      { error: "Načítanie AI usage zlyhalo.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
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
