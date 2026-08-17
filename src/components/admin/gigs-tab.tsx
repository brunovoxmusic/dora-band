"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, CalendarDays, MapPin,
  TrendingUp, CheckSquare, Clock, DollarSign, FolderKanban,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Gig = {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketUrl: string | null;
  ticketPrice: string | null;
  status: string;
  notes: string | null;
};

const STATUSES = ["upcoming", "soldout", "cancelled", "past"];
const statusLabel: Record<string, string> = {
  upcoming: "Nadchádzajúci",
  soldout: "Vypredané",
  cancelled: "Zrušené",
  past: "Odohrané",
};

const emptyForm = {
  title: "",
  date: "",
  venue: "",
  city: "",
  country: "SK",
  ticketUrl: "",
  ticketPrice: "",
  status: "upcoming",
  notes: "",
};

export function GigsTab({ onChange }: { onChange: (n: number) => void }) {
  const [items, setItems] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Gig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [projectGig, setProjectGig] = useState<Gig | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/gigs")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        onChangeRef.current?.(d.items?.length ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (g: Gig) => {
    setEditing(g);
    setForm({
      title: g.title,
      date: new Date(g.date).toISOString().slice(0, 16),
      venue: g.venue,
      city: g.city,
      country: g.country,
      ticketUrl: g.ticketUrl || "",
      ticketPrice: g.ticketPrice || "",
      status: g.status,
      notes: g.notes || "",
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/gigs/${editing.id}` : "/api/admin/gigs";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Uloženie zlyhalo.");
      }
      toast.success(editing ? "Koncert upravený." : "Koncert pridaný.");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Naozaj zmazať tento koncert?")) return;
    try {
      const res = await fetch(`/api/admin/gigs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Zmazanie zlyhalo.");
      toast.success("Koncert zmazaný.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const statusCls: Record<string, string> = {
    upcoming: "border-neon-red text-neon-red",
    soldout: "border-warm-yellow text-warm-yellow",
    cancelled: "border-silver text-silver",
    past: "border-charcoal text-silver",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-off-white/70">
          Spravujte nadchádzajúce a odohrané koncerty.
        </p>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red"
        >
          <Plus className="h-4 w-4" />
          Pridať koncert
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-charcoal" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-charcoal bg-dark-gray/50 py-16 text-center">
          <CalendarDays className="h-10 w-10 text-silver/40" />
          <p className="mt-3 text-sm text-silver">Zatiaľ žiadne koncerty.</p>
        </div>
      ) : (
        <div className="max-h-[70vh] space-y-2 overflow-y-auto scroll-dora pr-1">
          {items.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-4 border border-charcoal bg-dark-gray p-4 transition-colors hover:border-off-white/20"
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center border border-charcoal bg-ink">
                <span className="font-display text-base font-black text-neon-red">
                  {new Date(g.date).toLocaleDateString("sk-SK", { day: "2-digit" })}
                </span>
                <span className="font-mono-brand text-[8px] uppercase text-warm-yellow">
                  {new Date(g.date).toLocaleDateString("sk-SK", { month: "short" }).replace(".", "")}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase", statusCls[g.status])}>
                    {statusLabel[g.status]}
                  </span>
                </div>
                <p className="mt-1 truncate font-semibold text-off-white">{g.title}</p>
                <p className="flex items-center gap-1.5 truncate text-xs text-off-white/60">
                  <MapPin className="h-3 w-3 text-warm-yellow" />
                  {g.venue}, {g.city} · {new Date(g.date).toLocaleString("sk-SK")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => setProjectGig(g)}
                  className="inline-flex h-8 w-8 items-center justify-center border border-charcoal text-silver transition-colors hover:border-warm-yellow hover:text-warm-yellow"
                  aria-label="Projekt koncertu"
                  title="Projekt koncertu"
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => openEdit(g)}
                  className="inline-flex h-8 w-8 items-center justify-center border border-charcoal text-silver transition-colors hover:border-neon-red hover:text-neon-red"
                  aria-label="Upraviť"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(g.id)}
                  className="inline-flex h-8 w-8 items-center justify-center border border-charcoal text-silver transition-colors hover:border-neon-red hover:text-neon-red"
                  aria-label="Zmazať"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur"
          onClick={() => setShowForm(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6 clip-corner-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-off-white">
                {editing ? "Upraviť koncert" : "Pridať koncert"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-silver hover:text-neon-red"
                aria-label="Zavrieť"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <FormField label="Názov *">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="admin-input"
                  placeholder="napr. Letný pivný festival 2026"
                />
              </FormField>
              <FormField label="Dátum a čas *">
                <input
                  required
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="admin-input"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Mesto *">
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="admin-input"
                  />
                </FormField>
                <FormField label="Krajina">
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="admin-input"
                  />
                </FormField>
              </div>
              <FormField label="Miesto / Venue *">
                <input
                  required
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="admin-input"
                  placeholder="napr. Hlavné pódium"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Cena lístka">
                  <input
                    value={form.ticketPrice}
                    onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
                    className="admin-input"
                    placeholder="napr. 10 EUR"
                  />
                </FormField>
                <FormField label="URL lístkov">
                  <input
                    value={form.ticketUrl}
                    onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })}
                    className="admin-input"
                    placeholder="https://..."
                  />
                </FormField>
              </div>
              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="admin-input"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Poznámky">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="admin-input resize-none"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-charcoal px-4 py-2.5 text-sm font-semibold text-off-white/80 hover:text-off-white"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-neon-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm hover:bg-deep-red disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Ukladám..." : "Uložiť"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gig Project modal */}
      {projectGig && (
        <GigProject gig={projectGig} onClose={() => setProjectGig(null)} onEdit={() => { setProjectGig(null); openEdit(projectGig); }} />
      )}

      <style jsx>{`
        :global(.admin-input) {
          width: 100%;
          border: 1px solid #2d2d2d;
          background-color: #0a0a0a;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #e8e8e8;
          outline: none;
          transition: border-color 0.2s;
        }
        :global(.admin-input:focus) {
          border-color: #e63946;
        }
      `}</style>
    </div>
  );
}

// =====================================================
// M2.5: GigProject — koncert ako mini-projekt
// =====================================================

function GigProject({ gig, onClose, onEdit }: { gig: Gig; onClose: () => void; onEdit: () => void }) {
  const [bookings, setBookings] = useState<Array<{ id: string; status: string; aiMatchScore: number | null; proposedFee: string | null; contact: { name: string; organization: string | null } | null }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; status: string; priority: string; dueDate: string | null; aiGenerated: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch bookings + tasks for this gig
    Promise.all([
      fetch("/api/admin/bookings").then(r => r.json()).catch(() => ({ items: [] })),
      fetch("/api/admin/tasks").then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([bData, tData]) => {
      setBookings((bData.items ?? []).filter((b: { gigId: string | null }) => b.gigId === gig.id));
      setTasks((tData.items ?? []).filter((t: { gigId: string | null }) => t.gigId === gig.id));
      setLoading(false);
    });
  }, [gig.id]);

  // Concert timeline (T-30 → T+14)
  const gigDate = new Date(gig.date);
  const now = new Date();
  const daysToGig = Math.ceil((gigDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const timeline = [
    { label: "T-30", desc: "Booking confirmed", done: daysToGig < -30 },
    { label: "T-21", desc: "Promo assets", done: daysToGig < -21 },
    { label: "T-14", desc: "Social campaign", done: daysToGig < -14 },
    { label: "T-10", desc: "Newsletter", done: daysToGig < -10 },
    { label: "T-7", desc: "Reminder", done: daysToGig < -7 },
    { label: "T-3", desc: "Technical confirmation", done: daysToGig < -3 },
    { label: "T-1", desc: "Final logistics", done: daysToGig < -1 },
    { label: "T0", desc: "Live mode", done: daysToGig <= 0 },
    { label: "T+1", desc: "Thank-you", done: daysToGig < -1 },
    { label: "T+7", desc: "Post-event analysis", done: daysToGig < -7 },
    { label: "T+14", desc: "Rebooking opportunity", done: daysToGig < -14 },
  ];

  const tasksDone = tasks.filter(t => t.status === "done").length;
  const tasksTotal = tasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scroll-dora border border-charcoal bg-dark-gray" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal bg-dark-gray px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-warm-yellow" />
              <span className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">
                GIG PROJECT
              </span>
            </div>
            <h3 className="mt-1 font-display text-lg font-bold text-off-white">{gig.title}</h3>
            <p className="text-xs text-silver">
              {gigDate.toLocaleDateString("sk-SK")} · {gig.venue}, {gig.city}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 border border-charcoal px-3 py-1.5 text-xs font-semibold text-off-white/80 hover:border-neon-red hover:text-neon-red">
              <Pencil className="h-3 w-3" /> Upraviť
            </button>
            <button onClick={onClose} className="text-silver hover:text-neon-red">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6"><Loader2 className="h-5 w-5 animate-spin text-neon-red" /></div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-charcoal bg-ink p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-warm-yellow" />
                  <span className="font-mono-brand text-[9px] uppercase text-silver">Bookings</span>
                </div>
                <p className="mt-1 font-display text-xl font-black text-off-white">{bookings.length}</p>
              </div>
              <div className="border border-charcoal bg-ink p-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-warm-yellow" />
                  <span className="font-mono-brand text-[9px] uppercase text-silver">Úlohy</span>
                </div>
                <p className="mt-1 font-display text-xl font-black text-off-white">
                  {tasksDone}<span className="text-sm text-silver">/{tasksTotal}</span>
                </p>
              </div>
              <div className="border border-charcoal bg-ink p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-warm-yellow" />
                  <span className="font-mono-brand text-[9px] uppercase text-silver">T-{daysToGig > 0 ? daysToGig : `+${Math.abs(daysToGig)}`}</span>
                </div>
                <p className="mt-1 font-display text-xl font-black text-off-white">
                  {daysToGig > 0 ? "dni" : "odohrané"}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="mb-3 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                {"// Koncertný timeline"}
              </p>
              <div className="space-y-1.5">
                {timeline.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-6 w-12 shrink-0 items-center justify-center font-mono-brand text-[9px] font-bold",
                      t.done ? "bg-green-500/20 text-green-400" : "bg-charcoal text-silver/50"
                    )}>
                      {t.label}
                    </span>
                    <span className={cn(
                      "flex-1 text-xs",
                      t.done ? "text-silver/50 line-through" : "text-off-white/80"
                    )}>
                      {t.desc}
                    </span>
                    {t.done && <CheckSquare className="h-3 w-3 text-green-400" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Bookings */}
            {bookings.length > 0 && (
              <div>
                <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                  {"// Booking pipeline"}
                </p>
                <div className="space-y-1.5">
                  {bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between border border-charcoal/50 bg-ink p-2">
                      <div>
                        <span className={cn(
                          "inline-block border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase",
                          b.status === "confirmed" ? "border-green-500/40 text-green-400" :
                          b.status === "cancelled" ? "border-neon-red/40 text-neon-red" :
                          "border-charcoal text-silver"
                        )}>
                          {b.status}
                        </span>
                        <span className="ml-2 text-xs text-off-white/80">
                          {b.contact?.name || "Neznámy"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.aiMatchScore !== null && (
                          <span className="font-mono-brand text-xs text-warm-yellow">
                            {Math.round(b.aiMatchScore)}%
                          </span>
                        )}
                        {b.proposedFee && (
                          <span className="flex items-center gap-1 text-xs text-off-white/60">
                            <DollarSign className="h-3 w-3 text-green-400" />
                            {b.proposedFee}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <div>
                <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                  {"// Úlohy"}
                </p>
                <div className="space-y-1.5">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 border border-charcoal/50 bg-ink p-2">
                      <span className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        t.status === "done" ? "bg-green-500" :
                        t.priority === "urgent" || t.priority === "high" ? "bg-neon-red" :
                        "bg-warm-yellow"
                      )} />
                      <span className={cn(
                        "flex-1 text-xs",
                        t.status === "done" ? "text-silver/50 line-through" : "text-off-white/80"
                      )}>
                        {t.title}
                      </span>
                      {t.aiGenerated && (
                        <span className="font-mono-brand text-[8px] uppercase text-warm-yellow/60">AI</span>
                      )}
                      {t.dueDate && (
                        <span className="font-mono-brand text-[9px] text-silver/60">
                          {new Date(t.dueDate).toLocaleDateString("sk-SK")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {gig.notes && (
              <div>
                <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                  {"// Poznámky"}
                </p>
                <div className="border border-charcoal/50 bg-ink p-3">
                  <p className="text-sm text-off-white/70">{gig.notes}</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {bookings.length === 0 && tasks.length === 0 && (
              <div className="border border-dashed border-charcoal py-8 text-center">
                <p className="text-sm text-silver/60">
                  Tento koncert zatiaľ nemá žiadne bookings ani úlohy.
                </p>
                <p className="mt-1 text-xs text-silver/40">
                  Vytvorte booking v Pipeline alebo úlohu v Úlohy a prepojte ich s týmto koncertom.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">{label}</span>
      {children}
    </label>
  );
}
