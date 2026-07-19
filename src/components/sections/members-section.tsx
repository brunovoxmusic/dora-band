"use client";

import { useState } from "react";
import { MEMBERS } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { MicVocal, Guitar, Drum, Music2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function roleIcon(role: string) {
  const r = role.toLowerCase();
  if (r.includes("spev") || r.includes("vokál")) return MicVocal;
  if (r.includes("bice")) return Drum;
  if (r.includes("bas")) return Music2;
  if (r.includes("gitar")) return Guitar;
  return MicVocal;
}

export function MembersSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section id="clenovia" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="02"
            eyebrow="Členovia kapely"
            title="Zostava na koncertnom pódiu"
            description="Kolektív hudobníkov, ktorých spája vášeň pre energickú, autentickú hudbu. Každý člen prináša jedinečný štýl a osobnosť."
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MEMBERS.map((m, i) => {
            const Icon = roleIcon(m.role);
            const isOpen = expanded === i;
            return (
              <Reveal key={m.name} delay={i * 60} direction="up">
                <article
                  className={cn(
                    "group relative flex h-full flex-col border bg-ink transition-all duration-300 clip-corner",
                    isOpen
                      ? "border-neon-red glow-red-sm"
                      : "border-charcoal hover:border-neon-red/60 hover:bg-charcoal/30"
                  )}
                >
                  {/* Index marker */}
                  <span className="absolute right-3 top-3 font-mono-brand text-[10px] text-silver/40">
                    0{i + 1}
                  </span>

                  {/* Avatar block with initials — scale on hover */}
                  <div className="relative mb-4 mt-1 flex h-20 w-20 items-center justify-center border border-charcoal bg-gradient-to-br from-charcoal to-ink transition-transform duration-300 group-hover:scale-105">
                    <span className="font-display text-2xl font-black text-neon-red text-glow-red">
                      {m.initials}
                    </span>
                    {/* Rotating ring on hover */}
                    <span className="pointer-events-none absolute -inset-1 border border-neon-red/0 transition-all duration-500 group-hover:-inset-1.5 group-hover:border-neon-red/30 group-hover:rotate-45" />
                  </div>

                  <h3 className="font-display text-base font-bold leading-tight text-off-white">{m.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-warm-yellow" />
                    <span className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-warm-yellow">
                      {m.role}
                    </span>
                  </div>

                  {/* Expandable bio */}
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <p className="overflow-hidden text-xs leading-relaxed text-off-white/75">{m.bio}</p>
                  </div>

                  {/* Footer: since + toggle */}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    {m.since !== "—" ? (
                      <span className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-silver/70">
                        Od {m.since}
                      </span>
                    ) : (
                      <span className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-silver/40">
                        Hostujúci
                      </span>
                    )}
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="inline-flex h-6 w-6 items-center justify-center border border-charcoal text-silver transition-colors hover:border-neon-red hover:text-neon-red"
                      aria-label={isOpen ? "Zavrieť bio" : "Otvoriť bio"}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Bottom accent line on hover */}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-neon-red to-warm-yellow transition-transform duration-500 group-hover:scale-x-100" />
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
