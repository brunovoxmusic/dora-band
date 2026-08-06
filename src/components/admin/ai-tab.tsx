"use client";

import { useState } from "react";
import { Sparkles, Search, Tags, Image as ImageIcon, Wand2 } from "lucide-react";
import { AIContentGenerator } from "@/components/admin/AIContentGenerator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tool = "generate" | "alttext" | "audit" | "keywords";

export function AiTab() {
  const [activeTool, setActiveTool] = useState<Tool>("generate");

  return (
    <div>
      <div className="mb-4 inline-flex flex-wrap border border-charcoal bg-dark-gray p-1">
        {([
          { id: "generate", label: "Generovanie obsahu", icon: Wand2 },
          { id: "alttext", label: "Alt-text auto-gen", icon: ImageIcon },
          { id: "audit", label: "SEO audit", icon: Search },
          { id: "keywords", label: "Kľúčové slová", icon: Tags },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all sm:px-4",
                activeTool === t.id ? "bg-neon-red text-white" : "text-silver hover:text-off-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTool === "generate" && (
        <AIContentGenerator
          onInsert={(text) => {
            navigator.clipboard.writeText(text);
            toast.success("Obsah skopírovaný do schránky.");
          }}
        />
      )}
      {activeTool === "alttext" && <AltTextTool />}
      {activeTool === "audit" && <AuditTool />}
      {activeTool === "keywords" && <KeywordsTool />}
    </div>
  );
}

/**
 * AltTextTool — generates alt text for images using the new /api/admin/ai endpoint.
 */
function AltTextTool() {
  const [items, setItems] = useState<Array<{ id: string; title: string; altText: string | null; category: string; thumbnailUrl: string | null; url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useState(() => {
    setLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  });

  const generateOne = async (id: string) => {
    setGenerating(id);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "custom", instruction: "Vygeneruj krátky alt-text (max 20 slov) v slovenčine pre obrázok z galérie kapely D.O.R.A." }),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream nedostupný.");
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      // Apply to media item
      await fetch(`/api/admin/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: text.trim() }),
      });
      setItems((arr) => arr.map((i) => (i.id === id ? { ...i, altText: text.trim() } : i)));
      toast.success("Alt-text vygenerovaný.");
    } catch {
      toast.error("Chyba.");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return <div className="h-32 animate-pulse bg-charcoal" />;
  const withoutAlt = items.filter((i) => !i.altText).length;

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-off-white/80"><span className="font-bold text-neon-red">{withoutAlt}</span> z {items.length} obrázkov nemá alt-text</p>
        <button
          onClick={() => items.filter((i) => !i.altText).forEach((m) => generateOne(m.id))}
          disabled={withoutAlt === 0}
          className="mt-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white disabled:opacity-50"
        >
          Vygenerovať všetky chýbajúce
        </button>
      </div>
      <div className="max-h-[60vh] space-y-2 overflow-y-auto scroll-dora">
        {items.map((m) => (
          <div key={m.id} className="flex items-start gap-3 border border-charcoal bg-dark-gray p-3">
            <img src={m.thumbnailUrl || m.url} alt={m.altText || m.title} className="h-14 w-14 border border-charcoal object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/dora-mark.svg"; }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-off-white">{m.title}</p>
              {m.altText ? <p className="text-xs text-green-400">{m.altText}</p> : <p className="text-xs text-silver/50">Bez alt-textu</p>}
            </div>
            <button onClick={() => generateOne(m.id)} disabled={generating === m.id} className="border border-charcoal px-3 py-1.5 text-xs text-silver hover:border-neon-red hover:text-neon-red disabled:opacity-50">
              {generating === m.id ? "..." : "Gen"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AuditTool — SEO audit using /api/admin/ai
 */
function AuditTool() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setResult("");
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "custom", instruction: "Vykonaj SEO audit webstránky kapely D.O.R.A. Vráť skóre (0-100), silné stránky, problémy a odporúčania v slovenčine." }),
      });
      if (!res.ok) throw new Error("Audit zlyhal.");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream nedostupný.");
      const decoder = new TextDecoder();
      let text = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); setResult(text); }
    } catch { toast.error("Chyba."); } finally { setLoading(false); }
  };

  return (
    <div>
      <button onClick={run} disabled={loading} className="bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white disabled:opacity-50">
        {loading ? "Analyzujem..." : "Spustiť SEO audit"}
      </button>
      {loading && !result && <div className="mt-4 text-silver">AI analyzuje...</div>}
      {result && <pre className="mt-4 max-h-[60vh] overflow-auto scroll-dora whitespace-pre-wrap text-sm text-off-white">{result}</pre>}
    </div>
  );
}

/**
 * KeywordsTool — keyword research using /api/admin/ai
 */
function KeywordsTool() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setResult("");
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "meta-keywords", instruction: "Navrhni kľúčové slová pre SEO — primárne, sekundárne, long-tail, lokálne." }),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream nedostupný.");
      const decoder = new TextDecoder();
      let text = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); setResult(text); }
    } catch { toast.error("Chyba."); } finally { setLoading(false); }
  };

  return (
    <div>
      <button onClick={run} disabled={loading} className="bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white disabled:opacity-50">
        {loading ? "Analyzujem..." : "Vygenerovať kľúčové slová"}
      </button>
      {result && (
        <div className="mt-4">
          <pre className="max-h-[60vh] overflow-auto scroll-dora whitespace-pre-wrap text-sm text-off-white">{result}</pre>
          <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Skopírované."); }} className="mt-2 border border-charcoal px-3 py-1.5 text-xs text-silver hover:text-neon-red">Kopírovať</button>
        </div>
      )}
    </div>
  );
}
