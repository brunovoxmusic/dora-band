"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { TRACKS } from "@/lib/band-data";

/**
 * Music Player Context — zdieľaný state medzi hlavnou MusicSection
 * a StickyMusicPlayer komponentom.
 *
 * Umožňuje:
 * - Hlavná sekcia vyberá skladbu → sticky player ukáže rovnakú skladbu
 * - Sticky player prepne skladbu → hlavná sekcia sa synchronizuje
 * - Play/pause state je zdieľaný
 */

type MusicPlayerState = {
  /** Index aktívnej skladby v TRACKS poli */
  activeIdx: number;
  /** Aktuálna skladba */
  activeTrack: typeof TRACKS[number];
  /** Či prehrávač hrá */
  playing: boolean;
  /** Či bol prehrávač už niekdy aktivovaný (pre sticky player show/hide) */
  hasInteracted: boolean;
  /** Vybrať skladbu podľa indexu */
  select: (i: number) => void;
  /** Prepnúť play/pause */
  togglePlay: () => void;
  /** Ďalšia skladba */
  next: () => void;
  /** Predchádzajúca skladba */
  prev: () => void;
  /** Nastaviť playing stav (pre hlavnú sekciu keď užívateľ klikne na video) */
  setPlaying: (p: boolean) => void;
};

const MusicPlayerContext = createContext<MusicPlayerState | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlayingState] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const activeTrack = TRACKS[activeIdx] ?? TRACKS[0];

  const select = useCallback((i: number) => {
    setActiveIdx(i);
    setPlayingState(true);
    setHasInteracted(true);
  }, []);

  const togglePlay = useCallback(() => {
    setPlayingState((p) => !p);
    setHasInteracted(true);
  }, []);

  const setPlaying = useCallback((p: boolean) => {
    setPlayingState(p);
    if (p) setHasInteracted(true);
  }, []);

  const next = useCallback(() => {
    setActiveIdx((i) => (i + 1) % TRACKS.length);
    setPlayingState(true);
    setHasInteracted(true);
  }, []);

  const prev = useCallback(() => {
    setActiveIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
    setPlayingState(true);
    setHasInteracted(true);
  }, []);

  const value: MusicPlayerState = {
    activeIdx,
    activeTrack,
    playing,
    hasInteracted,
    select,
    togglePlay,
    next,
    prev,
    setPlaying,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer musí byť použitý vnútri MusicPlayerProvider");
  }
  return ctx;
}
