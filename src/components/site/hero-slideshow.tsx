"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
 * ARCHITECTURE
 * ------------
 * Each slide is rendered by a <SlideElement> subcomponent with:
 *   - STABLE `key={slide.id}` (never remounts → opacity transitions work = crossfade)
 *   - A `ref` to the DOM div
 *   - A `useEffect` that RESTARTS the Ken Burns animation when `isActive` flips
 *     to true, by toggling `style.animation = 'none'` → forced reflow → restore.
 *
 * This is the ONLY correct way to get BOTH:
 *   1. Smooth opacity crossfade (requires stable DOM elements)
 *   2. Ken Burns zoom that replays each time a slide becomes active
 *      (requires animation restart)
 *
 * The previous implementation used `key={slide.id-active/idle}` which REMOUNTS
 * the div on every active change → opacity jumps instantly (no transition) →
 * NO crossfade visible. Fixed by splitting into a subcomponent.
 *
 * CSS lives in globals.css as PLAIN global classes (no CSS Module hashing).
 */

const SLIDE_INTERVAL_MS = 7000;
const CROSSFADE_MS = 2000;

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
  // safeActive guards against slides array shrinking between SSR and hydration.
  const safeActive = active >= images.length ? 0 : active;
  // Track the previously-active slide so it can fade out gracefully on top
  // of the new active slide (z-index boost during the overlap window).
  const [prevActive, setPrevActive] = useState<number>(safeActive);

  useEffect(() => {
    // Defer to microtask to satisfy react-hooks/set-state-in-effect rule.
    Promise.resolve().then(() => setMounted(true));
  }, []);

  // Hide fixed indicators/counter once the user scrolls past the hero.
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

  // Slide cycling interval.
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
  // z-index boost doesn't linger on top of the active slide.
  useEffect(() => {
    if (prevActive === safeActive) return;
    const id = window.setTimeout(() => {
      setPrevActive(safeActive);
    }, CROSSFADE_MS + 100);
    return () => window.clearTimeout(id);
  }, [prevActive, safeActive]);

  const goTo = useCallback((i: number) => {
    if (i === safeActive) return;
    setPrevActive(safeActive);
    setActive(i);
  }, [safeActive]);

  return (
    <div
      className="hero-slideshow-wrapper"
      role="img"
      aria-label="Galéria koncertných fotografií kapely D.O.R.A."
    >
      {images.map((slide, index) => (
        <SlideElement
          key={slide.id}
          slide={slide}
          index={index}
          isActive={safeActive === index}
          isPrev={prevActive === index && safeActive !== index}
          crossfadeMs={CROSSFADE_MS}
        />
      ))}

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

// ---------------------------------------------------------------------------
// SlideElement — one per slide. Stable key (from parent) ensures the DOM
// div persists across active/inactive transitions so opacity crossfade works.
// Ken Burns is restarted via ref + useEffect when isActive becomes true.
// ---------------------------------------------------------------------------

type SlideElementProps = {
  slide: Slide;
  index: number;
  isActive: boolean;
  isPrev: boolean;
  crossfadeMs: number;
};

function SlideElement({ slide, index, isActive, isPrev, crossfadeMs }: SlideElementProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Restart Ken Burns animation each time this slide becomes active.
  // Critical: without this restart, the CSS animation only runs ONCE on mount
  // and never replays when the slide cycles back to active (browser caches
  // animation state on persistent DOM elements).
  //
  // Technique: set inline animation to 'none', force synchronous reflow via
  // offsetWidth, then set the real animation inline (with per-index name).
  // Inline style overrides the CSS class declaration, ensuring a fresh start.
  useEffect(() => {
    const el = ref.current;
    if (!el || !isActive) return;
    const animName = index % 2 === 0 ? "kenBurns" : "kenBurnsAlt";
    // Set transform-origin + will-change BEFORE animation restart so the
    // browser is ready to composite the transform efficiently.
    el.style.transformOrigin = "50% 50%";
    el.style.willChange = "transform";
    // 1. Kill any running animation.
    el.style.animation = "none";
    // 2. Force synchronous reflow so browser registers the 'none' state.
    void el.offsetWidth;
    // 3. Set the full animation shorthand inline. This is the ONLY source
    //    of Ken Burns animation (CSS class has no animation declaration).
    //    LINEAR easing = constant zoom rate throughout (no front-loaded jump).
    //    Duration 6s = smooth zoom from scale 1.0 to 1.5 (8.3% per second).
    el.style.animation = `${animName} 6000ms linear forwards`;
  }, [isActive, index]);

  // When a slide becomes inactive (not active, not prev), clear the inline
  // animation so the CSS class declaration takes over (which is 'none' for
  // inactive slides — they should have no transform, just opacity 0).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!isActive && !isPrev) {
      // Inactive slide: remove inline animation so it returns to base state.
      el.style.animation = "";
    }
  }, [isActive, isPrev]);

  const classes = [
    "hero-slide",
    isActive ? "hero-slide-active" : "",
    isPrev ? "hero-slide-prev" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={classes}
      aria-hidden={!isActive}
      style={{
        transitionDuration: `${crossfadeMs}ms`,
      }}
    >
      <Image
        src={slide.url}
        alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
        fill
        priority={index === 0}
        sizes="100vw"
        className="hero-slide-image"
      />
    </div>
  );
}
