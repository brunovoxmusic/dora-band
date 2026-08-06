"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, X, Loader2, TrendingUp, Mail, Building, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Booking = {
  id: string;
  status: string;
  aiMatchScore: number | null;
  aiAnalysis: string | null;
  proposedFee: string | null;
  actualFee: string | null;
  createdAt: string;
  contact: { id: string; name: string; email: string | null; organization: string | null; city: string | null; type: string } | null;
};

const COLUMNS = [
  { id: "lead", label: "Lead", color: "border-silver/40" },
  { id: "contacted", label: "Kontaktovaný", color: "border-warm-yellow/40" },
  { id: "negotiated", label: "Vyjednávanie", color: "border-blue-400/40" },
  { id: "confirmed", label: "Potvrdený", color: "border-green-500/40" },
  { id: "cancelled", label: "Zrušený", color: "border-neon-red/40" },
];

export function BookingTab() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/bookings").then(r => r.json()).then(d => { setItems(d.items ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); /* eslint-disable-line react-hooks/set-state-in-effect */ }, [load]);

  const moveStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setItems(arr => arr.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Status: ${status}`);
    } catch { toast.error("Chyba."); }
  };

  const remove = async (id: string) => {
    try { await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" }); setItems(arr => arr.filter(b => b.id !== id)); toast.success("Zmazané."); }
    catch { toast.error("Chyba."); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-off-white/80">{items.filter(b => b.status !== "cancelled" && b.status !== "confirmed").length} aktívnych v pipeline</p>
      </div>

      {loading ? <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">{Array.from({length: 5}).map((_, i) => <div key={i} className="h-40 animate-pulse bg-charcoal" />)}</div> : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map(col => (
            <div key={col.id} className={cn("border-t-2 bg-dark-gray/50 p-3", col.color)}>
              <p className="mb-3 font-mono-brand text-[10px] uppercase tracking-wider text-silver">{col.label} ({items.filter(b => b.status === col.id).length})</p>
              <div className="space-y-2">
                {items.filter(b => b.status === col.id).map(b => (
                  <div key={b.id} className="border border-charcoal bg-dark-gray p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-off-white">{b.contact?.name || "Neznámy"}</p>
                        {b.contact?.organization && <p className="truncate text-xs text-silver">{b.contact.organization}</p>}
                        {b.contact?.city && <p className="text-xs text-silver/60">{b.contact.city}</p>}
                      </div>
                      <button onClick={() => remove(b.id)} className="shrink-0 text-silver hover:text-neon-red"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    {b.aiMatchScore !== null && (
                      <div className="mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-warm-yellow" />
                        <span className="font-mono-brand text-xs text-warm-yellow">{b.aiMatchScore}%</span>
                      </div>
                    )}
                    {b.proposedFee && <p className="mt-1 text-xs text-off-white/60">{b.proposedFee}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveStatus(b.id, c.id)} className="border border-charcoal px-1.5 py-0.5 text-[9px] text-silver hover:border-neon-red hover:text-neon-red">{c.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {items.filter(b => b.status === col.id).length === 0 && <p className="py-4 text-center text-xs text-silver/40">Prázdne</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
