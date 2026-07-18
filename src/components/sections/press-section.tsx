"use client";

import { useState } from "react";
import { Copy, Check, FileText, ImageIcon, Package, Shield, Download } from "lucide-react";
import { COPY_TEXTS } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DOWNLOADS = [
  {
    title: "Technická špecifikácia / Stageplan",
    desc: "Plotna, zvuk, osvetlenie, backstage požiadavky. Formát PDF.",
    type: "PDF",
    size: "—",
    icon: FileText,
    href: "#kontakt",
  },
  {
    title: "High-res fotografie kapely",
    desc: "Koncertné a portrétne zábery v tlačovej kvalite (300 DPI). ZIP archív.",
    type: "ZIP",
    size: "—",
    icon: ImageIcon,
    href: "#galeria",
  },
  {
    title: "Logo pack (vektor + PNG)",
    desc: "Oficiálne logo D.O.R.A. vo formátoch SVG, PNG a AI.",
    type: "SVG/PNG",
    size: "—",
    icon: Package,
    href: "/dora-logo.svg",
  },
] as const;

export function PressSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Text skopírovaný do schránky.");
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      toast.error("Nepodarilo sa skopírovať text.");
    }
  };

  const current = COPY_TEXTS[activeTab];

  return (
    <section id="press" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="05"
          eyebrow="Pre médiá a partnerov"
          title="Press Kit & Copy-texty"
          description="Pripravené propagačné texty a materiály na okamžité použitie pre tlačové správy, pozvánky a sociálne siete."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Copy text tabs */}
          <div className="lg:col-span-3">
            <div className="flex flex-wrap gap-1 border-b border-charcoal">
              {COPY_TEXTS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    "border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors sm:text-sm",
                    activeTab === i
                      ? "border-neon-red text-off-white"
                      : "border-transparent text-silver hover:text-off-white"
                  )}
                >
                  {c.tab}
                </button>
              ))}
            </div>

            <div className="mt-5 border border-charcoal bg-dark-gray p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-lg font-bold leading-snug text-warm-yellow">{current.title}</h3>
                <button
                  onClick={() => copy(`${current.title}\n\n${current.body}\n\n${current.footnote}`, "body")}
                  className="inline-flex shrink-0 items-center gap-1.5 border border-charcoal bg-ink px-3 py-1.5 text-xs font-semibold text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
                >
                  {copied === "body" ? <Check className="h-3.5 w-3.5 text-neon-red" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "body" ? "Skopírované" : "Kopírovať"}
                </button>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-off-white/85">{current.body}</p>

              <div className="mt-5 border-t border-charcoal pt-4">
                <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                  {"// Doplnkový text (kurzívou)"}
                </p>
                <p className="mt-2 text-xs italic leading-relaxed text-off-white/60">{current.footnote}</p>
                <button
                  onClick={() => copy(current.footnote, "foot")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-yellow hover:underline underline-offset-4"
                >
                  {copied === "foot" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "foot" ? "Skopírované" : "Kopírovať doplnok"}
                </button>
              </div>
            </div>
          </div>

          {/* Downloads grid */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-neon-red" />
              <p className="font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">
                {"// Stiahnutia"}
              </p>
            </div>
            <div className="space-y-3">
              {DOWNLOADS.map((d) => {
                const Icon = d.icon;
                return (
                  <a
                    key={d.title}
                    href={d.href}
                    target={d.href.startsWith("http") || d.href.endsWith(".svg") ? "_blank" : undefined}
                    className="group flex items-center gap-4 border border-charcoal bg-dark-gray p-4 transition-all hover:border-neon-red/60 hover:bg-charcoal/40 clip-corner"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-charcoal bg-ink text-neon-red transition-colors group-hover:border-neon-red">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-off-white">{d.title}</p>
                      <p className="mt-0.5 text-xs text-off-white/60">{d.desc}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
                          {d.type}
                        </span>
                        <span className="text-silver/40">·</span>
                        <span className="font-mono-brand text-[10px] text-silver">{d.size}</span>
                      </div>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-silver transition-colors group-hover:text-neon-red" />
                  </a>
                );
              })}
            </div>

            <div className="mt-4 border border-dashed border-charcoal bg-dark-gray/50 p-4 text-xs text-off-white/60">
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                {"// Licencia použitia"}
              </p>
              <p className="mt-2 leading-relaxed">
                Fotografie a texty môžu byť použité bez predchádzajúceho súhlasu pre PR a propagáciu, s
                podmienkou zachovania integrity obsahu a uvedenia zdroja{" "}
                <span className="text-warm-yellow">Foto: archív D.O.R.A.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
