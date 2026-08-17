"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, X, Loader2, TrendingUp, Mail, Building, Calendar,
  DollarSign, FileText, Clock, AlertCircle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

type Booking = {
  id: string;
  status: string;
  aiMatchScore: number | null;
  aiAnalysis: string | null;
  proposedFee: string | null;
  actualFee: string | null;
  createdAt: string;
  contactId: string | null;
  gigId: string | null;
  contact: { id: string; name: string; email: string | null; organization: string | null; city: string | null; type: string } | null;
};

// M2.1: Extended pipeline — 8 hlavné stavy (zo 14 v audite, zoskupené pre praktický Kanban)
const PIPELINE: { id: string; label: string; color: string; phase: string }[] = [
  { id: "lead", label: "Lead", color: "border-silver/40", phase: "objavenie" },
  { id: "qualified", label: "Kvalifikovaný", color: "border-sky-500/40", phase: "objavenie" },
  { id: "contacted", label: "Kontaktovaný", color: "border-warm-yellow/40", phase: "kontakt" },
  { id: "replied", label: "Odpovedal", color: "border-cyan-500/40", phase: "kontakt" },
  { id: "negotiated", label: "Vyjednávanie", color: "border-indigo-500/40", phase: "vyjednávanie" },
  { id: "offer_sent", label: "Ponuka odoslaná", color: "border-purple-500/40", phase: "vyjednávanie" },
  { id: "confirmed", label: "Potvrdený", color: "border-green-500/40", phase: "potvrdenie" },
  { id: "cancelled", label: "Zrušený", color: "border-neon-red/40", phase: "zrušené" },
];

// Quick status presets (pre rýchle presúvanie medzi hlavnými fázami)
const QUICK_MOVES: Record<string, string[]> = {
  lead: ["qualified", "contacted"],
  qualified: ["contacted", "lead"],
  contacted: ["replied", "negotiated"],
  replied: ["negotiated", "offer_sent"],
  negotiated: ["offer_sent", "confirmed"],
  offer_sent: ["confirmed", "negotiated"],
  confirmed: [],
  cancelled: ["lead"],
};

