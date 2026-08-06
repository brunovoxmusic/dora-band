"use client";

import { useEffect, useState } from "react";
import {
  Inbox,
  CalendarDays,
  Images,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  counts: {
    inquiries: number;
    gigs: number;
    media: number;
    subscribers: number;
    newInquiries: number;
    upcomingGigs: number;
    contacts?: number;
    tasks?: number;
    activeBookings?: number;
    automations?: number;
  };
  recentInquiries: Array<{
    id: string;
    organizer: string;
    eventType: string;
    status: string;
    createdAt: string;
    eventDate: string;
    eventLocation: string;
  }>;
  upcomingGigs: Array<{
    id: string;
    title: string;
    date: string;
    city: string;
    venue: string;
  }>;
  recentTasks?: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    priority: string;
    aiGenerated: boolean;
  }>;
  recentAutomations?: Array<{
    id: string;
    agentType: string;
    trigger: string;
    status: string;
    createdAt: string;
  }>;
  statusBreakdown: Record<string, number>;
};

type Suggestion = {
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
};

const statusLabel: Record<string, string> = {
  new: "Nová",
  reviewed: "Spracovaná",
  confirmed: "Potvrdená",
  archived: "Archivovaná",
};
const statusColor: Record<string, string> = {
  new: "bg-neon-red",
  reviewed: "bg-warm-yellow",
  confirmed: "bg-green-500",
  archived: "bg-silver",
};

