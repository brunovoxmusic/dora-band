"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import {
  TrendingUp, TrendingDown, Activity, RefreshCw, Brain, Target,
  ShoppingCart, Users, DollarSign, Calendar, Sparkles, AlertTriangle,
  CheckCircle2, Lightbulb, ArrowUp, ArrowDown, Minus,
} from "lucide-react";

type Prediction = {
  type: "booking" | "fan" | "revenue" | "stock" | "gig";
  label: string;
  value: string;
  confidence: number;
  trend: "up" | "down" | "stable";
  detail: string;
  recommendation: string;
  metadata?: Record<string, unknown>;
};

type PredictionsData = {
  generatedAt: string;
  healthScore: number;
  predictions: Prediction[];
  summary: {
    totalPredictions: number;
    highConfidence: number;
    trends: { up: number; down: number; stable: number };
  };
};

const TYPE_CONFIG: Record<Prediction["type"], { icon: typeof Target; color: string; bg: string; label: string }> = {
  booking: { icon: Target, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/30", label: "Booking" },
  fan: { icon: Users, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30", label: "Fan engagement" },
  revenue: { icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "Revenue" },
  stock: { icon: ShoppingCart, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Stock risk" },
  gig: { icon: Calendar, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", label: "Gig readiness" },
};

const TREND_CONFIG = {
  up: { icon: ArrowUp, color: "text-emerald-600 dark:text-emerald-400", label: "Rastie" },
  down: { icon: ArrowDown, color: "text-red-600 dark:text-red-400", label: "Klesá" },
  stable: { icon: Minus, color: "text-muted-foreground", label: "Stabilné" },
};

function fmtPercent(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function PredictionsTab() {
  const [data, setData] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/predictions");
      if (!res.ok) throw new Error("Načítanie zlyhalo");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (loading && !data) return <LoadingSkeleton />;
  if (!data) return <EmptyState title="Žiadne dáta" description="Zatiaľ neboli vygenerované žiadne predikcie." icon={Brain} />;

  const { up, down, stable } = data.summary.trends;
  const healthLabel = data.healthScore >= 80 ? "Výborný" : data.healthScore >= 60 ? "Dobrý" : data.healthScore >= 40 ? "Priemerný" : "Kritický";
  const healthColor = data.healthScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : data.healthScore >= 60 ? "text-sky-600 dark:text-sky-400" : data.healthScore >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500" />
            Predictive Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-driven predikcie pre booking, fan engagement, revenue a viac · {data.summary.totalPredictions} predikcií
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Obnoviť
        </Button>
      </div>

      {/* Health Score + Trends */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Health Score</p>
                <p className={`text-4xl font-bold tracking-tight tabular-nums ${healthColor}`}>
                  {data.healthScore}<span className="text-xl text-muted-foreground">/100</span>
                </p>
                <p className={`text-sm font-medium ${healthColor}`}>{healthLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generované {new Date(data.generatedAt).toLocaleString("sk-SK")}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                <Brain className="h-6 w-6" />
              </div>
            </div>
            <Progress value={data.healthScore} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Trendy rastú</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{up}</p>
                <p className="text-xs text-muted-foreground">z {data.summary.totalPredictions}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Kritické trendy</p>
                <p className={`text-2xl font-bold tabular-nums ${down > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{down}</p>
                <p className="text-xs text-muted-foreground">{stable} stabilných</p>
              </div>
              <TrendingDown className={`h-5 w-5 ${down > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.predictions.map((p, idx) => {
          const config = TYPE_CONFIG[p.type];
          const trend = TREND_CONFIG[p.trend];
          const Icon = config.icon;
          const TrendIcon = trend.icon;
          const isCritical = p.trend === "down" && p.confidence > 0.6;

          return (
            <Card key={`${p.type}-${idx}`} className={isCritical ? "border-red-500/30" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                            {config.label}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4">
                            <TrendIcon className={`h-2.5 w-2.5 ${trend.color} mr-1`} />
                            {trend.label}
                          </Badge>
                          {isCritical && (
                            <Badge variant="outline" className="text-[9px] h-4 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                              Kritické
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mt-1">{p.label}</h3>
                        <p className={`text-2xl font-bold tabular-nums mt-0.5 ${config.color}`}>{p.value}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-muted-foreground uppercase">Confidence</div>
                        <div className="text-sm font-bold tabular-nums">{fmtPercent(p.confidence)}</div>
                        <Progress value={p.confidence * 100} className="h-1 w-12 mt-1" />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      {p.detail}
                    </p>

                    {/* Recommendation */}
                    <div className="mt-3 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-500/20 flex items-start gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
                        {p.recommendation}
                      </div>
                    </div>

                    {/* Metadata display for specific types */}
                    {p.type === "stock" && Array.isArray(p.metadata?.stockRisks) && (
                      <div className="mt-2 space-y-1">
                        {(p.metadata.stockRisks as Array<{ name: string; stock: number; daysUntilOut: number }>).map((r, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span>{r.name}</span>
                            <span className="text-muted-foreground">
                              {r.stock} ks · {r.daysUntilOut === Infinity ? "bez predaja" : `${r.daysUntilOut} dní`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {p.type === "booking" && Array.isArray(p.metadata?.highProbabilityContacts) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.metadata.highProbabilityContacts as Array<{ name: string; score: number }>).map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[9px]">
                            {c.name} · {c.score}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {p.type === "gig" && Array.isArray(p.metadata?.criticalGigs) && (p.metadata.criticalGigs as unknown[]).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(p.metadata.criticalGigs as Array<{ title: string; daysUntil: number; readiness: number }>).map((g, i) => (
                          <div key={i} className="flex justify-between text-xs p-1.5 rounded bg-red-50 dark:bg-red-950/20">
                            <span className="font-medium">⚠️ {g.title}</span>
                            <span className="text-red-600 dark:text-red-400">
                              {g.daysUntil}d · {Math.round(g.readiness)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          {data.summary.highConfidence} z {data.summary.totalPredictions} predikcií s vysokou confidence (≥70%)
        </span>
        <span>
          Posledná aktualizácia: {new Date(data.generatedAt).toLocaleString("sk-SK")}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 lg:col-span-2" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  );
}
