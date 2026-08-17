"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { DollarSign, Zap, Clock, CheckCircle2, XCircle, TrendingUp, RefreshCw, Activity, Cpu, ListChecks } from "lucide-react";

type UsageData = {
  period: { days: number; since: string; until: string };
  summary: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: number;
    monthCost: number;
    todayCost: number;
    totalCost: number;
    monthTokens: number;
    todayTokens: number;
    totalTokens: number;
    monthCalls: number;
    todayCalls: number;
    avgLatencyMs: number;
  };
  byModel: { model: string; cost: number; tokens: number; calls: number }[];
  byTask: { task: string; cost: number; tokens: number; calls: number }[];
  byProvider: { provider: string; cost: number; tokens: number; calls: number }[];
  dailyTrend: { date: string; cost: number; tokens: number; calls: number; errors: number }[];
  recentCalls: {
    id: string;
    provider: string;
    model: string;
    task: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    costUsd: number;
    success: boolean;
    errorMessage: string | null;
    promptPreview: string | null;
    createdAt: string;
  }[];
};

const TASK_LABELS: Record<string, string> = {
  "copilot": "AI Copilot",
  "market-report": "Market Report",
  "writing": "Content Writing",
  "analysis": "Analysis",
  "fast": "Fast Query",
  "seo": "SEO Scoring",
  "suggestions": "Suggestions",
  "variants": "A/B Variants",
  "content": "Content",
  "chat": "Chat",
};

