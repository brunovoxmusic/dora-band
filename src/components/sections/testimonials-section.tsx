"use client";

import { useState, useEffect, useCallback } from "react";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((i) => (i + 1) % TESTIMONIALS.length), []);
  const prev = useCallback(() => setActive((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, next]);

  const current = TESTIMONIALS[active];

  return (
    <section
      id="recenzie"
      className="relative scroll-mt-20 overflow-hidden border-t border-charcoal bg-dark-gray py-20 sm:py-28"
    >
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 bg-stage-grid opacity-15" />
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-neon-red/8 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-warm-yellow/8 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="08"
            eyebrow="Recenzie & referencie"
            title="Čo o nás hovoria"
            description="Ohlasy organizátorov, novinárov a fanúšikov na vystúpenia D.O.R.A."
            align="center"
          />
        </Reveal>

        <Reveal delay={150}>
          <div
            className="relative mt-12 min-h-[18rem] sm:min-h-[16rem]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Large quote mark */}
            <Quote className="absolute -left-2 -top-6 h-16 w-16 text-neon-red/15 sm:-left-4 sm:h-20 sm:w-20" />

            {/* Slides */}
            <div className="relative">
              {TESTIMONIALS.map((t, i) => (
                <figure
                  key={i}
                  className={cn(
                    "absolute inset-0 flex flex-col transition-all duration-500",
                    i === active
                      ? "translate-x-0 opacity-100"
                      : i < active
                      ? "-translate-x-4 opacity-0"
                      : "translate-x-4 opacity-0"
                  )}
                  aria-hidden={i !== active}
                >
                  {/* Stars */}
                  <div className="mb-4 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-warm-yellow text-warm-yellow" />
                    ))}
                  </div>

                  <blockquote className="font-condensed text-xl font-medium leading-relaxed text-off-white sm:text-2xl">
                    „{t.quote}"
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center border border-neon-red/40 bg-ink">
                      <span className="font-display text-sm font-bold text-neon-red">
                        {t.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-off-white">{t.author}</p>
                      <p className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
                        {t.role}
                      </p>
                      <p className="font-mono-brand text-[10px] text-silver/60">{t.source}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="inline-flex h-10 w-10 items-center justify-center border border-charcoal bg-ink text-silver transition-colors hover:border-neon-red hover:text-neon-red"
            aria-label="Predchádzajúca recenzia"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  "h-2 transition-all",
                  i === active ? "w-8 bg-neon-red" : "w-2 bg-charcoal hover:bg-silver"
                )}
                aria-label={`Recenzia ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="inline-flex h-10 w-10 items-center justify-center border border-charcoal bg-ink text-silver transition-colors hover:border-neon-red hover:text-neon-red"
            aria-label="Ďalšia recenzia"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Counter */}
        <p className="mt-4 text-center font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver/60">
          {String(active + 1).padStart(2, "0")} / {String(TESTIMONIALS.length).padStart(2, "0")} ·{" "}
          {paused ? "pauza" : "autoplay"}
        </p>
      </div>
    </section>
  );
}
