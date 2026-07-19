"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Image as ImageIcon,
  Search,
  Wand2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type GenType = "bio" | "faq" | "copytext" | "metaDescription" | "metaTitle" | "socialPost" | "pressRelease";

const GEN_OPTIONS: { value: GenType; label: string; desc: string }[] = [
  { value: "bio", label: "Bio kapely", desc: "Krátky bio pre festivalový katalóg (80–120 slov)" },
  { value: "faq", label: "FAQ otázky", desc: "3 časté otázky a odpovede o kapele" },
  { value: "copytext", label: "Copy-text (pozvánka)", desc: "Propagačný text pre festivalovú pozvánku" },
  { value: "metaDescription", label: "SEO meta description", desc: "Krátky SEO popis (max 160 znakov)" },
  { value: "metaTitle", label: "SEO meta title", desc: "SEO nadpis (max 60 znakov)" },
  { value: "socialPost", label: "Príspevok na soc. siete", desc: "Facebook/Instagram príspevok s hashtagmi" },
  { value: "pressRelease", label: "Tlačová správa", desc: "Oznámenie vystúpenia na festivale" },
];

type AuditResult = {
  score: number;
  summary: string;
  strengths: string[];
  issues: Array<{ severity: string; area: string; problem: string; fix: string }>;
  recommendations: string[];
};

type MediaItem = { id: string; title: string; altText: string | null; category: string; thumbnailUrl: string | null; url: string };

