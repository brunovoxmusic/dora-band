"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Plus, Trash2, X, Loader2, Clock, Music, CheckCircle2,
  Users, FileText, Play,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

type Rehearsal = {
  id: string;
  date: string;
  attendees: string;
  songIds: string;
  newMaterial: string | null;
  notes: string | null;
  nextActions: string | null;
  recordings: string;
  durationMin: number | null;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Naplánovaná",
  done: "Odohraná",
  cancelled: "Zrušená",
};
const STATUS_COLORS: Record<string, string> = {
  planned: "border-warm-yellow/40 text-warm-yellow",
  done: "border-green-500/40 text-green-400",
  cancelled: "border-neon-red/40 text-neon-red",
};

function parseArray(raw: string): string[] {
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

export function RehearsalsTab() {
  const [items, setItems] = useState<Rehearsal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rehearsal | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/admin/rehearsals")
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Zmazať skúšku?")) return;
    try {
      await fetch(`/api/admin/rehearsals/${id}`, { method: "DELETE" });
      setItems(arr => arr.filter(r => r.id !== id));
      toast.success("Zmazané.");
    } catch { toast.error("Chyba."); }
  };

  const markDone = async (r: Rehearsal) => {
    try {
      await fetch(`/api/admin/rehearsals/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      setItems(arr => arr.map(i => i.id === r.id ? { ...i, status: "done" } : i));
      toast.success("Označené ako odohraná.");
    } catch { toast.error("Chyba."); }
  };

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-charcoal" />)}</div>;
  }

  if (error) {
    return <ErrorState message="Nepodarilo sa načítať skúšky." onRetry={load} />;
  }

  const plannedCount = items.filter(i => i.status === "planned").length;
  const doneCount = items.filter(i => i.status === "done").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-warm-yellow" />
          <div>
            <p className="text-sm font-bold text-off-white">Rehearsal Mode</p>
            <p className="text-xs text-silver">
              {items.length} skúšok · {plannedCount} naplánovaných · {doneCount} odohraných
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white"
        >
          <Plus className="h-4 w-4" /> Naplánovať skúšku
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Žiadne skúšky"
          description="Naplánujte skúšky kapely s setlistom, poznámkami a úlohami na doučenie."
          action={{ label: "Naplánovať prvú skúšku", onClick: () => { setEditing(null); setShowForm(true); } }}
        />
      ) : (
        <div className="max-h-[65vh] space-y-2 overflow-y-auto scroll-dora pr-1">
          {items.map(r => {
            const attendees = parseArray(r.attendees);
            const songs = parseArray(r.songIds);
            return (
              <div key={r.id} className="border border-charcoal bg-dark-gray p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase", STATUS_COLORS[r.status] || STATUS_COLORS.planned)}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                      <span className="font-mono-brand text-xs text-warm-yellow">
                        {new Date(r.date).toLocaleDateString("sk-SK", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {r.durationMin && (
                        <span className="flex items-center gap-1 text-xs text-silver">
                          <Clock className="h-2.5 w-2.5" /> {r.durationMin} min
                        </span>
                      )}
                    </div>
                    {attendees.length > 0 && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-off-white/70">
                        <Users className="h-3 w-3 text-warm-yellow" />
                        {attendees.join(", ")}
                      </p>
                    )}
                    {songs.length > 0 && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-silver">
                        <Music className="h-2.5 w-2.5" /> {songs.length} skladieb
                      </p>
                    )}
                    {r.notes && <p className="mt-1 text-xs text-off-white/60">{r.notes}</p>}
                    {r.newMaterial && (
                      <p className="mt-1 text-xs text-warm-yellow">
                        <span className="font-mono-brand text-[9px] uppercase">Nový materiál:</span> {r.newMaterial.slice(0, 80)}
                      </p>
                    )}
                    {r.nextActions && (
                      <p className="mt-1 text-xs text-neon-red">
                        <span className="font-mono-brand text-[9px] uppercase">Ďalšie úlohy:</span> {r.nextActions.slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {r.status === "planned" && (
                      <button
                        onClick={() => markDone(r)}
                        className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-green-500 hover:text-green-400"
                        title="Označiť ako odohraná"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditing(r); setShowForm(true); }}
                      className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                      title="Upraviť"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                      title="Zmazať"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <RehearsalForm
          item={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function RehearsalForm({ item, onClose, onSaved }: { item: Rehearsal | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    date: item ? new Date(item.date).toISOString().slice(0, 16) : "",
    attendees: parseArray(item?.attendees || "[]").join(", "),
    notes: item?.notes || "",
    newMaterial: item?.newMaterial || "",
    nextActions: item?.nextActions || "",
    durationMin: item?.durationMin || "",
    status: item?.status || "planned",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.date) { toast.error("Dátum je povinný."); return; }
    setSaving(true);
    try {
      const attendeesArr = form.attendees.split(",").map(s => s.trim()).filter(Boolean);
      const url = item ? `/api/admin/rehearsals/${item.id}` : "/api/admin/rehearsals";
      const method = item ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attendees: attendeesArr,
          durationMin: form.durationMin ? parseInt(String(form.durationMin)) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      toast.success(item ? "Skúška upravená." : "Skúška naplánovaná.");
      onSaved();
    } catch { toast.error("Chyba."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-off-white">{item ? "Upraviť skúšku" : "Naplánovať skúšku"}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-silver" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Dátum a čas *</label>
            <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Zúčastnení (oddelení čiarkou)</label>
            <input value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} placeholder="Braňo Guzma, Julo Flimmel,..." className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Trvanie (min)</label>
              <input type="number" value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">
                <option value="planned">Naplánovaná</option>
                <option value="done">Odohraná</option>
                <option value="cancelled">Zrušená</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Poznámky</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Nový materiál</label>
            <textarea value={form.newMaterial} onChange={e => setForm({ ...form, newMaterial: e.target.value })} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" placeholder="Čo sa učili..." />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Ďalšie úlohy</label>
            <textarea value={form.nextActions} onChange={e => setForm({ ...form, nextActions: e.target.value })} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" placeholder="Čo treba doučiť..." />
          </div>
          <button onClick={save} disabled={saving || !form.date} className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">
            {saving ? "Ukladám..." : "Uložiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
