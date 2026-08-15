"use client";

import { useState } from "react";
import { MILESTONES, BAND } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

export function AboutSection({ bioLong }: { bioLong?: string }) {
  const [active, setActive] = useState(0);
  const bio = bioLong || BAND.bioLong;

  return (
    <section id="o-kapele" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="01"
            eyebrow="O kapele"
            title="História, identita a poslanie"
            description="Funky-punková formácia, ktorá spája generácie poslucháčov vášňou pre autentickú hudbu."
          />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Bio text */}
          <div className="space-y-6">
            <div className="border-l-2 border-neon-red pl-6">
              <p className="font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">
                D.O.R.A. — Dnes Od Rána Abstinujem
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold text-off-white sm:text-3xl">
                Tri desaťročia na scéne
              </h3>
            </div>

            <p className="text-base leading-relaxed text-off-white/80 sm:text-lg">{bio}</p>

            <div className="grid grid-cols-3 gap-px border border-charcoal bg-charcoal">
              {[
                { k: "Punk", v: "Energia" },
                { k: "Funk", v: "Groove" },
                { k: "Rap", v: "Crossover" },
              ].map((g) => (
                <div key={g.k} className="bg-dark-gray px-3 py-4 text-center">
                  <p className="font-display text-lg font-bold text-neon-red">{g.k}</p>
                  <p className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-silver">{g.v}</p>
                </div>
              ))}
            </div>

            <blockquote className="border border-charcoal bg-dark-gray/60 p-5">
              <p className="font-condensed text-lg italic text-off-white/90">
                „D.O.R.A. nie je len kapela – je to hnutie, ktoré spája generácie poslucháčov vášňou pre
                autentickú, energickú a spoločensky angažovanú hudbu."
              </p>
              <footer className="mt-3 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                — PR 2026, O kapele
              </footer>
            </blockquote>
          </div>

          {/* Interactive timeline */}
          <div>
            <p className="mb-4 font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">
              {"// Kľúčové míľniky"}
            </p>
            <div className="space-y-1">
              {MILESTONES.map((m, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={m.year}
                    onClick={() => setActive(i)}
                    className={cn(
                      "group flex w-full items-start gap-4 border-l-2 px-4 py-3 text-left transition-all",
                      isActive
                        ? "border-neon-red bg-dark-gray"
                        : "border-charcoal hover:border-warm-yellow/60 hover:bg-dark-gray/50"
                    )}
                  >
                    <span
                      className={cn(
                        "font-display text-xl font-extrabold tabular-nums transition-colors",
                        isActive ? "text-neon-red" : "text-silver group-hover:text-warm-yellow"
                      )}
                    >
                      {m.year}
                    </span>
                    <span className="flex-1">
                      <span
                        className={cn(
                          "block text-sm font-semibold transition-colors",
                          isActive ? "text-off-white" : "text-off-white/70"
                        )}
                      >
                        {m.title}
                      </span>
                      {isActive && (
                        <span className="mt-1 block text-sm text-off-white/70">{m.description}</span>
                      )}
                    </span>
                    {m.highlight && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warm-yellow glow-yellow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
