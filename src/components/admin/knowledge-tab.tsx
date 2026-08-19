"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Brain, Plus, Trash2, X, Loader2, Search, Check, AlertCircle,
  ShieldCheck, Database,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

type KnowledgeItem = {
  id: string;
  category: string;
  key: string;
  value: string;
  source: string;
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = [
  { value: "all", label: "Všetko" },
  { value: "band_identity", label: "Identita kapely" },
  { value: "history", label: "História" },
  { value: "members", label: "Členovia" },
  { value: "songs", label: "Skladby" },
  { value: "releases", label: "Nahrávky" },
  { value: "events", label: "Eventy" },
  { value: "venues", label: "Kluby" },
  { value: "booking_rules", label: "Booking pravidlá" },
  { value: "technical_rider", label: "Tech rider" },
  { value: "pricing", label: "Ceny" },
  { value: "brand_voice", label: "Brand voice" },
  { value: "faqs", label: "FAQ" },
];

const SOURCE_LABELS: Record<string, string> = {
  band_archive: "Archív kapely",
  pr_document: "PR dokument",
  official_website: "Oficiálny web",
  ai_inferred: "AI odvodené",
  unverified: "Neoverené",
};

const SOURCE_COLORS: Record<string, string> = {
  band_archive: "text-green-400",
  pr_document: "text-sky-400",
  official_website: "text-cyan-400",
  ai_inferred: "text-warm-yellow",
  unverified: "text-neon-red",
};

export function KnowledgeTab() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/admin/knowledge?category=${filter}`)
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [filter]);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  const toggleVerified = async (item: KnowledgeItem) => {
    const verified = !item.verified;
    try {
      await fetch(`/api/admin/knowledge/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      setItems(arr => arr.map(i => i.id === item.id ? { ...i, verified } : i));
      toast.success(verified ? "Overené ✓" : "Označené ako neoverené");
    } catch { toast.error("Chyba."); }
  };

  const remove = async (id: string) => {
    if (!confirm("Zmazať túto položku?")) return;
    try {
      await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      setItems(arr => arr.filter(i => i.id !== id));
      toast.success("Zmazané.");
    } catch { toast.error("Chyba."); }
  };

  const filtered = items.filter(i =>
    !search ||
    i.key.toLowerCase().includes(search.toLowerCase()) ||
    i.value.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const verifiedCount = items.filter(i => i.verified).length;

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse bg-charcoal" />)}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Nepodarilo sa načítať knowledge base." onRetry={load} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-warm-yellow" />
          <div>
            <p className="text-sm font-bold text-off-white">Knowledge Base</p>
            <p className="text-xs text-silver">
              {items.length} faktov · {verifiedCount} overených · {items.length - verifiedCount} neoverených
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white"
        >
          <Plus className="h-4 w-4" /> Pridať fakt
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-silver" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hľadať fakty..."
            className="w-40 border border-charcoal bg-dark-gray py-2 pl-8 pr-2 text-xs text-off-white outline-none focus:border-neon-red sm:w-56"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={cn(
                "border px-2.5 py-1.5 text-xs font-semibold",
                filter === c.value ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Žiadne fakty"
          description="Pridajte overené informácie o kapele pre AI agentov. Každý fakt môže mať zdroj a stav overenia."
          action={{ label: "Pridať prvý fakt", onClick: () => { setEditing(null); setShowForm(true); } }}
        />
      ) : (
        <div className="max-h-[65vh] space-y-2 overflow-y-auto scroll-dora pr-1">
          {filtered.map(item => (
            <div key={item.id} className="border border-charcoal bg-dark-gray p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-brand text-[9px] uppercase tracking-wider text-warm-yellow">
                      {item.category}
                    </span>
                    <span className="text-xs text-silver/40">·</span>
                    <span className="text-xs text-silver/60">{item.key}</span>
                  </div>
                  <p className="mt-1 text-sm text-off-white/90">{item.value}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={cn(
                      "flex items-center gap-1 font-mono-brand text-[9px] uppercase",
                      SOURCE_COLORS[item.source] || "text-silver"
                    )}>
                      <Database className="h-2.5 w-2.5" />
                      {SOURCE_LABELS[item.source] || item.source}
                    </span>
                    {item.confidence > 0 && (
                      <span className="font-mono-brand text-[9px] text-silver/50">
                        confidence: {(item.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => toggleVerified(item)}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center border transition-colors",
                      item.verified
                        ? "border-green-500/40 bg-green-500/10 text-green-400"
                        : "border-charcoal text-silver hover:border-green-500 hover:text-green-400"
                    )}
                    title={item.verified ? "Overené — klikni pre zrušenie" : "Označiť ako overené"}
                  >
                    {item.verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => { setEditing(item); setShowForm(true); }}
                    className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    title="Upraviť"
                  >
                    <Plus className="h-3.5 w-3.5 rotate-45" />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    title="Zmazať"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <KnowledgeForm
          item={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function KnowledgeForm({ item, onClose, onSaved }: { item: KnowledgeItem | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    category: item?.category || "band_identity",
    key: item?.key || "",
    value: item?.value || "",
    source: item?.source || "unverified",
    verified: item?.verified || false,
    confidence: item?.confidence || 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.key || !form.value) { toast.error("Key a Value sú povinné."); return; }
    setSaving(true);
    try {
      const url = item ? `/api/admin/knowledge/${item.id}` : "/api/admin/knowledge";
      const method = item ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      toast.success(item ? "Fakt upravený." : "Fakt pridaný.");
      onSaved();
    } catch { toast.error("Chyba."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-off-white">
            {item ? "Upraviť fakt" : "Nový fakt"}
          </h3>
          <button onClick={onClose}><X className="h-5 w-5 text-silver" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Kategória</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white"
            >
              {CATEGORIES.filter(c => c.value !== "all").map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Kľúč *</label>
            <input
              value={form.key}
              onChange={e => setForm({ ...form, key: e.target.value })}
              className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white"
              placeholder="napr. founded_year"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Hodnota *</label>
            <textarea
              value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })}
              rows={3}
              className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white"
              placeholder="napr. Kapela D.O.R.A. bola založená v roku 1996 v Púchove."
            />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Zdroj</label>
            <select
              value={form.source}
              onChange={e => setForm({ ...form, source: e.target.value })}
              className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white"
            >
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={e => setForm({ ...form, verified: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm text-off-white/80">Overené</span>
          </label>
          <button
            onClick={save}
            disabled={saving || !form.key || !form.value}
            className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50"
          >
            {saving ? "Ukladám..." : "Uložiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