function fmtCost(n: number): string {
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("sk-SK", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `pred ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `pred ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `pred ${hr}h`;
  return `pred ${Math.floor(hr / 24)}d`;
}

export function AiUsageTab() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ai-usage?days=${days}`);
      if (!res.ok) throw new Error("Načítanie zlyhalo");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (loading && !data) return <LoadingSkeleton />;
  if (!data) return <EmptyState title="Žiadne dáta" description="Zatiaľ neboli zaznamenané žiadne AI volania." />;

  const maxDailyCost = Math.max(...data.dailyTrend.map(d => d.cost), 0.0001);
  const maxModelCost = Math.max(...data.byModel.map(m => m.cost), 0.0001);
  const maxTaskCost = Math.max(...data.byTask.map(t => t.cost), 0.0001);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-500" />
            AI Cost Tracking
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sledovanie nákladov, tokenov a latencie AI operácií · posledných {days} dní
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border bg-muted/40 p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-xs rounded transition-colors ${days === d ? "bg-background shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Náklady tento mesiac"
          value={fmtCost(data.summary.monthCost)}
          subtitle={`${fmtCost(data.summary.todayCost)} dnes`}
          icon={<DollarSign className="h-5 w-5" />}
          accent="emerald"
        />
        <KpiCard
          title="Volania tento mesiac"
          value={data.summary.monthCalls.toLocaleString("sk-SK")}
          subtitle={`${data.summary.todayCalls} dnes`}
          icon={<Activity className="h-5 w-5" />}
          accent="sky"
        />
        <KpiCard
          title="Tokeny tento mesiac"
          value={fmtTokens(data.summary.monthTokens)}
          subtitle={`${fmtTokens(data.summary.todayTokens)} dnes`}
          icon={<Zap className="h-5 w-5" />}
          accent="amber"
        />
        <KpiCard
          title="Priemerná latencia"
          value={`${data.summary.avgLatencyMs}ms`}
          subtitle={`Úspešnosť: ${data.summary.successRate}%`}
          icon={<Clock className="h-5 w-5" />}
          accent="violet"
        />
      </div>

      {/* Daily trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Denný trend nákladov (14 dní)
          </CardTitle>
          <CardDescription>Cena v USD za deň + počet volaní</CardDescription>
        </CardHeader>
        <CardContent>
          {data.dailyTrend.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Žiadne dáta za posledných 14 dní.
            </div>
          ) : (
            <div className="flex items-end gap-1.5 h-40 px-1">
              {data.dailyTrend.map((day) => (
                <div key={day.date} className="flex-1 group flex flex-col items-center gap-1 min-w-0">
                  <div className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {fmtCost(day.cost)}
                  </div>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500/40 to-emerald-500 transition-all hover:from-emerald-500 hover:to-emerald-400"
                    style={{ height: `${Math.max((day.cost / maxDailyCost) * 100, 4)}%` }}
                    title={`${day.date}: ${fmtCost(day.cost)} / ${day.calls} volaní`}
                  />
                  <div className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two columns: Models + Tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top modely */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-violet-500" />
              Top modely podľa nákladov
            </CardTitle>
            <CardDescription>Rozdelenie nákladov podľa AI modelu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byModel.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Žiadne dáta.</div>
            ) : (
              data.byModel.slice(0, 8).map((m) => (
                <div key={m.model} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="font-mono text-xs truncate">{m.model}</div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{m.calls}× · {fmtTokens(m.tokens)}</span>
                      <span className="font-semibold tabular-nums">{fmtCost(m.cost)}</span>
                    </div>
                  </div>
                  <Progress value={(m.cost / maxModelCost) * 100} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top tasky */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-sky-500" />
              Top tasky podľa nákladov
            </CardTitle>
            <CardDescription>Rozdelenie nákladov podľa typu operácie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byTask.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Žiadne dáta.</div>
            ) : (
              data.byTask.slice(0, 8).map((t) => (
                <div key={t.task} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{t.calls}×</Badge>
                      <span className="font-medium">{TASK_LABELS[t.task] || t.task}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{fmtTokens(t.tokens)}</span>
                      <span className="font-semibold tabular-nums">{fmtCost(t.cost)}</span>
                    </div>
                  </div>
                  <Progress value={(t.cost / maxTaskCost) * 100} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider summary + Recent calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-amber-500" />
            Posledné AI volania ({data.recentCalls.length})
          </CardTitle>
          <CardDescription>Detail posledných operácií s tokenmi, latenciou a stavom</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentCalls.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Zatiaľ neboli zaznamenané žiadne AI volania.
              <br />
              <span className="text-xs">Spustite AI Copilot alebo vygenerujte Market Report.</span>
            </div>
          ) : (
            <ScrollArea className="h-96 rounded-md border">
              <div className="divide-y">
                {data.recentCalls.map((call) => (
                  <div key={call.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {call.success ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {TASK_LABELS[call.task] || call.task}
                            </Badge>
                            <span className="font-mono text-[10px] text-muted-foreground">{call.model}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{fmtRelative(call.createdAt)}</span>
                          </div>
                          {call.promptPreview && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 truncate">
                              {call.promptPreview}
                            </p>
                          )}
                          {call.errorMessage && (
                            <p className="text-xs text-red-500 mt-1 line-clamp-2">{call.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Tokeny</div>
                          <div className="font-mono tabular-nums">{fmtTokens(call.totalTokens)}</div>
                          <div className="text-[9px] text-muted-foreground">
                            {call.promptTokens}↑ {call.completionTokens}↓
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Latencia</div>
                          <div className="font-mono tabular-nums">{call.latencyMs}ms</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Cena</div>
                          <div className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                            {fmtCost(call.costUsd)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Provider: <Badge variant="outline" className="text-[10px]">{data.byProvider.map(p => p.provider).join(", ") || "žiadny"}</Badge>
        </span>
        <span>
          Spolu od začiatku: <strong className="text-emerald-600 dark:text-emerald-400">{fmtCost(data.summary.totalCost)}</strong> · {data.summary.totalTokens.toLocaleString("sk-SK")} tokenov · {data.summary.totalCalls.toLocaleString("sk-SK")} volaní
        </span>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: "emerald" | "sky" | "amber" | "violet";
}) {
  const colors: Record<typeof accent, string> = {
    emerald: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40",
    sky: "text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/40",
    amber: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40",
    violet: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`p-2 rounded-lg ${colors[accent]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
