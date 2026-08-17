"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, Users, Music, FileText, DollarSign, Loader2,
  Calendar, Star, Mail, Sparkles, MapPin, CheckCircle2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/admin/empty-state";

type Analytics = {
  live: { totalGigs: number; upcomingGigs: number; pastGigs: number; confirmedBookings: number; cancelledBookings: number; conversionRate: number };
  crm: { totalContacts: number; activeContacts: number; totalBookings: number; activeBookings: number; totalInquiries: number; newInquiries: number; responseRate: number; contactTypes: Record<string, number> };
  fan: { totalSubscribers: number; activeSubscribers: number; newThisWeek: number; growthRate: number; journeyStages: Record<string, number>; segments: Record<string, number>; topCities: { city: string; count: number }[] };
  music: { totalSongs: number; releasedSongs: number; setlistSongs: number; rehearsals: number; plannedRehearsals: number; songStatuses: Record<string, number> };
  content: { totalMedia: number; mediaWithAlt: number; mediaAltCoverage: number; totalKnowledge: number; verifiedKnowledge: number; knowledgeVerificationRate: number; totalAutomations: number; automationsThisWeek: number };
  business: { pipelineValue: number; avgFee: number; avgMatchScore: number; pipelineCount: number };
  generatedAt: string;
};

export function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse bg-charcoal" />)}
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message="Nepodarilo sa načítať analytiku." onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      {/* Generated time */}
      <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver/40">
        Aktualizované: {new Date(data.generatedAt).toLocaleString("sk-SK")}
      </p>

      {/* LIVE */}
      <KpiSection title="Live" icon={Calendar} color="neon-red">
        <KpiCard label="Koncerty spolu" value={data.live.totalGigs} sub={`${data.live.upcomingGigs} nadchádzajúcich · ${data.live.pastGigs} odohraných`} />
        <KpiCard label="Potvrdené bookingy" value={data.live.confirmedBookings} sub={`${data.live.cancelledBookings} zrušených`} />
        <KpiCard label="Konverzný pomer" value={`${data.live.conversionRate}%`} sub="potvrdené / celkom gigov" icon={TrendingUp} />
      </KpiSection>

      {/* CRM */}
      <KpiSection title="CRM" icon={Users} color="warm-yellow">
        <KpiCard label="Kontakty" value={data.crm.totalContacts} sub={`${data.crm.activeContacts} aktívnych`} />
        <KpiCard label="Pipeline" value={data.crm.activeBookings} sub={`${data.crm.totalBookings} celkom`} />
        <KpiCard label="Dopyty" value={data.crm.newInquiries} sub={`${data.crm.totalInquiries} celkom · ${data.crm.responseRate}% spracovaných`} />
        <div className="border border-charcoal bg-dark-gray p-3">
          <p className="mb-2 font-mono-brand text-[9px] uppercase text-silver">Typy kontaktov</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.crm.contactTypes).map(([type, count]) => (
              <span key={type} className="border border-charcoal px-2 py-1 text-xs text-off-white/80">
                {type}: <span className="font-bold text-warm-yellow">{count}</span>
              </span>
            ))}
          </div>
        </div>
      </KpiSection>

      {/* FAN */}
      <KpiSection title="Fan" icon={Mail} color="neon-red">
        <KpiCard label="Odberatelia" value={data.fan.activeSubscribers} sub={`+${data.fan.newThisWeek} tento týždeň (${data.fan.growthRate}%)`} />
        <KpiCard label="Najväčšie mestá" value="" custom>
          {data.fan.topCities.length > 0 ? (
            <div className="mt-1 space-y-1">
              {data.fan.topCities.map(c => (
                <div key={c.city} className="flex items-center gap-2 text-xs">
                  <MapPin className="h-2.5 w-2.5 text-warm-yellow" />
                  <span className="text-off-white/80">{c.city}</span>
                  <span className="font-mono-brand text-warm-yellow">{c.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-silver/50">Žiadne dáta</p>}
        </KpiCard>
        {Object.keys(data.fan.journeyStages).length > 0 && (
          <div className="border border-charcoal bg-dark-gray p-3">
            <p className="mb-2 font-mono-brand text-[9px] uppercase text-silver">Fan Journey</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.fan.journeyStages).map(([stage, count]) => (
                <span key={stage} className="border border-charcoal px-2 py-1 text-xs">
                  <span className="text-silver">{stage}:</span> <span className="font-bold text-neon-red">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </KpiSection>

      {/* MUSIC */}
      <KpiSection title="Music" icon={Music} color="warm-yellow">
        <KpiCard label="Skladby" value={data.music.totalSongs} sub={`${data.music.releasedSongs} vydaných · ${data.music.setlistSongs} v setliste`} />
        <KpiCard label="Skúšky" value={data.music.rehearsals} sub={`${data.music.plannedRehearsals} naplánovaných`} />
        {Object.keys(data.music.songStatuses).length > 0 && (
          <div className="border border-charcoal bg-dark-gray p-3">
            <p className="mb-2 font-mono-brand text-[9px] uppercase text-silver">Stavy skladieb</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.music.songStatuses).map(([status, count]) => (
                <span key={status} className="border border-charcoal px-2 py-1 text-xs">
                  <span className="text-silver">{status}:</span> <span className="font-bold text-warm-yellow">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </KpiSection>

      {/* BUSINESS */}
      <KpiSection title="Business" icon={DollarSign} color="green-500">
        <KpiCard label="Pipeline hodnota" value={`${data.business.pipelineValue} €`} sub={`${data.business.pipelineCount} aktívnych`} />
        <KpiCard label="Priemerný fee" value={`${data.business.avgFee} €`} sub="z navrhnutých/aktuálnych" />
        <KpiCard label="AI Match Score" value={`${data.business.avgMatchScore}%`} sub="priemer pipeline" icon={Star} />
      </KpiSection>

      {/* CONTENT */}
      <KpiSection title="Content & AI" icon={Sparkles} color="neon-red">
        <KpiCard label="Médiá" value={data.content.totalMedia} sub={`${data.content.mediaAltCoverage}% s alt-textom`} />
        <KpiCard label="Knowledge Base" value={data.content.totalKnowledge} sub={`${data.content.verifiedKnowledge} overených (${data.content.knowledgeVerificationRate}%)`} />
        <KpiCard label="AI Automatizácie" value={data.content.totalAutomations} sub={`${data.content.automationsThisWeek} tento týždeň`} />
      </KpiSection>
    </div>
  );
}

function KpiSection({ title, icon: Icon, color, children }: { title: string; icon: typeof Users; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center",
          color === "neon-red" ? "bg-neon-red/20 text-neon-red" :
          color === "warm-yellow" ? "bg-warm-yellow/20 text-warm-yellow" :
          color === "green-500" ? "bg-green-500/20 text-green-400" : "bg-charcoal text-silver"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
          {`// ${title}`}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, custom, children }: { label: string; value: string | number; sub?: string; icon?: typeof Users; custom?: boolean; children?: React.ReactNode }) {
  return (
    <div className="border border-charcoal bg-dark-gray p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">{label}</p>
          {!custom && <p className="mt-1 font-display text-2xl font-black text-off-white">{value}</p>}
          {Icon && <Icon className="mt-1 h-4 w-4 text-silver/40" />}
        </div>
        {children}
      </div>
      {sub && <p className="mt-1 text-xs text-silver/60">{sub}</p>}
    </div>
  );
}
