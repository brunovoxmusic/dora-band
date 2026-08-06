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
 * Hero background slideshow — production-safe.
 *
 * Uses PLAIN CSS classes defined in globals.css (NOT CSS Module).
 * This eliminates ALL CSS Module hashing/scoping issues in production.
 *
 * - @keyframes kenBurns + .hero-slide-zoom in globals.css
 * - All slides rendered simultaneously (absolute, opacity crossfade)
 * - .hero-slide-zoom class on active slide wrapper → Ken Burns animation
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
    <div className="hero-slideshow-wrapper">
      {images.map((slide, index) => {
        const isActive = safeActive === index;
        return (
          <div
            key={slide.id}
            className={`hero-slide${isActive ? " hero-slide-active" : ""}${isActive ? " hero-slide-zoom" : ""}`}
            aria-hidden={!isActive}
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
      })}

      {images.length > 1 && (
        <div className="hero-slide-indicators">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`hero-slide-indicator${i === safeActive ? " hero-slide-indicator-active" : ""}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
