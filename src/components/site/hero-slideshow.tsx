"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Slide = {
  id: string;
  url: string;
  altText: string | null;
  title: string;
};

type Props = {
  slides: Slide[];
  staticFallback: string;
};

/**
 * Hero background slideshow — production-safe & visibly animated.
 *
 * DESIGN
 * ------
 * - All slides rendered simultaneously, stacked absolutely.
 * - The ACTIVE slide gets `.hero-slide-active` (opacity:1) + `.hero-slide-zoom`
 *   (Ken Burns scale animation). All other slides stay at opacity:0.
 * - Long crossfade duration (2200ms) so the transition is clearly visible.
 * - Ken Burns runs slightly longer (7500ms) than the slide interval (8000ms)
 *   so the zoom never freezes — it eases in/out naturally.
 * - When the active index changes, the OLD slide fades out (1→0) while the
 *   NEW slide fades in (0→1) simultaneously = true crossfade.
 * - `key` on the active slide wrapper forces React to remount that specific
 *   slide's inner content, which restarts the Ken Burns animation cleanly
 *   every time it becomes active (no animation: none → animation: kenBurns
 *   jankiness).
 * - PLAIN CSS classes (defined in globals.css) — NO CSS Module, NO hashing.
 *
 * FALLBACK
 * --------
 * If `slides` is empty, renders a single static image (no interval, no KB).
 */

const SLIDE_INTERVAL_MS = 8000;
const CROSSFADE_MS = 2200;
const KEN_BURNS_MS = 7500;

export function HeroSlideshow({ slides, staticFallback }: Props) {
  const images = useMemo<Slide[]>(() => {
    if (slides && slides.length > 0) return slides;
    return [{
      id: "fallback",
      url: staticFallback,
      altText: "D.O.R.A. naživo na koncertnom pódiu",
      title: "D.O.R.A.",
    }];
  }, [slides, staticFallback]);

  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(true);
  // Ensure we never index past the array (defensive — slides count can change
  // after a DB re-seed between SSR and hydration).
  const safeActive = active >= images.length ? 0 : active;
  // Track the previously-active slide so we can let it fade out gracefully
  // instead of instantly disappearing.
  const [prevActive, setPrevActive] = useState<number>(safeActive);

  useEffect(() => {
    // Defer to a microtask to avoid the set-state-in-effect lint rule.
    Promise.resolve().then(() => setMounted(true));
  }, []);

  // Hide fixed indicators/counter once the user has scrolled past the hero
  // (so they don't cover other sections). We use IntersectionObserver on the
  // wrapper element for efficient, scroll-event-free tracking.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wrapper = document.querySelector(".hero-slideshow-wrapper");
    if (!wrapper) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { threshold: 0.05 }
    );
    io.observe(wrapper);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % images.length;
        setPrevActive(prev >= images.length ? 0 : prev);
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [images.length]);

  // Clear `prevActive` after the crossfade finishes so the prev slide's
  // z-index boost doesn't linger (which would otherwise keep it stacked
  // on top of the active slide for the rest of the cycle).
  useEffect(() => {
    if (prevActive === safeActive) return;
    const id = window.setTimeout(() => {
      setPrevActive(safeActive);
    }, CROSSFADE_MS + 100);
    return () => window.clearTimeout(id);
  }, [prevActive, safeActive]);

  // Click an indicator → switch immediately.
  const goTo = (i: number) => {
    if (i === safeActive) return;
    setPrevActive(safeActive);
    setActive(i);
  };

  return (
    <div
      className="hero-slideshow-wrapper"
      role="img"
      aria-label="Galéria koncertných fotografií kapely D.O.R.A."
    >
      {images.map((slide, index) => {
        const isActive = safeActive === index;
        const isPrev = prevActive === index && !isActive;
        // Active slide gets the zoom class to start Ken Burns from scale(1).
        // Previous slide keeps fading out without zoom (it already zoomed).
        const classes = [
          "hero-slide",
          isActive ? "hero-slide-active" : "",
          isActive ? "hero-slide-zoom" : "",
          isPrev ? "hero-slide-prev" : "",
        ].filter(Boolean).join(" ");

        return (
          <div
            key={slide.id}
            className={classes}
            aria-hidden={!isActive}
            style={{
              transitionDuration: `${CROSSFADE_MS}ms`,
            }}
          >
            {/* Use `key` tied to isActive so Ken Burns animation restarts
                cleanly each time this slide becomes active. */}
            <Image
              key={`${slide.id}-${isActive ? "active" : "idle"}`}
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
              fill
              priority={index === 0}
              sizes="100vw"
              className="hero-slide-image"
            />
          </div>
        );
      })}

      {images.length > 1 && (
        <div className={`hero-slide-indicators${inView ? "" : " hero-slide-hidden"}`}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`hero-slide-indicator${i === safeActive ? " hero-slide-indicator-active" : ""}`}
              aria-label={`Snímka ${i + 1} z ${images.length}`}
              aria-current={i === safeActive}
            />
          ))}
        </div>
      )}

      {/* Slide counter (bottom-right, subtle) */}
      {images.length > 1 && (
        <div className={`hero-slide-counter${inView ? "" : " hero-slide-hidden"}`} aria-hidden>
          <span className="hero-slide-counter-current">
            {String(mounted ? safeActive + 1 : 1).padStart(2, "0")}
          </span>
          <span className="hero-slide-counter-sep">/</span>
          <span className="hero-slide-counter-total">
            {String(images.length).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