export function AiTab() {
  const [activeTool, setActiveTool] = useState<"generate" | "alttext" | "audit">("generate");

  return (
    <div>
      {/* Tool tabs */}
      <div className="mb-4 inline-flex border border-charcoal bg-dark-gray p-1">
        {([
          { id: "generate", label: "Generovanie obsahu", icon: Wand2 },
          { id: "alttext", label: "Alt-text auto-gen", icon: ImageIcon },
          { id: "audit", label: "SEO audit", icon: Search },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all sm:px-4",
                activeTool === t.id ? "bg-neon-red text-white glow-red-sm" : "text-silver hover:text-off-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTool === "generate" && <GenerateTool />}
      {activeTool === "alttext" && <AltTextTool />}
      {activeTool === "audit" && <AuditTool />}
    </div>
  );
}

function GenerateTool() {
  const [type, setType] = useState<GenType>("bio");
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  // Map generation types to CMS keys (null = no direct apply)
  const TYPE_TO_CMS: Partial<Record<GenType, { key: string; label: string }>> = {
    bio: { key: "band.bio", label: "Krátky bio" },
    metaDescription: { key: "seo.metaDescription", label: "SEO meta description" },
    metaTitle: { key: "seo.metaTitle", label: "SEO meta title" },
    copytext: { key: "hero.tagline", label: "Hero tagline" },
  };

  const generate = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, instruction }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Generovanie zlyhalo.");
      setResult(d.text);
      toast.success("Obsah vygenerovaný.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success("Skopírované do schránky.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopírovanie zlyhalo.");
    }
  };

  const applyToCms = async () => {
    const mapping = TYPE_TO_CMS[type];
    if (!mapping || !result) return;
    setApplying(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ key: mapping.key, value: result }] }),
      });
      if (!res.ok) throw new Error("Uloženie zlyhalo.");
      toast.success(`Použité na CMS: ${mapping.label}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Input */}
      <div className="space-y-4">
        <div>
          <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
            {"// Typ obsahu"}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {GEN_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setType(o.value)}
                className={cn(
                  "border p-3 text-left transition-all",
                  type === o.value ? "border-neon-red bg-neon-red/10" : "border-charcoal bg-dark-gray hover:border-off-white/30"
                )}
              >
                <p className={cn("text-sm font-bold", type === o.value ? "text-neon-red" : "text-off-white")}>{o.label}</p>
                <p className="mt-0.5 text-xs text-silver">{o.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
            {"// Dodatočné inštrukcie (voliteľné)"}
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder="napr. Zameraj sa na letný festivalový kontext, spomeň Púchov..."
            className="w-full resize-y border border-charcoal bg-dark-gray px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red scroll-dora"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 bg-neon-red px-4 py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generujem..." : "Vygenerovať obsah"}
        </button>
      </div>

      {/* Result */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
            {"// Výsledok"}
          </p>
          {result && (
            <div className="flex items-center gap-3">
              {TYPE_TO_CMS[type] && (
                <button
                  onClick={applyToCms}
                  disabled={applying}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-yellow hover:text-neon-red disabled:opacity-50"
                >
                  {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Použiť na CMS
                </button>
              )}
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-red hover:text-warm-yellow"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Skopírované" : "Kopírovať"}
              </button>
            </div>
          )}
        </div>
        <div className="min-h-[16rem] border border-charcoal bg-dark-gray p-4">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-silver">
              <Loader2 className="h-6 w-6 animate-spin text-neon-red" />
              <p className="text-xs">AI generuje obsah...</p>
            </div>
          ) : result ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-off-white">{result}</p>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-silver/50">
              <Sparkles className="h-8 w-8" />
              <p className="text-xs">Vyberte typ obsahu a kliknite „Vygenerovať".</p>
            </div>
          )}
        </div>
        {result && (
          <p className="mt-2 font-mono-brand text-[10px] text-silver/50">
            {result.length} znakov · AI generovaný obsah — pred použitím skontrolujte.
          </p>
        )}
      </div>
    </div>
  );
}

function AltTextTool() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useState(() => {
    load();
  });

  const generateOne = async (id: string) => {
    setGenerating(id);
    try {
      const res = await fetch("/api/admin/ai/alttext", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: id, apply: false }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Zlyhalo.");
      setPreview((p) => ({ ...p, [id]: d.altText }));
      toast.success("Alt-text vygenerovaný.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setGenerating(null);
    }
  };

  const applyOne = async (id: string) => {
    const alt = preview[id];
    if (!alt) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: alt }),
      });
      if (!res.ok) throw new Error("Uloženie zlyhalo.");
      toast.success("Alt-text uložený.");
      setPreview((p) => ({ ...p, [id]: "" }));
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const generateMissing = async () => {
    const missing = items.filter((i) => !i.altText && !preview[i.id]);
    if (missing.length === 0) {
      toast.info("Žiadne obrázky bez alt-textu.");
      return;
    }
    toast.success(`Generujem alt-text pre ${missing.length} obrázkov...`);
    for (const m of missing) {
      await generateOne(m.id);
    }
  };

  const withoutAlt = items.filter((i) => !i.altText).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-off-white/80">
            <span className="font-bold text-neon-red">{withoutAlt}</span> z {items.length} obrázkov nemá alt-text
          </p>
          <p className="text-xs text-silver">AI (VLM) analyzuje obrázok a navrhne prístupný popis.</p>
        </div>
        <button
          onClick={generateMissing}
          disabled={withoutAlt === 0}
          className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm hover:bg-deep-red disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Vygenerovať všetky chýbajúce
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-charcoal" />
          ))}
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto scroll-dora pr-1">
          {items.map((m) => (
            <div key={m.id} className="flex items-start gap-3 border border-charcoal bg-dark-gray p-3">
              <img
                src={m.thumbnailUrl || m.url}
                alt={m.altText || m.title}
                className="h-14 w-14 shrink-0 border border-charcoal object-cover"
                onError={(e) => ((e.target as HTMLImageElement).src = "/dora-mark.svg")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-off-white">{m.title}</p>
                {m.altText ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-green-400">
                    <Check className="h-3 w-3" /> {m.altText}
                  </p>
                ) : preview[m.id] ? (
                  <div className="mt-1">
                    <p className="flex items-center gap-1.5 text-xs text-warm-yellow">
                      <AlertCircle className="h-3 w-3" /> Návrh: {preview[m.id]}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <button
                        onClick={() => applyOne(m.id)}
                        className="text-xs font-bold text-neon-red hover:underline"
                      >
                        Použiť
                      </button>
                      <button
                        onClick={() => generateOne(m.id)}
                        className="text-xs text-silver hover:text-off-white"
                      >
                        Znova
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-silver/50">Bez alt-textu</p>
                )}
              </div>
              <button
                onClick={() => generateOne(m.id)}
                disabled={generating === m.id}
                className="inline-flex h-8 w-8 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red disabled:opacity-50"
                aria-label="Vygenerovať alt-text"
              >
                {generating === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTool() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [stats, setStats] = useState<{ altCoveragePercent?: number; mediaTotal?: number; mediaWithoutAltCount?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setAudit(null);
    try {
      const res = await fetch("/api/admin/ai/seo-audit", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Audit zlyhal.");
      setAudit(d.audit);
      setStats(d.stats);
      toast.success("SEO audit dokončený.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setLoading(false);
    }
  };

  const sevColor: Record<string, string> = {
    high: "border-neon-red/50 text-neon-red",
    medium: "border-warm-yellow/50 text-warm-yellow",
    low: "border-silver/40 text-silver",
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-off-white/80">AI analyzuje obsah, SEO meta a alt-text coverage.</p>
          <p className="text-xs text-silver">Dostanete skóre, silné stránky, problémy a odporúčania.</p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm hover:bg-deep-red disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Analyzujem..." : audit ? "Zopakovať audit" : "Spustiť SEO audit"}
        </button>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="mb-4 grid grid-cols-3 gap-px border border-charcoal bg-charcoal">
          <div className="bg-ink px-4 py-3 text-center">
            <p className="font-display text-xl font-black text-off-white">{stats.mediaTotal ?? 0}</p>
            <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">Obrázkov</p>
          </div>
          <div className="bg-ink px-4 py-3 text-center">
            <p className="font-display text-xl font-black text-warm-yellow">{stats.mediaWithoutAltCount ?? 0}</p>
            <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">Bez alt-textu</p>
          </div>
          <div className="bg-ink px-4 py-3 text-center">
            <p className="font-display text-xl font-black text-green-400">{stats.altCoveragePercent ?? 0}%</p>
            <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">Alt coverage</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-silver">
          <Loader2 className="h-6 w-6 animate-spin text-neon-red" />
          <p className="text-xs">AI analyzuje SEO...</p>
        </div>
      ) : audit ? (
        <div className="space-y-4">
          {/* Score */}
          <div className="border border-charcoal bg-dark-gray p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#2D2D2D" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={audit.score >= 70 ? "#4ade80" : audit.score >= 40 ? "#F4A300" : "#E63946"}
                    strokeWidth="6"
                    strokeDasharray={`${(audit.score / 100) * 213.6} 213.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-display text-2xl font-black text-off-white">{audit.score}</span>
              </div>
              <div className="flex-1">
                <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">SEO skóre</p>
                <p className="text-sm text-off-white/80">{audit.summary}</p>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {audit.strengths?.length > 0 && (
            <div className="border border-green-500/30 bg-green-500/5 p-4">
              <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-green-400">Silné stránky</p>
              <ul className="space-y-1">
                {audit.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-off-white/80">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-400" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {audit.issues?.length > 0 && (
            <div className="border border-charcoal bg-dark-gray p-4">
              <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">Problémy</p>
              <div className="space-y-3">
                {audit.issues.map((iss, i) => (
                  <div key={i} className={cn("border-l-2 pl-3", sevColor[iss.severity] || sevColor.low)}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-brand text-[10px] uppercase tracking-wider">{iss.severity}</span>
                      <span className="text-xs font-bold text-off-white">{iss.area}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-off-white/70">{iss.problem}</p>
                    <p className="mt-1 text-xs text-warm-yellow">→ {iss.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {audit.recommendations?.length > 0 && (
            <div className="border border-neon-red/30 bg-neon-red/5 p-4">
              <p className="mb-2 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-neon-red">Odporúčania</p>
              <ol className="space-y-1">
                {audit.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-off-white/80">
                    <span className="font-mono-brand font-bold text-neon-red">{i + 1}.</span> {r}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-silver/50">
          <Search className="h-8 w-8" />
          <p className="text-xs">Kliknite „Spustiť SEO audit" pre AI analýzu.</p>
        </div>
      )}
    </div>
  );
}
