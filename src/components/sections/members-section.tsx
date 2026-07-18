"use client";

import { MEMBERS } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { MicVocal, Guitar, Drum, Music2 } from "lucide-react";

function roleIcon(role: string) {
  const r = role.toLowerCase();
  if (r.includes("spev") || r.includes("vokál")) return MicVocal;
  if (r.includes("bice")) return Drum;
  if (r.includes("bas")) return Music2;
  if (r.includes("gitar")) return Guitar;
  return MicVocal;
}

export function MembersSection() {
  return (
    <section id="clenovia" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="02"
          eyebrow="Členovia kapely"
          title="Zostava na koncertnom pódiu"
          description="Kolektív hudobníkov, ktorých spája vášeň pre energickú, autentickú hudbu. Každý člen prináša jedinečný štýl a osobnosť."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MEMBERS.map((m, i) => {
            const Icon = roleIcon(m.role);
            return (
              <article
                key={m.name}
                className="group relative flex flex-col border border-charcoal bg-ink p-5 transition-all hover:border-neon-red/60 hover:bg-charcoal/40 clip-corner"
              >
                {/* Index marker */}
                <span className="absolute right-3 top-3 font-mono-brand text-[10px] text-silver/40">
                  0{i + 1}
                </span>

                {/* Avatar block with initials */}
                <div className="relative mb-4 flex h-20 w-20 items-center justify-center border border-charcoal bg-gradient-to-br from-charcoal to-ink">
                  <span className="font-display text-2xl font-black text-neon-red text-glow-red">
                    {m.initials}
                  </span>
                  <span className="absolute -bottom-px left-0 h-0.5 w-full bg-warm-yellow/0 transition-all group-hover:bg-warm-yellow" />
                </div>

                <h3 className="font-display text-base font-bold leading-tight text-off-white">{m.name}</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-warm-yellow" />
                  <span className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-warm-yellow">
                    {m.role}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-off-white/60">{m.bio}</p>

                {m.since !== "—" && (
                  <p className="mt-3 font-mono-brand text-[10px] uppercase tracking-[0.15em] text-silver/70">
                    Od {m.since}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
