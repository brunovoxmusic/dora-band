"use client";

/**
 * SectionsProvider — client-side React Context pre section visibility map.
 *
 * PROBLÉM (predtým): Každý komponent (Navbar, Footer, HeroSection,
 * StickyMusicPlayer) volal samostatne `fetch("/api/sections")` v useEffect
 * a medzitým renderoval "všetko viditeľné" ako default. To spôsobovalo FOUC
 * (Flash of Unstyled Content) — sekcie, ktoré mali byť skryté, sa na krátko
 * objavili a potom zmizli.
 *
 * RIEŠENIE: Server-side fetch v root `layout.tsx` + distribúcia cez Context.
 * Všetci konzumenti dostanú hodnotu už pri prvom SSR rendri — žiadny
 * client-side fetch, žiadny FOUC.
 *
 * Použitie v komponentoch:
 *   const sections = useSections();
 *   const isVisible = (id: string) => !sections || sections[id] !== false;
 */

import { createContext, useContext } from "react";

export type SectionsMap = Record<string, boolean> | null;

const SectionsContext = createContext<SectionsMap>(null);

export function SectionsProvider({
  sections,
  children,
}: {
  sections: SectionsMap;
  children: React.ReactNode;
}) {
  return (
    <SectionsContext.Provider value={sections}>
      {children}
    </SectionsContext.Provider>
  );
}

/**
 * Hook na čítanie section visibility z kontextu.
 *
 * @returns `null` ak je context nastavený na null (chyba pri fetchovaní
 *   nastavení, fallback = všetky sekcie viditeľné). Inak Record<sectionId, boolean>.
 */
export function useSections(): SectionsMap {
  return useContext(SectionsContext);
}

/**
 * Helper — rozhodne či je konkrétna sekcia viditeľná.
 * Ak sections map chýba (null), defaultne true (neblokujeme UI).
 */
export function isSectionVisible(
  sections: SectionsMap,
  id: string
): boolean {
  if (!sections) return true;
  return sections[id] !== false;
}
