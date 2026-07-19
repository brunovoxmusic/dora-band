"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Loader2, CalendarDays, MapPin } from "lucide-react";
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">{label}</span>
      {children}
    </label>
  );
}
