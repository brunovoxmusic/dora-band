"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { NAV_LINKS } from "@/lib/band-data";
import { cn } from "@/lib/utils";
import { useSections, type SectionsMap } from "@/components/site/sections-provider";

/** Mapovanie NAV_LINKS href na SectionId pre visibility kontrolu */
const NAV_LINK_SECTION_MAP: Record<string, string> = {
  "#o-kapele": "about",
  "#clenovia": "members",
  "#hudba": "music",
  "#galeria": "gallery",
  "#diskografia": "discography",
  "#faq": "faq",
  "#kontakt": "contact",
};

export function Navbar({ bannerOffset = 0, sections: serverSections = null }: { bannerOffset?: number; sections?: SectionsMap }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Section visibility pochádza z React Contextu (server-side fetch v
  // root layout.tsx). Ak by bol explicitný prop (legacy), má prioritu.
  // Žiadny client-side fetch → žiadny FOUC.
  const ctxSections = useSections();
  const sections = serverSections ?? ctxSections;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** Skontroluje či je sekcia viditeľná */
  const isVisible = (href: string): boolean => {
    if (!sections) return true;
    const sectionId = NAV_LINK_SECTION_MAP[href];
    if (!sectionId) return true;
    return sections[sectionId] !== false;
  };

  const visibleLinks = NAV_LINKS.filter(link => isVisible(link.href));
  const showBookingButton = isVisible("#kontakt");

  return (
    <header
      style={{ top: bannerOffset }}
      className={cn(
        "fixed inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-ink/85 backdrop-blur-xl border-b border-charcoal/80"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="group flex items-center gap-3" aria-label="D.O.R.A. — domov">
          <img src="/dora-mark.svg" alt="" className="h-9 w-9" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-extrabold tracking-tight text-neon-red text-glow-red">
              D.O.R.A.
            </span>
            <span className="font-mono-brand text-[9px] uppercase tracking-[0.25em] text-silver">
              Funky-Punk · Púchov
            </span>
          </div>
        </a>

        {/* Desktop nav — iba viditeľné linky */}
        <nav className="hidden items-center gap-1 lg:flex">
          {visibleLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative px-3 py-2 text-sm font-medium text-off-white/80 transition-colors hover:text-off-white"
            >
              {link.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-neon-red transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {showBookingButton && (
            <a
              href="#kontakt"
              className="hidden items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red sm:inline-flex"
            >
              Booking
            </a>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center text-off-white lg:hidden"
            aria-label={open ? "Zavrieť menu" : "Otvoriť menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — iba viditeľné linky */}
      {open && (
        <div className="fixed inset-0 top-16 z-40 bg-ink/98 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4">
            {visibleLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-charcoal/50 py-4 text-base font-semibold text-off-white/90 transition-colors hover:text-neon-red"
              >
                <span>{link.label}</span>
                <ChevronRight className="h-4 w-4 text-silver/40" />
              </a>
            ))}
            {showBookingButton && (
              <a
                href="#kontakt"
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex items-center justify-center gap-2 bg-neon-red px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm"
              >
                Rezervovať koncert
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
