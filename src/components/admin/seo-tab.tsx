"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Save, Trash2, Loader2, Globe, Search, Code2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SeoMeta = {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogImage: string | null;
  noindex: boolean;
};

const DEFAULT_PATHS = ["/", "/archiv", "/admin"];

export function SeoTab() {
  const [items, setItems] = useState<SeoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [showJsonLd, setShowJsonLd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/seo")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id: string, patch: Partial<SeoMeta>) => {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const addPath = async () => {
    const path = newPath.trim();
    if (!path) return;
    if (items.some((i) => i.path === path)) {
      toast.error("Táto cesta už existuje.");
      return;
    }
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, title: "", description: "", keywords: "", ogImage: "", noindex: false }),
      });
      if (!res.ok) throw new Error("Pridanie zlyhalo.");
      toast.success("SEO meta pridané.");
      setNewPath("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const save = async (item: SeoMeta) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Uloženie zlyhalo.");
      toast.success(`SEO meta pre "${item.path}" uložené.`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, path: string) => {
    if (!confirm(`Naozaj zmazať SEO meta pre "${path}"?`)) return;
    // There's no DELETE endpoint; we set all fields to null + noindex false via upsert
    // Simpler: just clear values
    try {
      await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, title: "", description: "", keywords: "", ogImage: "", noindex: false }),
      });
      toast.success("SEO meta vymazané.");
      load();
    } catch {
      toast.error("Chyba.");
    }
  };

  const titleLen = (s: string | null) => (s || "").length;
  const descLen = (s: string | null) => (s || "").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-off-white">SEO meta dáta</h3>
          <p className="text-xs text-silver">Spravujte meta title, description, kľúčové slová a noindex pre jednotlivé cesty.</p>
        </div>
        <button
          onClick={() => setShowJsonLd((v) => !v)}
          className="inline-flex items-center gap-2 border border-charcoal bg-dark-gray px-3 py-2 text-xs font-bold uppercase tracking-wide text-silver transition-colors hover:border-neon-red hover:text-neon-red"
        >
          <Code2 className="h-3.5 w-3.5" />
          JSON-LD
        </button>
      </div>

      {/* JSON-LD preview */}
      {showJsonLd && (
        <div className="mb-4 border border-charcoal bg-ink p-4">
          <p className="mb-2 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">
            {"// Štruktúrované dáta (JSON-LD)"}
          </p>
          <pre className="max-h-60 overflow-auto scroll-dora text-[11px] leading-relaxed text-off-white/80">
{`{
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  "name": "D.O.R.A.",
  "alternateName": "Dnes Od Rána Abstinujem",
  "foundingDate": "1996",
  "foundingLocation": "Púchov, SK",
  "genre": ["Funky-Punk", "Crossover", "Punk Rock", "Rap-Rock", "Slovenský punk"],
  "member": [ ... 6 členov ... ],
  "album": [ ... 3 nahrávky ... ],
  "contactPoint": { "email": "branislav.guzma@gmail.com", "telephone": "+421907630206" }
}`}
          </pre>
        </div>
      )}

      {/* Add new path */}
      <div className="mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-silver" />
        <input
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPath()}
          placeholder="/nova-cesta"
          className="flex-1 border border-charcoal bg-dark-gray px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red"
        />
        <button
          onClick={addPath}
          className="inline-flex items-center gap-1.5 border border-warm-yellow/40 px-3 py-2 text-xs font-bold uppercase tracking-wide text-warm-yellow hover:bg-warm-yellow hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          Pridať cestu
        </button>
      </div>

      {/* SEO meta cards */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-charcoal" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="border border-dashed border-charcoal bg-dark-gray/50 p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-silver/40" />
              <p className="mt-3 text-sm text-silver">Žiadne SEO meta. Pridajte cestu vyššie.</p>
            </div>
          )}
          {items.map((item) => (
            <div key={item.id} className="border border-charcoal bg-dark-gray p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-neon-red" />
                  <span className="font-mono-brand text-sm font-bold text-off-white">{item.path}</span>
                  {item.noindex && (
                    <span className="border border-silver/40 px-1.5 py-0.5 font-mono-brand text-[9px] uppercase text-silver">
                      noindex
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => save(item)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 bg-neon-red px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-deep-red disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Uložiť
                  </button>
                  <button
                    onClick={() => remove(item.id, item.path)}
                    className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    aria-label="Vymazať"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SeoField
                  label="Meta title"
                  value={item.title || ""}
                  onChange={(v) => update(item.id, { title: v })}
                  max={60}
                />
                <SeoField
                  label="Keywords"
                  value={item.keywords || ""}
                  onChange={(v) => update(item.id, { keywords: v })}
                />
              </div>
              <div className="mt-3">
                <SeoField
                  label="Meta description"
                  value={item.description || ""}
                  onChange={(v) => update(item.id, { description: v })}
                  max={160}
                  textarea
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <SeoField
                  label="OG Image URL"
                  value={item.ogImage || ""}
                  onChange={(v) => update(item.id, { ogImage: v })}
                />
                <label className="flex items-center gap-2 text-xs text-off-white/80">
                  <input
                    type="checkbox"
                    checked={item.noindex}
                    onChange={(e) => update(item.id, { noindex: e.target.checked })}
                    className="h-4 w-4 accent-[#E63946]"
                  />
                  noindex
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEO checklist */}
      <div className="mt-6 border border-charcoal bg-ink p-4">
        <p className="mb-3 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
          {"// SEO kontrolný zoznam"}
        </p>
        <ul className="space-y-2 text-xs text-off-white/80">
          <ChecklistItem ok label="Meta title (50–60 znakov ideálne)" />
          <ChecklistItem ok label="Meta description (120–160 znakov)" />
          <ChecklistItem ok label="Open Graph image (1200×630)" />
          <ChecklistItem ok label="JSON-LD štruktúrované dáta (MusicGroup)" />
          <ChecklistItem ok label="Sitemap.xml generovaný dynamicky" />
          <ChecklistItem ok label="Robots.txt (disallow /admin)" />
          <ChecklistItem ok label="Alt texty na obrázkoch (AI auto-generácia)" />
          <ChecklistItem ok label="Canonical URL" />
          <ChecklistItem ok label="Slovenský lang atribút (sk)" />
        </ul>
      </div>
    </div>
  );
}

function SeoField({
  label,
  value,
  onChange,
  max,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  textarea?: boolean;
}) {
  const len = value.length;
  const over = max ? len > max : false;
  const warn = max ? len > max * 0.9 && len <= max : false;
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between">
        <span className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">{label}</span>
        {max && (
          <span className={cn("font-mono-brand text-[10px]", over ? "text-neon-red" : warn ? "text-warm-yellow" : "text-silver/50")}>
            {len}/{max}
          </span>
        )}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red scroll-dora"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red"
        />
      )}
    </label>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-neon-red" />}
      <span className={ok ? "text-off-white/80" : "text-neon-red"}>{label}</span>
    </li>
  );
}
