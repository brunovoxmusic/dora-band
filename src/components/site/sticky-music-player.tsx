"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Music2, ChevronDown,
  ChevronUp, X, Volume2, Headphones, Disc3, Clock,
} from "lucide-react";
import { useMusicPlayer } from "@/lib/music-player-context";
import { TRACKS } from "@/lib/band-data";
import { cn } from "@/lib/utils";

/**
 * StickyMusicPlayer — fixed bottom bar, viditeľný od načítania stránky.
 *
 * FUNKCIE:
 * - Zobrazí sa hneď po načítaní (default visible)
 * - Fixed na spodku viewportu, vždy prístupný počas scrollovania
 * - Zdieľa state s hlavnou MusicSection cez MusicPlayerContext
 * - Na desktope: plný bar s track info + controls + expandovateľný tracklist
 * - Na mobile: kompaktný mini-bar, expandovateľný na full-screen tracklist
 * - Auto-hide keď je užívateľ v hlavnej MusicSection (vyhneme sa duplikácii)
 *   — ale len ak je prehrávač prázdny (nehrá). Ak hrá, zostane viditeľný.
 * - Collapsible (užívateľ ho môže zroluovať nahor)
 */

export function StickyMusicPlayer() {
  const { activeIdx, activeTrack, playing, select, togglePlay, next, prev } = useMusicPlayer();
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [inMusicSection, setInMusicSection] = useState(false);
  const [musicSectionVisible, setMusicSectionVisible] = useState(true); // default true
  const prevInMusicSection = useRef(false);

  // Fetch section visibility — ak je music sekcia skrytá, skry aj sticky player
  useEffect(() => {
    fetch("/api/sections")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.sections) {
          setMusicSectionVisible(d.sections.music !== false);
        }
      })
      .catch(() => {});
  }, []);

  // Sledujeme, či je viditeľná hlavná MusicSection — ak áno a prehrávač
  // nehrá, skryjeme sticky player (vyhneme sa duplikácii).
  // Používame scroll event + getBoundingClientRect (spoľahlivejšie ako IO
  // pre fixed-position elements v turbopack dev mode).
  useEffect(() => {
    let ticking = false;
    const check = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const section = document.getElementById("hudba");
        if (!section) {
          ticking = false;
          return;
        }
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        // Section je "viditeľná" ak aspoň 30% jej výšky je vo viewporte
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(vh, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const ratio = visibleHeight / rect.height;
        const isVisible = ratio > 0.25 || (rect.top < vh * 0.5 && rect.bottom > vh * 0.5);
        setInMusicSection(isVisible);
        ticking = false;
      });
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // Auto-collapse sticky player when entering music section (smooth UX)
  useEffect(() => {
    Promise.resolve().then(() => {
      if (inMusicSection && !prevInMusicSection.current && !playing) {
        setCollapsed(true);
      }
      // Auto-expand when leaving music section
      if (!inMusicSection && prevInMusicSection.current) {
        setCollapsed(false);
      }
      prevInMusicSection.current = inMusicSection;
    });
  }, [inMusicSection, playing]);

  // Hide body scroll when expanded on mobile
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [expanded]);

  // Ak je music sekcia skrytá v admin, nerenderuj sticky player vôbec
  if (!musicSectionVisible) return null;

  // Ak je collapsed a nie je v music section, stále ukáž mini-tlačidlo
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-neon-red/60 bg-ink/90 text-neon-red backdrop-blur-md shadow-lg transition-all hover:bg-neon-red hover:text-white"
        aria-label="Otvoriť prehrávač"
      >
        {playing ? <Volume2 className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
        {playing && (
          <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-neon-red" />
        )}
      </button>
    );
  }

  return (
    <>
      {/* Backdrop pre expanded mobile tracklist */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm lg:hidden"
          onClick={() => setExpanded(false)}
          aria-hidden
        />
      )}

      {/* Expanded tracklist panel (mobile full-screen, desktop dropdown) */}
      {expanded && (
        <div
          className={cn(
            "fixed z-50 bg-dark-gray border border-charcoal shadow-2xl",
            // Mobile: bottom sheet takmer full-screen
            "inset-x-0 bottom-0 top-16 lg:inset-x-auto lg:bottom-20 lg:top-auto lg:right-4 lg:w-96 lg:max-h-[28rem]",
            "flex flex-col"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-charcoal px-4 py-3">
            <div className="flex items-center gap-2">
              <Disc3 className="h-4 w-4 text-neon-red" />
              <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                Tracklist
              </span>
              <span className="font-mono-brand text-[10px] text-silver">· {TRACKS.length} skladieb</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="inline-flex h-8 w-8 items-center justify-center text-silver hover:text-neon-red"
              aria-label="Zavrieť tracklist"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Track list */}
          <ul className="flex-1 overflow-y-auto scroll-dora">
            {TRACKS.map((t, i) => {
              const isActive = i === activeIdx;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      select(i);
                      setExpanded(false);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 border-b border-charcoal/50 px-4 py-3 text-left transition-colors",
                      isActive ? "bg-neon-red/10" : "hover:bg-charcoal/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center font-mono-brand text-xs",
                        isActive
                          ? "bg-neon-red text-white"
                          : "border border-charcoal text-silver group-hover:border-off-white/40"
                      )}
                    >
                      {isActive && playing ? (
                        <span className="flex items-end gap-0.5">
                          <span className="h-2 w-0.5 animate-pulse bg-white" />
                          <span className="h-3 w-0.5 animate-pulse bg-white [animation-delay:150ms]" />
                          <span className="h-1.5 w-0.5 animate-pulse bg-white [animation-delay:300ms]" />
                        </span>
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-semibold", isActive ? "text-neon-red" : "text-off-white")}>
                        {t.title}
                      </p>
                      <p className="flex items-center gap-2 truncate font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                        <Music2 className="h-2.5 w-2.5 text-warm-yellow" />
                        {t.genre}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="flex items-center gap-1 font-mono-brand text-[10px] text-silver">
                        <Clock className="h-2.5 w-2.5" />
                        {t.duration}
                      </span>
                      <span className="font-mono-brand text-[10px] text-silver/70">{t.year}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sticky player bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-charcoal bg-ink/95 backdrop-blur-xl transition-all duration-300",
          // Hide when in music section AND not playing (avoid duplication)
          inMusicSection && !playing && !expanded && "translate-y-full opacity-0 pointer-events-none"
        )}
        role="region"
        aria-label="Prehrávač hudby"
        data-sticky-player
      >
        {/* Progress bar (decorative — nemáme real audio, takže len vizuál) */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-charcoal">
          <div
            className={cn("h-full bg-neon-red transition-opacity", playing ? "opacity-100" : "opacity-0")}
            style={{ width: playing ? "40%" : "0%" }}
          />
        </div>

        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-6 lg:px-8 sm:py-3">
          {/* Track info — always visible */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Track number badge */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-neon-red text-white sm:h-10 sm:w-10">
              {playing ? (
                <span className="flex items-end gap-0.5">
                  <span className="h-2 w-0.5 animate-pulse bg-white" />
                  <span className="h-3 w-0.5 animate-pulse bg-white [animation-delay:150ms]" />
                  <span className="h-1.5 w-0.5 animate-pulse bg-white [animation-delay:300ms]" />
                </span>
              ) : (
                <Music2 className="h-4 w-4" />
              )}
            </div>

            {/* Track title + genre */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-off-white">
                {activeTrack.title}
              </p>
              <p className="flex items-center gap-2 truncate font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                <span className="hidden sm:inline text-warm-yellow">{activeTrack.genre}</span>
                <span className="sm:hidden text-warm-yellow">{activeTrack.genre.split(" ")[0]}</span>
                <span className="text-silver/40">·</span>
                <span className="hidden sm:inline">{activeTrack.year}</span>
                <span className="text-silver/40 hidden sm:inline">·</span>
                <span className="font-bold text-warm-yellow">{activeTrack.duration}</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Previous — hidden na mobile pre úsporu miesta */}
            <button
              onClick={prev}
              className="hidden h-9 w-9 items-center justify-center text-silver transition-colors hover:text-off-white sm:inline-flex"
              aria-label="Predchádzajúca skladba"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Play/Pause — hlavné tlačidlo */}
            <button
              onClick={togglePlay}
              className="inline-flex h-10 w-10 items-center justify-center bg-neon-red text-white transition-colors hover:bg-deep-red sm:h-11 sm:w-11"
              aria-label={playing ? "Pauza" : "Prehrať"}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>

            {/* Next */}
            <button
              onClick={next}
              className="hidden h-9 w-9 items-center justify-center text-silver transition-colors hover:text-off-white sm:inline-flex"
              aria-label="Ďalšia skladba"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Tracklist toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center border border-charcoal text-silver transition-colors hover:border-neon-red hover:text-neon-red sm:h-10 sm:w-10"
              aria-label={expanded ? "Zavrieť tracklist" : "Otvoriť tracklist"}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            {/* Collapse button — hidden na mobile */}
            <button
              onClick={() => setCollapsed(true)}
              className="hidden h-9 w-9 items-center justify-center border border-charcoal text-silver transition-colors hover:border-neon-red hover:text-neon-red lg:inline-flex"
              aria-label="Zrolovať prehrávač"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
