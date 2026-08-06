"use client";

import { useState, useEffect } from "react";

type Slide = {
  id: string;
  url: string;
  altText: string | null;
  title: string;
};

/**
 * Hero background slideshow with crossfade + Ken Burns zoom.
 *
 * - All slides stacked absolutely; active = opacity-100, others = opacity-0
 * - Active image gets `.hero-kenburns` class (globals.css) for 9s zoom-in
 * - `key` on img changes when active → React remounts → animation restarts
 * - Cycles ALL marked slides in infinite loop every `intervalMs`
 * - Respects prefers-reduced-motion (checked synchronously, no state needed)
 */
export function HeroSlideshow({
  slides,
  staticFallback,
  intervalMs = 6000,
}: {
  slides: Slide[];
  staticFallback: string;
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  // Cycling — set up ONCE on mount. No state dependency = no re-arm issues.
  // Reduced motion is checked synchronously inside the effect (no state = no re-render).
  useEffect(() => {
    if (!slides || slides.length <= 1) return;

    // Check reduced motion synchronously
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;
    }

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, []);

  // Check reduced motion for rendering (no state, just a function)
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // No slides → static fallback
  if (!slides || slides.length === 0) {
    return (
      <div className="absolute inset-0">
        <img
          src={staticFallback}
          alt="D.O.R.A. naživo na koncertnom pódiu"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const shouldCycle = slides.length > 1 && !reduced;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((slide, i) => {
        const isActive = i === active;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            {/*
              key changes when slide becomes active/unactive → React remounts img
              → CSS animation (hero-kenburns) restarts from scale(1) each time
            */}
            <img
              key={`${slide.id}-${isActive ? "on" : "off"}`}
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
              className={`h-full w-full object-cover ${isActive && !reduced ? "hero-kenburns" : ""}`}
            />
          </div>
        );
      })}

      {/* Slide indicators */}
      {shouldCycle && (
        <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 transition-all duration-300 ${
                i === active ? "w-8 bg-neon-red" : "w-1.5 bg-silver/40 hover:bg-silver"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
