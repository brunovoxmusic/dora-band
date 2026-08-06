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
 * Hero background slideshow — production-safe implementation.
 *
 * Architecture:
 * - CSS Module for ALL styles and @keyframes (no inline <style>, no dangerouslySetInnerHTML)
 * - next/image with fill for Vercel image optimization
 * - All slides rendered simultaneously (absolute positioned, opacity crossfade)
 * - .zoom CSS class on active slide only (no inline style.animation)
 * - No React key remount hack — CSS class toggle restarts animation naturally
 * - setInterval with [images.length] deps
 * - Fallback slide when DB is empty
 * - Debug logs (temporary)
 */
export function HeroSlideshow({ slides, staticFallback }: Props) {
  // Always have at least one image — fallback when DB is empty
  const images = useMemo<Slide[]>(() => {
    if (slides && slides.length > 0) {
      console.log("[HeroSlideshow] slides from DB:", slides.length, slides.map(s => s.url.slice(-30)));
      return slides;
    }
    console.log("[HeroSlideshow] no slides from DB, using fallback:", staticFallback);
    return [{
      id: "fallback",
      url: staticFallback,
      altText: "D.O.R.A. naživo na koncertnom pódiu",
      title: "D.O.R.A.",
    }];
  }, [slides, staticFallback]);

  const [active, setActive] = useState(0);

  // Clamp active index if images array changes (hydration safety)
  const safeActive = active >= images.length ? 0 : active;

  // Cycling — setInterval, restarts if images.length changes
  useEffect(() => {
    if (images.length <= 1) {
      console.log("[HeroSlideshow] single image, no cycling");
      return;
    }

    console.log("[HeroSlideshow] starting interval, images:", images.length);
    const id = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % images.length;
        console.log("[HeroSlideshow] cycling:", prev, "→", next);
        return next;
      });
    }, 6500);

    return () => {
      console.log("[HeroSlideshow] cleaning up interval");
      window.clearInterval(id);
    };
  }, [images.length]);

  return (
    <div className={styles.wrapper}>
      {/* Temporary debug badge */}
      <div className={styles.debugBadge}>
        slides: {images.length} | active: {safeActive}
      </div>

      {images.map((slide, index) => {
        const isActive = safeActive === index;
        return (
          <div
            key={slide.id}
            className={`${styles.slide} ${isActive ? styles.active : ""}`}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.url}
              alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
              fill
              priority={index === 0}
              sizes="100vw"
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
                i === safeActive ? styles.indicatorActive : ""
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
