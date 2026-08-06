"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Save, Loader2, RotateCcw, Search, FileText, Sparkles, Check, AlertCircle, Wand2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ContentEntry = {
  key: string;
  value: string;
  category: string;
  label: string;
  type: "text" | "textarea";
};

const CATEGORIES = [
  { value: "all", label: "Všetko" },
  { value: "hero", label: "Hero" },
  { value: "band", label: "O kapele" },
  { value: "contact", label: "Kontakt" },
  { value: "social", label: "Sociálne siete" },
  { value: "footer", label: "Footer" },
  { value: "seo", label: "SEO" },
] as const;

export function ContentTab() {
  const [items, setItems] = useState<ContentEntry[]>([]);
  const [original, setOriginal] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedAi, setExpandedAi] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setOriginal(d.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = items.some((i) => i.value !== original.find((o) => o.key === i.key)?.value);
  const dirtyCount = items.filter((i) => i.value !== original.find((o) => o.key === i.key)?.value).length;

  const update = (key: string, value: string) => {
    setItems((arr) => arr.map((i) => (i.key === key ? { ...i, value } : i)));
  };

  const reset = (key: string) => {
    const orig = original.find((o) => o.key === key);
    if (orig) update(key, orig.value);
  };

  const save = async () => {
    const changed = items
      .filter((i) => i.value !== original.find((o) => o.key === i.key)?.value)
      .map((i) => ({ key: i.key, value: i.value }));
    if (changed.length === 0) { toast.info("Žiadne zmeny."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: changed }) });
      if (!res.ok) throw new Error("Uloženie zlyhalo.");
      toast.success(`Uložených ${changed.length} položiek.`);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Chyba."); }
    finally { setSaving(false); }
  };

  const filtered = items.filter((i) => {
    if (filter !== "all" && i.category !== filter) return false;
    if (search && !i.label.toLowerCase().includes(search.toLowerCase()) && !i.key.includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-silver" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hľadať..." className="w-40 border border-charcoal bg-dark-gray py-2 pl-8 pr-2 text-xs text-off-white outline-none focus:border-neon-red sm:w-56" />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setFilter(c.value)} className={cn("border px-2.5 py-1.5 text-xs font-semibold transition-colors", filter === c.value ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white")}>{c.label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirtyCount > 0 && <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">{dirtyCount} neuložených</span>}
          <button onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Uložiť zmeny
          </button>
        </div>
      </div>

      {/* Content list with inline AI */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse bg-charcoal" />)}</div>
      ) : (
        <div className="max-h-[65vh] space-y-3 overflow-y-auto scroll-dora pr-1">
          {filtered.map((item) => {
            const isDirty = item.value !== original.find((o) => o.key === item.key)?.value;
            const showAi = expandedAi === item.key;
            return (
              <div key={item.key} className={cn("border bg-dark-gray p-4 transition-colors", isDirty ? "border-warm-yellow/50" : "border-charcoal")}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-neon-red" />
                    <span className="text-sm font-semibold text-off-white">{item.label}</span>
                    {isDirty && <span className="border border-warm-yellow/40 px-1.5 py-0.5 font-mono-brand text-[9px] uppercase text-warm-yellow">zmenené</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedAi(showAi ? null : item.key)}
                      className={cn("inline-flex items-center gap-1 border px-2 py-1 text-[10px] font-bold uppercase transition-colors", showAi ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:border-neon-red hover:text-neon-red")}
                      title="AI generovať pre toto pole"
                    >
                      <Wand2 className="h-3 w-3" />
                      AI
                      {showAi ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                    </button>
                    <span className="font-mono-brand text-[10px] text-silver/50">{item.key}</span>
                    {isDirty && <button onClick={() => reset(item.key)} className="text-silver hover:text-neon-red" title="Vrátiť"><RotateCcw className="h-3.5 w-3.5" /></button>}
                  </div>
                </div>

                {item.type === "textarea" ? (
                  <textarea value={item.value} onChange={(e) => update(item.key, e.target.value)} rows={4} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red scroll-dora" />
                ) : (
                  <input value={item.value} onChange={(e) => update(item.key, e.target.value)} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red" />
                )}

                <div className="mt-1 flex items-center justify-between">
                  {item.type === "textarea" && <span className="font-mono-brand text-[10px] text-silver/40">{item.value.length} znakov</span>}
                  <div className="ml-auto" />
                </div>

                {/* Inline AI panel */}
                {showAi && <InlineAIPanel item={item} onApply={(text) => { update(item.key, text); setExpandedAi(null); }} />}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-silver">Žiadne položky.</p>}
        </div>
      )}
    </div>
  );
}

/** Inline AI panel — generates content for a specific CMS field */
function InlineAIPanel({ item, onApply }: { item: ContentEntry; onApply: (text: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [instruction, setInstruction] = useState("");

  // Map CMS key to prompt type
  const keyToPromptType: Record<string, string> = {
    "hero.eyebrow": "hero-subtitle",
    "hero.title": "hero-headline",
    "hero.subtitle": "hero-subtitle",
    "hero.tagline": "about-section",
    "hero.ctaPrimary": "cta",
    "hero.ctaSecondary": "cta",
    "hero.statusPill": "custom",
    "band.bio": "biography",
    "band.bioLong": "biography",
    "seo.metaTitle": "seo-title",
    "seo.metaDescription": "seo-description",
    "seo.keywords": "meta-keywords",
  };

  const generate = async () => {
    setLoading(true); setVariants([]);
    try {
      const promptType = keyToPromptType[item.key] || "custom";
      const res = await fetch("/api/admin/ai/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: promptType, context: item.value, instruction: instruction || undefined }),
      });
      if (!res.ok) throw new Error("AI zlyhalo.");
      const d = await res.json();
      setVariants(d.variants || []);
      toast.success("3 varianty vygenerované.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Chyba."); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-3 border-t border-charcoal pt-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-neon-red" />
        <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">AI Generátor — 3 varianty</span>
      </div>
      <input
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Voliteľné inštrukcie (napr. zameraj sa na festival)... "
        className="mb-2 w-full border border-charcoal bg-ink px-3 py-1.5 text-xs text-off-white outline-none focus:border-neon-red"
      />
      <button onClick={generate} disabled={loading} className="mb-3 inline-flex items-center gap-1.5 bg-neon-red px-3 py-1.5 text-xs font-bold uppercase text-white disabled:opacity-50">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {loading ? "Generujem..." : "Vygenerovať 3 varianty"}
      </button>

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="border border-charcoal bg-ink p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono-brand text-[9px] uppercase text-warm-yellow">Variant {i + 1}</span>
                <button onClick={() => onApply(v)} className="inline-flex items-center gap-1 text-xs font-bold text-neon-red hover:underline">
                  <Check className="h-3 w-3" /> Použiť
                </button>
              </div>
              <p className="text-xs text-off-white/80 whitespace-pre-wrap">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
