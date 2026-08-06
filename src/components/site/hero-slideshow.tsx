"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./hero-slideshow.module.css";

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

const FALLBACK_SLIDE: Slide = {
  id: "fallback",
  url: "/gallery/hero-banner.jpg",
  altText: "D.O.R.A. naživo na koncertnom pódiu",
  title: "D.O.R.A.",
};

/**
 * Hero background slideshow with crossfade + Ken Burns zoom.
 *
 * Architektúra podľa expertného review:
 * - CSS Module pre @keyframes a triedy (nie globals.css, nie inline <style>)
 * - Všetky slidy renderované naraz (absolute positioned, opacity crossfade)
 * - className pre animáciu (nie inline style.animation)
 * - key na img → React remount → animácia reštartuje
 * - setInterval s [images.length] deps
 * - Fallback keď DB je prázdna
 */
export function HeroSlideshow({ slides, staticFallback }: Props) {
  // Vždy máme aspoň jeden obrázok — fallback keď DB je prázdna
  const images = useMemo<Slide[]>(() => {
    if (slides && slides.length > 0) return slides;
    return [{ ...FALLBACK_SLIDE, url: staticFallback }];
  }, [slides, staticFallback]);

  const [active, setActive] = useState(0);

  // Debug log — vidíme v server logoch aj v prehliadači
  useEffect(() => {
    console.log("[HeroSlideshow] mounted, images count:", images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 6500);

    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className={styles.wrapper}>
      {images.map((slide, index) => {
        const isActive = active === index;
        return (
          <div
            key={slide.id}
            className={`${styles.slide} ${isActive ? styles.active : ""}`}
            aria-hidden={!isActive}
          >
            {/*
              key na img sa mení keď sa slide stane aktívnym.
              React remountne element → CSS animácia (.zoom) sa spustí od začiatku.
            */}
            <img
              key={`${slide.id}-${isActive ? "on" : "off"}`}
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
              className={`${styles.image} ${isActive ? styles.zoom : ""}`}
            />
          </div>
        );
      })}

      {/* Slide indicators */}
      {images.length > 1 && (
        <div className={styles.indicators}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`${styles.indicator} ${
                i === active ? styles.indicatorActive : ""
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
