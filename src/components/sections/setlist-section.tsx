"use client";

import { useState, useMemo } from "react";
import { Music2, Clock, Flame, Play, ListMusic, Headphones } from "lucide-react";
import { SETLIST } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { Waveform } from "@/components/site/waveform";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "popular", "Funky-Punk", "Crossover", "Punk Rock", "Rap-Rock"] as const;

function parseDuration(d: string): number {
  const [m, s] = d.split(":").map(Number);
  return m * 60 + s;
}

function formatTotal(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SetlistSection() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return SETLIST;
    if (filter === "popular") return SETLIST.filter((t) => t.popular);
    return SETLIST.filter((t) => t.genre === filter);
  }, [filter]);

  const totalSeconds = useMemo(
    () => filtered.reduce((sum, t) => sum + parseDuration(t.duration), 0),
    [filtered]
  );

  const genreColor: Record<string, string> = {
    "Funky-Punk": "text-neon-red border-neon-red/40",
    Crossover: "text-warm-yellow border-warm-yellow/40",
    "Punk Rock": "text-neon-red border-neon-red/40",
    "Rap-Rock": "text-warm-yellow border-warm-yellow/40",
    Funk: "text-silver border-silver/40",
  };

  return (
    <section
      id="setlist"
      className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="09"
            eyebrow="Repertoár & Setlist"
            title="Typický koncertný set"
            description="Reprezentatívny výber skladieb z celého obdobia pôsobenia kapely. Set sa prispôsobuje typu podujatia a dĺžke vystúpenia."
            align="center"
          />
        </Reveal>

        {/* Summary stats */}
        <Reveal delay={100}>
          <div className="mt-8 grid grid-cols-3 gap-px border border-charcoal bg-charcoal">
            <div className="bg-ink px-4 py-4 text-center">
              <p className="font-display text-2xl font-black text-neon-red">{filtered.length}</p>
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-silver">Skladieb</p>
            </div>
            <div className="bg-ink px-4 py-4 text-center">
              <p className="font-display text-2xl font-black text-warm-yellow tabular-nums">
                {formatTotal(totalSeconds)}
              </p>
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-silver">Dĺžka setu</p>
            </div>
            <div className="bg-ink px-4 py-4 text-center">
              <p className="font-display text-2xl font-black text-off-white">
                {SETLIST.filter((t) => t.popular).length}
              </p>
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-silver">Hity</p>
            </div>
          </div>
        </Reveal>

        {/* Filters */}
        <Reveal delay={150}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all",
                  filter === f
                    ? "border-neon-red bg-neon-red text-white"
                    : "border-charcoal bg-ink text-silver hover:border-off-white/40 hover:text-off-white"
                )}
              >
                {f === "all" ? "Všetko" : f === "popular" ? "Hity" : f}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Tracklist */}
        <div className="mt-8 border border-charcoal bg-ink">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-charcoal bg-dark-gray px-4 py-3">
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-neon-red" />
              <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                {"// Setlist"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-brand text-[10px] text-silver">
              <Headphones className="h-3 w-3" />
              Živý set
            </div>
          </div>

          <ol className="divide-y divide-charcoal/50">
            {filtered.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-silver">
                Žiadne skladby v tejto kategórii.
              </li>
            ) : (
              filtered.map((t, i) => (
                <Reveal key={t.id} delay={Math.min(i * 40, 300)} direction="up">
                  <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-charcoal/30 sm:gap-4 sm:px-5">
                    {/* Track number */}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-charcoal font-mono-brand text-xs text-silver transition-colors group-hover:border-neon-red group-hover:text-neon-red">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Play icon (decorative) */}
                    <Play className="hidden h-3.5 w-3.5 shrink-0 fill-silver/40 text-silver/40 transition-colors group-hover:fill-neon-red group-hover:text-neon-red sm:block" />

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-display text-sm font-bold text-off-white sm:text-base">
                          {t.title}
                        </p>
                        {t.popular && (
                          <span className="inline-flex shrink-0 items-center gap-1 border border-warm-yellow/40 bg-warm-yellow/10 px-1.5 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider text-warm-yellow">
                            <Flame className="h-2.5 w-2.5" />
                            Hit
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={cn(
                            "border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider",
                            genreColor[t.genre] || "text-silver border-silver/40"
                          )}
                        >
                          {t.genre}
                        </span>
                        <span className="font-mono-brand text-[10px] text-silver/60">· {t.era}</span>
                      </div>
                    </div>

                    {/* Waveform mini (decorative, hover reveal) */}
                    <div className="hidden shrink-0 opacity-30 transition-opacity group-hover:opacity-100 md:block">
                      <Waveform bars={8} color={t.popular ? "warm-yellow" : "neon-red"} className="h-6" />
                    </div>

                    {/* Duration */}
                    <span className="flex shrink-0 items-center gap-1 font-mono-brand text-xs text-silver tabular-nums">
                      <Clock className="h-3 w-3" />
                      {t.duration}
                    </span>
                  </li>
                </Reveal>
              ))
            )}
          </ol>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-charcoal bg-dark-gray px-4 py-3 text-xs">
            <span className="flex items-center gap-1.5 text-silver">
              <Music2 className="h-3.5 w-3.5 text-neon-red" />
              Celkom {filtered.length} skladieb
            </span>
            <span className="font-mono-brand text-silver">≈ {formatTotal(totalSeconds)} min</span>
          </div>
        </div>

        {/* Note */}
        <Reveal delay={200}>
          <p className="mt-6 text-center text-xs text-silver/60">
            Setlist je reprezentatívny a môže sa líšiť podľa typu podujatia, dĺžky vystúpenia a aktuálneho
            repertoáru. Pre špecifické požiadavky nás{" "}
            <a href="#kontakt" className="font-semibold text-neon-red underline underline-offset-4 hover:text-warm-yellow">
              kontaktujte
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
