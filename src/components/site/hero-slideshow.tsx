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
 * - All slides stacked absolutely; active fades in, others fade out
 * - Active image gets `.hero-kenburns` class (globals.css) for gentle zoom-in
 * - `key` on img includes active index → React remounts → animation restarts
 * - Cycles through ALL marked slides in an infinite loop
 * - Respects prefers-reduced-motion
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
  const [reduced, setReduced] = useState(false);

  // Detect reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const raf = requestAnimationFrame(() => setReduced(mq.matches));
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", handler);
    };
  }, []);

  // Cycle: setInterval set up ONCE, uses functional setState (no stale closure)
  const shouldCycle = slides.length > 1 && !reduced;

  useEffect(() => {
    if (!shouldCycle) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            {/* key changes when slide becomes active → img remounts → zoom animation restarts */}
            <img
              key={`${slide.id}-${i === active ? "on" : "off"}`}
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. na koncertnom pódiu"}
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
