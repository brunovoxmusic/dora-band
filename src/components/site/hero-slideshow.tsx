"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

/**
 * Hero background slideshow — production-safe.
 *
 * KEY FIX: Zoom animation is applied to the SLIDE WRAPPER DIV,
 * not to the <img> element. This avoids conflicts with next/image
 * internal inline styles (position, transform, object-fit).
 *
 * - CSS Module for all styles + @keyframes
 * - next/image with fill, sizes=100vw, priority for first
 * - All slides rendered simultaneously (absolute, opacity crossfade)
 * - .zoom class on active slide WRAPPER → Ken Burns animation
 * - setInterval with [images.length] deps
 * - Fallback when DB empty
 */
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
  const safeActive = active >= images.length ? 0 : active;

  useEffect(() => {
    if (images.length <= 1) return;

    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 6500);

    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className={styles.wrapper}>
      {images.map((slide, index) => {
        const isActive = safeActive === index;
        return (
          <div
            key={slide.id}
            className={`${styles.slide} ${isActive ? styles.active : ""} ${isActive ? styles.zoom : ""}`}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
              fill
              priority={index === 0}
              sizes="100vw"
              className={styles.image}
            />
          </div>
        );
      })}

      {images.length > 1 && (
        <div className={styles.indicators}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`${styles.indicator} ${i === safeActive ? styles.indicatorActive : ""}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