export function BookingTab() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/admin/bookings")
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const moveStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems(arr => arr.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Presunuté: ${PIPELINE.find(p => p.id === status)?.label || status}`);
    } catch { toast.error("Chyba pri presune."); }
  };

  const remove = async (id: string) => {
    if (!confirm("Zmazať booking?")) return;
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      setItems(arr => arr.filter(b => b.id !== id));
      toast.success("Zmazané.");
    } catch { toast.error("Chyba."); }
  };

  const visibleItems = showCancelled ? items : items.filter(b => b.status !== "cancelled");
  const activeCount = items.filter(b => b.status !== "cancelled" && b.status !== "confirmed").length;
  const confirmedCount = items.filter(b => b.status === "confirmed").length;

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse bg-charcoal" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Nepodarilo sa načítať booking pipeline." onRetry={load} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Pipeline je prázdna"
        description="Booking dopyty sa automaticky pridajú do pipeline keď ich prijmete v sekcii Dopyty."
      />
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
              {activeCount}
            </span>
            <span className="text-sm text-off-white/80">aktívnych</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-brand text-[10px] uppercase tracking-wider text-green-400">
              {confirmedCount}
            </span>
            <span className="text-sm text-off-white/80">potvrdených</span>
          </div>
        </div>
        <button
          onClick={() => setShowCancelled(v => !v)}
          className={cn(
            "border px-3 py-1.5 text-xs font-semibold transition-colors",
            showCancelled
              ? "border-neon-red text-neon-red"
              : "border-charcoal text-silver hover:text-off-white"
          )}
        >
          {showCancelled ? "Skryť zrušené" : `Zrušené (${items.filter(b => b.status === "cancelled").length})`}
        </button>
      </div>

      {/* Kanban — horizontal scroll */}
      <div className="overflow-x-auto scroll-dora pb-4">
        <div className="grid min-w-[1200px] grid-cols-8 gap-3">
          {PIPELINE.map(col => {
            const colItems = visibleItems.filter(b => b.status === col.id);
            const isCancelled = col.id === "cancelled";
            return (
              <div
                key={col.id}
                className={cn("border-t-2 bg-dark-gray/30 p-3", col.color, isCancelled && !showCancelled && "hidden")}
              >
                {/* Column header */}
                <div className="mb-3">
                  <p className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                    {col.label}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center text-[10px] font-bold",
                      colItems.length > 0 ? "bg-neon-red/20 text-neon-red" : "bg-charcoal text-silver/40"
                    )}>
                      {colItems.length}
                    </span>
                    <span className="font-mono-brand text-[8px] uppercase tracking-wider text-silver/30">
                      {col.phase}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colItems.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onMove={moveStatus}
                      onDelete={remove}
                      onClick={() => setSelected(b)}
                    />
                  ))}
                  {colItems.length === 0 && (
                    <p className="py-4 text-center text-xs text-silver/30">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking detail modal */}
      {selected && (
        <BookingDetail
          booking={selected}
          onClose={() => setSelected(null)}
          onMove={moveStatus}
        />
      )}
    </div>
  );
}

// =====================================================
// BookingCard — karta v Kanban stĺpci
// =====================================================

function BookingCard({
  booking,
  onMove,
  onDelete,
  onClick,
}: {
  booking: Booking;
  onMove: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  const quickMoves = QUICK_MOVES[booking.status] || [];

  return (
    <div className="group border border-charcoal bg-dark-gray p-3 transition-colors hover:border-off-white/30">
      {/* Clickable area — opens detail */}
      <button onClick={onClick} className="block w-full text-left">
        <p className="truncate text-sm font-semibold text-off-white">
          {booking.contact?.name || "Neznámy kontakt"}
        </p>
        {booking.contact?.organization && (
          <p className="truncate text-xs text-silver">{booking.contact.organization}</p>
        )}
        {booking.contact?.city && (
          <p className="text-xs text-silver/60">{booking.contact.city}</p>
        )}
      </button>

      {/* AI Match Score */}
      {booking.aiMatchScore !== null && (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-warm-yellow" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-mono-brand text-xs font-bold text-warm-yellow">
                {Math.round(booking.aiMatchScore)}%
              </span>
              <div className="h-1 flex-1 bg-charcoal">
                <div
                  className="h-full bg-warm-yellow"
                  style={{ width: `${Math.min(100, Math.max(0, booking.aiMatchScore))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee */}
      {booking.proposedFee && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-off-white/60">
          <DollarSign className="h-3 w-3 text-green-400" />
          {booking.proposedFee}
        </p>
      )}

      {/* Quick move buttons */}
      {quickMoves.length > 0 && (
        <div className="mt-2 flex gap-1">
          {quickMoves.map(statusId => {
            const target = PIPELINE.find(p => p.id === statusId);
            if (!target) return null;
            return (
              <button
                key={statusId}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(booking.id, statusId);
                }}
                className="flex-1 border border-charcoal px-1.5 py-1 text-[9px] font-semibold text-silver transition-colors hover:border-neon-red hover:text-neon-red"
                title={`Presunúť do: ${target.label}`}
              >
                → {target.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Delete button — appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(booking.id);
        }}
        className="mt-2 hidden text-silver hover:text-neon-red group-hover:block"
        title="Zmazať"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// =====================================================
// BookingDetail — modal s detailom
// =====================================================

function BookingDetail({
  booking,
  onClose,
  onMove,
}: {
  booking: Booking;
  onClose: () => void;
  onMove: (id: string, status: string) => void;
}) {
  const [rescoring, setRescoring] = useState(false);
  const [scoreData, setScoreData] = useState<{
    score: number;
    factors: Record<string, number>;
    priority: string;
    recommendation: string;
    reasoning: string;
  } | null>(null);

  // Parse existing aiAnalysis if it's JSON (M2.4 format)
  useEffect(() => {
    if (booking.aiAnalysis) {
      try {
        const parsed = JSON.parse(booking.aiAnalysis);
        if (parsed.factors) setScoreData(parsed);
      } catch { /* not JSON, ignore */ }
    }
  }, [booking.aiAnalysis]);

  const rescore = async () => {
    setRescoring(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/rescore`, { method: "POST" });
      if (!res.ok) throw new Error("Zlyhalo");
      const d = await res.json();
      if (d.analysis) {
        setScoreData(d.analysis);
        toast.success(`Re-score: ${d.analysis.score}%`);
      }
    } catch { toast.error("Re-scoring zlyhal."); }
    finally { setRescoring(false); }
  };

  const factorLabels: Record<string, string> = {
    genreFit: "Žáner",
    locationFit: "Lokalita",
    commercialFit: "Komercia",
    contactQuality: "Kontakt",
    timing: "Termín",
  };
  const priorityColors: Record<string, string> = {
    high: "text-neon-red border-neon-red/40",
    medium: "text-warm-yellow border-warm-yellow/40",
    low: "text-silver border-charcoal",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-off-white">
              {booking.contact?.name || "Neznámy kontakt"}
            </h3>
            <p className="font-mono-brand text-[10px] uppercase text-warm-yellow">
              {PIPELINE.find(p => p.id === booking.status)?.label || booking.status}
            </p>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-silver" />
          </button>
        </div>

        {/* Contact info */}
        <div className="space-y-2 text-sm">
          {booking.contact?.email && (
            <p className="flex items-center gap-2 text-off-white/80">
              <Mail className="h-3.5 w-3.5 text-warm-yellow" />
              {booking.contact.email}
            </p>
          )}
          {booking.contact?.organization && (
            <p className="flex items-center gap-2 text-off-white/80">
              <Building className="h-3.5 w-3.5 text-warm-yellow" />
              {booking.contact.organization}
            </p>
          )}
          {booking.contact?.city && (
            <p className="flex items-center gap-2 text-off-white/80">
              <Calendar className="h-3.5 w-3.5 text-warm-yellow" />
              {booking.contact.city}
            </p>
          )}
        </div>

        {/* M2.4: Booking Score v2 — explainable + re-scoreable */}
        <div className="mt-4 border-t border-charcoal pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono-brand text-[11px] uppercase text-warm-yellow">
              {"// Booking Score"}
            </p>
            <button
              onClick={rescore}
              disabled={rescoring}
              className="inline-flex items-center gap-1.5 border border-charcoal px-2.5 py-1 text-[10px] font-bold uppercase text-silver transition-colors hover:border-neon-red hover:text-neon-red disabled:opacity-50"
            >
              {rescoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {rescoring ? "Analyzujem..." : "Re-score"}
            </button>
          </div>

          {/* Overall score */}
          {booking.aiMatchScore !== null && (
            <div className="mb-3 flex items-center gap-3">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center border-2",
                booking.aiMatchScore >= 70 ? "border-green-500 text-green-400" :
                booking.aiMatchScore >= 40 ? "border-warm-yellow text-warm-yellow" :
                "border-neon-red text-neon-red"
              )}>
                <span className="font-display text-xl font-black">
                  {Math.round(booking.aiMatchScore)}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-off-white">D.O.R.A. Booking Score</p>
                {scoreData?.priority && (
                  <span className={cn(
                    "inline-block border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase",
                    priorityColors[scoreData.priority] || priorityColors.medium
                  )}>
                    {scoreData.priority === "high" ? "🔥 Vysoká priorita" :
                     scoreData.priority === "medium" ? "⏱ Stredná priorita" : "📅 Nízka priorita"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Factor breakdown */}
          {scoreData?.factors && (
            <div className="space-y-2">
              {Object.entries(scoreData.factors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-silver">{factorLabels[key] || key}</span>
                  <div className="h-2 flex-1 bg-charcoal">
                    <div
                      className={cn(
                        "h-full transition-all",
                        value >= 70 ? "bg-green-500" :
                        value >= 40 ? "bg-warm-yellow" :
                        "bg-neon-red"
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono-brand text-xs text-off-white">
                    {Math.round(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          {scoreData?.recommendation && (
            <div className="mt-3 border border-charcoal/50 bg-ink p-3">
              <p className="font-mono-brand text-[9px] uppercase text-warm-yellow">Odporúčanie</p>
              <p className="mt-1 text-sm text-off-white/80">{scoreData.recommendation}</p>
            </div>
          )}

          {/* Reasoning */}
          {scoreData?.reasoning && (
            <div className="mt-2 border border-charcoal/50 bg-ink p-3">
              <p className="font-mono-brand text-[9px] uppercase text-silver/60">Vysvetlenie</p>
              <p className="mt-1 text-xs text-silver">{scoreData.reasoning}</p>
            </div>
          )}
        </div>

        {/* Fees */}
        <div className="mt-4 border-t border-charcoal pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono-brand text-[9px] uppercase text-silver">Navrhovaný fee</p>
              <p className="text-sm font-semibold text-off-white">{booking.proposedFee || "—"}</p>
            </div>
            <div>
              <p className="font-mono-brand text-[9px] uppercase text-silver">Reálny fee</p>
              <p className="text-sm font-semibold text-off-white">{booking.actualFee || "—"}</p>
            </div>
          </div>
        </div>

        {/* Move to status */}
        <div className="mt-4 border-t border-charcoal pt-4">
          <p className="mb-2 font-mono-brand text-[11px] uppercase text-warm-yellow">
            {"// Zmeniť status"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onMove(booking.id, p.id);
                  onClose();
                }}
                className={cn(
                  "border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  booking.status === p.id
                    ? "border-neon-red bg-neon-red/10 text-neon-red"
                    : "border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
