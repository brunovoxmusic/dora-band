"use client";

import { Disc, Music2, Languages, Calendar } from "lucide-react";
import { DISCOGRAPHY, GENRES } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";

export function DiscographySection() {
  return (
    <section
      id="diskografia"
      className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="04"
          eyebrow="Diskografia & žánre"
          title="Nahrávky a žánrové zaradenie"
          description="Pre kategorizáciu v festivalových systémoch, streamovacích platformách a mediálnych databázach."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-5 lg:gap-8">
          {/* Genre badges (technical specs layout) */}
          <div className="lg:col-span-2">
            <p className="mb-4 font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">
              {"// Žánrové zaradenie"}
            </p>
            <div className="space-y-2">
              {GENRES.map((g) => (
                <div
                  key={g.label}
                  className={`flex items-center justify-between border px-4 py-3 font-mono-brand text-sm ${
                    g.primary
                      ? "border-neon-red bg-neon-red/10 text-off-white glow-red-sm"
                      : "border-charcoal bg-ink text-off-white/80"
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-[0.2em] text-silver">{g.label}</span>
                  <span className={g.primary ? "font-bold text-neon-red" : "text-off-white"}>{g.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 border border-charcoal bg-ink p-4">
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.25em] text-silver">
                Oficiálne formáty názvu
              </p>
              <ul className="mt-3 space-y-2 text-xs text-off-white/70">
                <li className="flex justify-between gap-2">
                  <span className="text-silver">Plný názov</span>
                  <span className="font-mono-brand text-neon-red">D.O.R.A.</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-silver">S rozvitím</span>
                  <span className="text-right text-off-white">Dnes Od Rána Abstinujem</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-silver">Hashtag</span>
                  <span className="font-mono-brand text-warm-yellow">#DORAkapela</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Discography grid */}
          <div className="lg:col-span-3">
            <p className="mb-4 font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">
              {"// Diskografia"}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {DISCOGRAPHY.map((r) => (
                <article
                  key={r.title}
                  className="group relative flex flex-col border border-charcoal bg-ink p-5 transition-all hover:border-warm-yellow/50 clip-corner"
                >
                  {/* Vinyl disc graphic */}
                  <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-charcoal transition-transform duration-700 group-hover:rotate-180">
                      <div className="absolute inset-2 rounded-full border border-neon-red/30" />
                      <div className="absolute inset-4 rounded-full border border-charcoal" />
                      <div className="absolute inset-6 rounded-full border border-neon-red/20" />
                    </div>
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-neon-red">
                      <Disc className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3 text-neon-red" />
                    <span className="font-mono-brand font-bold text-neon-red">{r.year}</span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold leading-tight text-off-white">{r.title}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-off-white/60">
                    <p className="flex items-center gap-2">
                      <Music2 className="h-3 w-3 text-warm-yellow" />
                      <span className="font-mono-brand uppercase tracking-wide">{r.type}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Languages className="h-3 w-3 text-warm-yellow" />
                      {r.language}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {/* Table view for technical reference */}
            <div className="mt-6 overflow-x-auto scroll-dora">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal">
                    <th className="py-2 pr-4 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">Rok</th>
                    <th className="py-2 pr-4 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">Názov</th>
                    <th className="py-2 pr-4 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">Typ</th>
                    <th className="py-2 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">Jazyk</th>
                  </tr>
                </thead>
                <tbody>
                  {DISCOGRAPHY.map((r) => (
                    <tr key={r.title} className="border-b border-charcoal/50">
                      <td className="py-2 pr-4 font-mono-brand font-bold text-neon-red">{r.year}</td>
                      <td className="py-2 pr-4 font-semibold text-off-white">{r.title}</td>
                      <td className="py-2 pr-4 text-off-white/70">{r.type}</td>
                      <td className="py-2 text-off-white/70">{r.language}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
