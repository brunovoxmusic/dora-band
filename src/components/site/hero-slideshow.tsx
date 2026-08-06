"use client";

import { useState, useEffect } from "react";

type Slide = {
  id: string;
  url: string;
  altText: string | null;
  title: string;
};

const SLIDE_INTERVAL = 5000;
const FADE_MS = 1500;
const ZOOM_TARGET = 1.25;
const ANIM_DURATION = SLIDE_INTERVAL + FADE_MS; // 6500ms

// Unique keyframe name to avoid collisions
const KEYFRAME_NAME = "doraHeroZoom";

/**
 * Hero background slideshow — COMPLETELY REWRITTEN for 100% reliability.
 *
 * Previous versions failed because:
 * 1. CSS in globals.css could be tree-shaken by Tailwind v4
 * 2. data-active attribute selector didn't sync with React remounts
 * 3. External CSS class .hero-kenburns wasn't always applied
 *
 * This version fixes ALL issues by:
 * - Using INLINE style.animation (no external CSS dependency)
 * - Using key prop to remount img → animation always restarts
 * - @keyframes defined in inline <style> tag (guaranteed in DOM)
 * - All opacity via inline style (no Tailwind class dependency)
 * - Even static fallback gets zoom animation
 */
export function HeroSlideshow({
  slides,
  staticFallback,
}: {
  slides: Slide[];
  staticFallback: string;
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  // Set up cycling interval — runs once on mount
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [slides]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Inline keyframes — guaranteed to be in the DOM
  const keyframesCSS = `
    <style>
      @keyframes ${KEYFRAME_NAME} {
        0% { transform: scale(1) translate(0%, 0%); }
        100% { transform: scale(${ZOOM_TARGET}) translate(-2%, -1.5%); }
      }
    </style>
  `;

  // No slides → static fallback with zoom
  if (!slides || slides.length === 0) {
    return (
      <>
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={staticFallback}
            alt="D.O.R.A. naživo na koncertnom pódiu"
            className="h-full w-full object-cover"
            style={{
              transformOrigin: "center center",
              willChange: "transform",
              animation: reduced ? "none" : `${KEYFRAME_NAME} ${ANIM_DURATION}ms ease-out forwards`,
            }}
          />
        </div>
        <div dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((slide, i) => {
          const isActive = i === active;
          return (
            <div
              key={slide.id}
              style={{
                position: "absolute",
                inset: 0,
                opacity: isActive ? 1 : 0,
                transition: `opacity ${FADE_MS}ms ease-in-out`,
                pointerEvents: "none",
              }}
              aria-hidden={!isActive}
            >
              {/*
                key includes active state → when slide becomes active,
                React creates a NEW img element with the animation in inline style.
                The new element starts the animation from scale(1) immediately.
              */}
              <img
                key={`${slide.id}-${isActive ? "on" : "off"}`}
                src={slide.url}
                alt={slide.altText || slide.title || "D.O.R.A. naživo na koncertnom pódiu"}
                className="h-full w-full object-cover"
                style={
                  isActive && !reduced
                    ? {
                        transformOrigin: "center center",
                        willChange: "transform",
                        animation: `${KEYFRAME_NAME} ${ANIM_DURATION}ms ease-out forwards`,
                      }
                    : {
                        transformOrigin: "center center",
                      }
                }
              />
            </div>
          );
        })}

        {/* Slide indicators */}
        {slides.length > 1 && !reduced && (
          <div
            style={{
              position: "absolute",
              bottom: "96px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
              zIndex: 10,
            }}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width: i === active ? "32px" : "6px",
                  height: "6px",
                  backgroundColor: i === active ? "#E63946" : "rgba(192,192,192,0.4)",
                  transition: "all 300ms ease",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      <div dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
    </>
  );
}
