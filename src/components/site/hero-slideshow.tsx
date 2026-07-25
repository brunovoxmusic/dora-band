"use client";

import { useState, useEffect } from "react";

type Slide = {
  id: string;
  url: string;
  altText: string | null;
  title: string;
};

/**
 * Hero background slideshow with crossfade + Ken Burns zoom effect.
 *
 * - Crossfade between images (opacity transition)
 * - Slow zoom on each image (scale 1 → 1.12 over the slide duration)
 * - Respects prefers-reduced-motion (disables zoom, instant fade)
 * - Falls back to a single static image if only one slide
 */
export function HeroSlideshow({
  slides,
  staticFallback,
  intervalMs = 7000,
}: {
  slides: Slide[];
  staticFallback: string;
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Defer to avoid synchronous setState in effect body
    const raf = requestAnimationFrame(() => setReduced(mq.matches));
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener?.("change", onChange);
    };
  }, []);

  // Only cycle if more than 1 slide and motion not reduced
  const cycle = slides.length > 1 && !reduced;
  useEffect(() => {
    if (!cycle) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [cycle, slides.length, intervalMs]);

  // If no slides, show the static fallback
  if (slides.length === 0) {
    return (
      <div className="absolute inset-0">
        <img
          src={staticFallback}
          alt="D.O.R.A. naživo na koncertnom pódiu"
          className="h-full w-full object-cover opacity-45"
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
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              isActive ? "opacity-45" : "opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            <img
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. na koncertnom pódiu"}
              className={`h-full w-full object-cover ${
                reduced
                  ? ""
                  : isActive
                  ? "animate-hero-zoom"
                  : ""
              }`}
              style={reduced ? undefined : { transformOrigin: "center center" }}
            />
          </div>
        );
      })}

      {/* Slide indicators (bottom) */}
      {cycle && (
        <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1 transition-all ${
                i === active ? "w-8 bg-neon-red" : "w-1.5 bg-silver/40 hover:bg-silver"
              }`}
              aria-label={`Slide ${i + 1}`}
              aria-pressed={i === active}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes hero-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.12); }
        }
        .animate-hero-zoom {
          animation: hero-zoom ${intervalMs}ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-hero-zoom {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
