"use client";

import { useState, useEffect, useRef } from "react";

type Slide = {
  id: string;
  url: string;
  altText: string | null;
  title: string;
};

/**
 * Hero background slideshow with crossfade + Ken Burns zoom effect.
 *
 * How it works:
 * - All slide images are always rendered (stacked, absolute positioned)
 * - The active slide has opacity-100, others have opacity-0
 * - CSS transition on opacity creates the crossfade
 * - A CSS keyframe animation on the active image creates the slow zoom
 * - The key is: re-mount the img when it becomes active so the animation restarts
 * - Respects prefers-reduced-motion (no zoom, no cycling)
 * - Falls back to a single static image if no slides
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
    const raf = requestAnimationFrame(() => setReduced(mq.matches));
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener?.("change", onChange);
    };
  }, []);

  const cycle = slides.length > 1 && !reduced;

  useEffect(() => {
    if (!cycle) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [cycle, slides.length, intervalMs]);

  // No slides → static fallback
  if (slides.length === 0) {
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
            className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            {/*
              Re-mount the img when it becomes active so the zoom animation restarts.
              key={isActive ? 'active' : 'idle'} forces React to unmount/remount.
            */}
            <img
              key={isActive ? "active" : "idle"}
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. na koncertnom pódiu"}
              className={`h-full w-full object-cover ${
                isActive && !reduced ? "hero-kenburns" : ""
              }`}
            />
          </div>
        );
      })}

      {/* Slide indicators */}
      {cycle && (
        <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 transition-all duration-300 ${
                i === active ? "w-8 bg-neon-red" : "w-1.5 bg-silver/40 hover:bg-silver"
              }`}
              aria-label={`Slide ${i + 1}`}
              aria-pressed={i === active}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes hero-kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-1.5%, -1.5%); }
        }
        .hero-kenburns {
          animation: hero-kenburns ${intervalMs + 1800}ms ease-out forwards;
          transform-origin: center center;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-kenburns {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
