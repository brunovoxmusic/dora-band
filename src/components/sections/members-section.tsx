"use client";

import { useState, useEffect } from "react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { MicVocal, Guitar, Drum, Music2, Plus, Minus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  name: string;
  role: string;
  roleEn?: string | null;
  bio?: string | null;
  initials: string;
  since: string;
  photo?: string | null;
  order: number;
};

function roleIcon(role: string) {
  const r = role.toLowerCase();
  if (r.includes("spev") || r.includes("vokál") || r.includes("rap")) return MicVocal;
  if (r.includes("bice")) return Drum;
  if (r.includes("bas")) return Music2;
  if (r.includes("gitar")) return Guitar;
  return MicVocal;
}

export function MembersSection() {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => {
        setMembers(d.items || []);
        setLoading(false);
      })
      .catch(() => {
        setMembers([]);
        setLoading(false);
      });
  }, []);

  if (!loading && members.length === 0) return null;

  return (
    <section id="clenovia" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="02"
            eyebrow="Členovia kapely"
            title="Zostava na koncertnom pódiu"
            description="Kolektív hudobníkov, ktorých spája vášeň pre energickú, autentickú hudbu. Každý člen prináša jedinečný štýl a osobnosť."
          />
        </Reveal>

        {/* Full-width grid — 4 columns on desktop */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse border border-charcoal bg-ink/50" />
            ))
          ) : members.map((m, i) => {
            const Icon = roleIcon(m.role);
            const isOpen = expanded === i;
            return (
              <Reveal key={m.name} delay={i * 80} direction="up">
                <article
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden border bg-ink transition-all duration-300 clip-corner",
                    isOpen
                      ? "border-neon-red/60 glow-red-sm"
                      : "border-charcoal hover:border-neon-red/40"
                  )}
                >
                  {/* Photo — full-width, aspect ratio 3:4 */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-charcoal to-ink">
                    {m.photo ? (
                      <>
                        <img
                          src={m.photo}
                          alt={`${m.name} — ${m.role}`}
                          className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-display text-5xl font-black text-neon-red/30 text-glow-red">
                          {m.initials}
                        </span>
                      </div>
                    )}

                    {/* Index marker */}
                    <span className="absolute right-3 top-3 font-mono-brand text-[10px] text-off-white/50 mix-blend-difference">
                      0{i + 1}
                    </span>

                    {/* Role badge — bottom of photo */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-ink/95 to-transparent p-3 pt-8">
                      <span className="flex h-7 w-7 items-center justify-center border border-neon-red/40 bg-ink/80 text-neon-red backdrop-blur-sm">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-warm-yellow">
                        {m.role}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-display text-lg font-bold leading-tight text-off-white">
                      {m.name}
                    </h3>

                    {/* Since */}
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Calendar className="h-3 w-3 text-silver/50" />
                      <span className="font-mono-brand uppercase tracking-[0.15em] text-silver/70">
                        {m.since !== "—" ? `V kapele od ${m.since}` : "Hostujúci člen"}
                      </span>
                    </div>

                    {/* Expandable bio */}
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-out",
                        isOpen ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <p className="overflow-hidden text-xs leading-relaxed text-off-white/75">
                        {m.bio}
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-mono-brand uppercase tracking-wider text-silver transition-colors hover:text-neon-red"
                      aria-label={isOpen ? "Zavrieť bio" : "Otvoriť bio"}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <><Minus className="h-3 w-3" /> Zavrieť</>
                      ) : (
                        <><Plus className="h-3 w-3" /> Viac info</>
                      )}
                    </button>
                  </div>

                  {/* Bottom accent line on hover */}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-neon-red to-warm-yellow transition-transform duration-500 group-hover:scale-x-100" />
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom note */}
        <Reveal delay={300}>
          <div className="mt-10 flex items-center justify-center gap-3 border-t border-charcoal pt-6 text-center">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-red animate-pulse" />
            <p className="text-xs text-silver/60">
              Koncertná zostava D.O.R.A. — aktívna od roku 1996
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
