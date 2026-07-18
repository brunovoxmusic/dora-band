"use client";

import { useState, useEffect } from "react";
import { ArrowDown, Download, Play, Calendar } from "lucide-react";
import { BAND } from "@/lib/band-data";
import { useCountUp } from "@/hooks/use-count-up";

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Parallax: background moves slower than content (max 120px shift)
  const bgOffset = Math.min(scrollY * 0.35, 120);
  const contentOffset = Math.min(scrollY * 0.15, 60);
  const heroOpacity = Math.max(1 - scrollY / 600, 0);

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-ink">
      {/* Background band photo with parallax */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${bgOffset}px)` }}
      >
        <img
          src="/gallery/hero-banner.jpg"
          alt="D.O.R.A. naživo na koncertnom pódiu"
          className="h-[115%] w-full object-cover opacity-45"
        />
        {/* Dark gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/60 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-transparent" />
        {/* Stage grid texture */}
        <div className="absolute inset-0 bg-stage-grid opacity-40" />
      </div>

      {/* Neon-red geometric lines (brand manual accent) */}
      <div className="pointer-events-none absolute inset-0">
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
          fill="none"
          aria-hidden
        >
          {/* Diagonal accent lines */}
          <line x1="0" y1="180" x2="1440" y2="60" stroke="#E63946" strokeWidth="2" opacity="0.35" />
          <line x1="0" y1="220" x2="1440" y2="100" stroke="#E63946" strokeWidth="1" opacity="0.2" />
          {/* Corner brackets */}
          <path d="M40 120 L40 60 L120 60" stroke="#E63946" strokeWidth="3" fill="none" />
          <path d="M1400 780 L1400 840 L1320 840" stroke="#F4A300" strokeWidth="3" fill="none" />
          {/* Vertical barcode strips (punk feel) */}
          <g opacity="0.5">
            <rect x="60" y="700" width="4" height="120" fill="#E63946" />
            <rect x="68" y="720" width="2" height="80" fill="#F4A300" />
            <rect x="73" y="710" width="3" height="100" fill="#E63946" />
            <rect x="80" y="730" width="2" height="60" fill="#C0C0C0" />
          </g>
        </svg>
      </div>

      {/* Content */}
      <div
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pt-24 pb-16 sm:px-6 lg:px-8"
        style={{ transform: `translateY(${contentOffset}px)`, opacity: heroOpacity }}
      >
        {/* Live status pill */}
        <div className="mb-6 inline-flex w-fit items-center gap-2 border border-charcoal bg-dark-gray/80 px-3 py-1.5 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-live rounded-full bg-neon-red" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-red" />
          </span>
          <span className="font-mono-brand text-[10px] uppercase tracking-[0.3em] text-silver">
            Booking 2026 — otvorený
          </span>
        </div>

        {/* Title block */}
        <div className="max-w-4xl">
          <p className="font-mono-brand text-xs uppercase tracking-[0.4em] text-warm-yellow">
            Funky-Punk · Crossover · Púchov SK
          </p>
          <h1 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight text-off-white sm:text-7xl lg:text-8xl">
            <span className="glitch block text-neon-red text-glow-red" data-text="D.O.R.A.">D.O.R.A.</span>
            <span className="mt-2 block font-condensed text-2xl font-bold uppercase tracking-wide text-off-white sm:text-4xl lg:text-5xl">
              Dnes Od Rána Abstinujem
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-off-white/75 sm:text-xl">
            {BAND.tagline}{" "}
            <span className="text-off-white/55">
              Kapela aktívna od roku {BAND.founded} — viac ako dve dekády autentickej, energickej a
              spoločensky angažovanej hudby.
            </span>
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#kontakt"
            className="group inline-flex items-center justify-center gap-2 bg-neon-red px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white clip-corner-lg glow-red transition-all hover:bg-deep-red hover:glow-red"
          >
            <Calendar className="h-4 w-4" />
            Rezervovať koncert / Booking
          </a>
          <a
            href="#press"
            className="group inline-flex items-center justify-center gap-2 border border-charcoal bg-charcoal/40 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-off-white backdrop-blur transition-all hover:border-off-white/60 hover:bg-charcoal/60"
          >
            <Download className="h-4 w-4" />
            PR Materiály na stiahnutie
          </a>
        </div>

        {/* Stat strip */}
        <div className="mt-16 grid max-w-3xl grid-cols-2 gap-px border border-charcoal bg-charcoal sm:grid-cols-4">
          {[
            { k: "1996", v: "Založená" },
            { k: "30+", v: "Rokov na scéne" },
            { k: "3", v: "Nahrávky / Demá" },
            { k: "5", v: "Žánrov" },
          ].map((s) => (
            <StatCell key={s.v} value={s.k} label={s.v} />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#o-kapele"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-silver/60 transition-colors hover:text-neon-red sm:flex"
        aria-label="Posunúť nadol"
      >
        <span className="font-mono-brand text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </a>
    </section>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  const { ref, display } = useCountUp(value);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="bg-ink/90 px-4 py-4 backdrop-blur transition-colors hover:bg-charcoal/60">
      <p className="font-display text-2xl font-extrabold text-neon-red tabular-nums sm:text-3xl">{display}</p>
      <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">{label}</p>
    </div>
  );
}