export function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/ai/suggestions").then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([statsData, sugData]) => {
      if (statsData.counts) setStats(statsData);
      setSuggestions(sugData.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse bg-charcoal" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-silver">Nepodarilo sa načítať štatistiky.</p>;
  }

  const cards = [
    { label: "Celkom dopytov", value: stats.counts.inquiries, sub: `${stats.counts.newInquiries} nových`, icon: Inbox, color: "neon-red" },
    { label: "Koncerty", value: stats.counts.gigs, sub: `${stats.counts.upcomingGigs} nadchádzajúcich`, icon: CalendarDays, color: "warm-yellow" },
    { label: "Médiá", value: stats.counts.media, sub: "fotografie", icon: Images, color: "neon-red" },
    { label: "Odborníci newslettera", value: stats.counts.subscribers, sub: "aktívnych", icon: Users, color: "warm-yellow" },
  ];

  const totalInquiries = Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="group relative border border-charcoal bg-dark-gray p-5 clip-corner transition-colors hover:border-off-white/30"
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center",
                    c.color === "neon-red" ? "bg-neon-red" : "bg-warm-yellow"
                  )}
                >
                  <Icon className={cn("h-5 w-5", c.color === "neon-red" ? "text-white" : "text-ink")} />
                </div>
                <span className="font-mono-brand text-[9px] uppercase tracking-wider text-silver/40">
                  0{i + 1}
                </span>
              </div>
              <p className="mt-4 font-display text-3xl font-black text-off-white">{c.value}</p>
              <p className="mt-0.5 text-sm font-semibold text-off-white/80">{c.label}</p>
              <p className="mt-1 font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
                {c.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent inquiries */}
        <div className="border border-charcoal bg-dark-gray">
          <div className="flex items-center justify-between border-b border-charcoal px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-neon-red" />
              <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                {"// Posledné dopyty"}
              </span>
            </div>
            <span className="font-mono-brand text-[10px] text-silver">{stats.recentInquiries.length}</span>
          </div>
          <div className="divide-y divide-charcoal/50">
            {stats.recentInquiries.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-silver">Zatiaľ žiadne dopyty.</p>
            ) : (
              stats.recentInquiries.map((inq) => (
                <div key={inq.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", statusColor[inq.status] || "bg-silver")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-off-white">{inq.organizer}</p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-off-white/60">
                      <MapPin className="h-3 w-3 text-warm-yellow" />
                      {inq.eventLocation || "—"} · {inq.eventType}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono-brand text-[10px] text-silver">
                      {new Date(inq.createdAt).toLocaleDateString("sk-SK")}
                    </p>
                    <p className="font-mono-brand text-[9px] uppercase text-warm-yellow">
                      {statusLabel[inq.status] || inq.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming gigs */}
        <div className="border border-charcoal bg-dark-gray">
          <div className="flex items-center justify-between border-b border-charcoal px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-warm-yellow" />
              <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                {"// Nadchádzajúce koncerty"}
              </span>
            </div>
            <span className="font-mono-brand text-[10px] text-silver">{stats.upcomingGigs.length}</span>
          </div>
          <div className="divide-y divide-charcoal/50">
            {stats.upcomingGigs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-silver">Žiadne nadchádzajúce koncerty.</p>
            ) : (
              stats.upcomingGigs.map((g) => {
                const d = new Date(g.date);
                return (
                  <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-charcoal bg-ink">
                      <span className="font-display text-sm font-black text-neon-red">
                        {d.toLocaleDateString("sk-SK", { day: "2-digit" })}
                      </span>
                      <span className="font-mono-brand text-[8px] uppercase text-warm-yellow">
                        {d.toLocaleDateString("sk-SK", { month: "short" }).replace(".", "")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-off-white">{g.title}</p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-off-white/60">
                        <MapPin className="h-3 w-3 text-warm-yellow" />
                        {g.venue}, {g.city}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-silver" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inquiry status breakdown */}
      <div className="border border-charcoal bg-dark-gray p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-neon-red" />
          <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
            {"// Stav dopytov"}
          </span>
        </div>
        <div className="space-y-3">
          {Object.entries(statusLabel).map(([key, label]) => {
            const count = stats.statusBreakdown[key] || 0;
            const pct = Math.round((count / totalInquiries) * 100);
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-off-white/80">
                    <span className={cn("h-2 w-2 rounded-full", statusColor[key])} />
                    {label}
                  </span>
                  <span className="font-mono-brand text-silver">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden border border-charcoal bg-ink">
                  <div
                    className={cn("h-full transition-all duration-700", statusColor[key])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-charcoal pt-3 text-xs text-silver">
          <Clock className="h-3.5 w-3.5" />
          <span>Aktualizované: {new Date().toLocaleString("sk-SK")}</span>
        </div>
      </div>

      {/* AI Suggestions — proaktívne návrhy */}
      {suggestions.length > 0 && (
        <div className="border border-neon-red/30 bg-neon-red/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-neon-red" />
            <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-neon-red">
              {"// AI Návrhy — proaktívne odporúčania"}
            </span>
          </div>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 border border-charcoal/50 bg-ink p-3">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", s.priority === "high" ? "bg-neon-red" : s.priority === "medium" ? "bg-warm-yellow" : "bg-silver")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-off-white">{s.title}</p>
                  <p className="mt-0.5 text-xs text-off-white/60">{s.description}</p>
                  <span className="mt-1 inline-block font-mono-brand text-[9px] uppercase tracking-wider text-warm-yellow">{s.action}</span>
                </div>
                <span className="shrink-0 font-mono-brand text-[9px] uppercase text-silver/40">{s.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent AI automations */}
      {stats.recentAutomations && stats.recentAutomations.length > 0 && (
        <div className="border border-charcoal bg-dark-gray p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-warm-yellow" />
            <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
              {"// Posledné AI automatizácie"}
            </span>
          </div>
          <div className="divide-y divide-charcoal/50">
            {stats.recentAutomations.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", a.status === "success" ? "bg-green-400" : "bg-neon-red")} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-off-white">{a.agentType}</p>
                  <p className="font-mono-brand text-[9px] uppercase text-silver">{a.trigger}</p>
                </div>
                <span className="font-mono-brand text-[9px] text-silver">{new Date(a.createdAt).toLocaleString("sk-SK")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
