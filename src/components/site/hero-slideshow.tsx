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
 * ARCHITECTURE (Task 55 — kompletne prepísané):
 *
 * Vrstvy:
 *  1. .hero-slideshow-wrapper — kontajner, žiadne transformácie
 *  2. .hero-slide — opacity + z-index layer (crossfade). Overflow hidden
 *     aby translate vo vnútri nevykukol mimo viewport.
 *  3. .hero-slide-image (<img>) — Ken Burns transformácie. Animácia na
 *     obrázku (nie na wrappere) zabezpečuje že sa neposúva celý panel.
 *
 * Ken Burns:
 *  - 4 rôzne variácie (kenBurns1..4) — striedajú sa podľa indexu slajdu
 *  - ease-out (cubic-bezier(0.25, 0.1, 0.25, 1)) — plynulý spomalený zoom
 *  - Duration 7s = SLIDE_INTERVAL_MS — zoom beží celú dobu, žiadny freeze
 *  - translate ±4% (mierne) — bez viditeľných okrajov aj pri scale 1.05
 *  - Začínajú na scale 1.05+ (mierne zväčšené) aby pri translate nebol okraj
 *
 * Crossfade:
 *  - 1600ms cubic-bezier(0.4, 0, 0.2, 1)
 *  - Z-index overlap: prev=2, active=1, ostatné=0
 *  - Prev si zachováva Ken Burns end-state vďaka `forwards` fill mode
 *
 * Preloader:
 *  - next/image priority={true} pre prvý slide
 *  - Pre ostatné slides beží skrytý <link rel="preload"> cez useEffect
 *    ktorý prednačíta ďalší obrázok v poradí pred tým ako sa zmení slide
 *
 * Browser optimizations:
 *  - will-change: opacity (.hero-slide) + transform (.hero-slide-image)
 *  - backface-visibility: hidden (Safari anti-flicker)
 *  - translate3d pre GPU compositing (Chrome/Firefox)
 *  - prefers-reduced-motion: vypne Ken Burns, skráti crossfade na 300ms
 *  - Visibility API: pause interval keď je tab neaktívny (úspora batérie)
 */

const SLIDE_INTERVAL_MS = 7000;
const CROSSFADE_MS = 1600;

// 4 Ken Burns variácie — striedajú sa podľa indexu
const KEN_BURNS_VARIANTS = ["kenBurns1", "kenBurns2", "kenBurns3", "kenBurns4"] as const;

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
  const [tabVisible, setTabVisible] = useState(true);
  // safeActive guards against slides array shrinking between SSR and hydration.
  const safeActive = active >= images.length ? 0 : active;
  // Track the previously-active slide so it can fade out gracefully on top
  // of the new active slide (z-index boost during the overlap window).
  const [prevActive, setPrevActive] = useState<number>(safeActive);

  useEffect(() => {
    // Defer to microtask to satisfy react-hooks/set-state-in-effect rule.
    Promise.resolve().then(() => setMounted(true));
  }, []);

  // IntersectionObserver — hide fixed indicators/counter once the user scrolls past hero.
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

  // Visibility API — pause interval keď je tab neaktívny (úspora batery + CPU)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Preload nasledujúceho obrázka asynchrónne aby crossfade neskákal na bielu
  useEffect(() => {
    if (images.length <= 1) return;
    const nextIdx = (safeActive + 1) % images.length;
    const nextUrl = images[nextIdx]?.url;
    if (!nextUrl) return;
    // next/image si cachuje obrázky podľa URL. Ak ho pred-načítame cez
    // new Image(), browser ho stiahne do cache a next/image ho použije okamžite.
    const img = new window.Image();
    img.src = nextUrl;
  }, [safeActive, images]);

  // Slide cycling interval — pauznutý keď je tab hidden alebo mimo view
  useEffect(() => {
    if (images.length <= 1) return;
    if (!tabVisible || !inView) return;
    const id = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % images.length;
        setPrevActive(prev >= images.length ? 0 : prev);
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [images.length, tabVisible, inView]);

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
// SlideElement — jeden na slide. Stable key (z parenta) zabezpečuje že DOM
// div pretrvá cez active/inactive prechody, takže opacity crossfade funguje.
// Ken Burns sa reštartne cez ref + useEffect keď isActive nabudze true.
// ---------------------------------------------------------------------------

type SlideElementProps = {
  slide: Slide;
  index: number;
  isActive: boolean;
  isPrev: boolean;
  crossfadeMs: number;
};

function SlideElement({ slide, index, isActive, isPrev, crossfadeMs }: SlideElementProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  // Restart Ken Burns animation each time this slide becomes active.
  // Technique: set inline animation to 'none', force reflow via getBoundingClientRect,
  // then set the real animation inline (with per-index name).
  // Inline style overrides CSS class, ensuring a fresh start.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !isActive) return;

    // 4 variácie Ken Burns — striedajú sa podľa indexu
    const animName = KEN_BURNS_VARIANTS[index % KEN_BURNS_VARIANTS.length];

    // 1. Kill any running animation.
    el.style.animation = "none";
    // 2. Force synchronous reflow so browser registers the 'none' state.
    //    getBoundingClientRect je spoľahlivejší ako offsetWidth v Safari/Firefox.
    void el.getBoundingClientRect();
    // 3. Set the full animation shorthand inline.
    //    ease-out (cubic-bezier) pre plynulý spomalený zoom.
    //    Duration 7s = SLIDE_INTERVAL_MS — zoom beží celú dobu.
    //    forwards fill mode — po skončení zostane v end-state (scale 1.18-1.2).
    el.style.animation = `${animName} 7000ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards`;
  }, [isActive, index]);

  // Keď slide prestane byť aktívny (a ani prev), vyčist inline animáciu
  // aby sa vrátila na CSS default (translateZ(0) — GPU layer bez zoom).
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (!isActive && !isPrev) {
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
      className={classes}
      aria-hidden={!isActive}
      style={{
        transitionDuration: `${crossfadeMs}ms`,
      }}
    >
      <Image
        ref={imgRef}
        src={slide.url}
        alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
        fill
        priority={index === 0}
        sizes="100vw"
        className="hero-slide-image"
        // preload ďalších slides — next/image ich stiahne do cache
        // (ak majú priority=false, stiahnu sa až keď sú vo viewporte)
      />
    </div>
  );
}
