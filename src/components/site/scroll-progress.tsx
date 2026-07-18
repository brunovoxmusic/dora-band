"use client";

import { useState, useEffect } from "react";

/**
 * Scroll progress bar — thin neon-red gradient bar fixed to the top of the viewport.
 * Fills proportionally to scroll position. Adds a subtle glow at the leading edge.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        setProgress(Math.min(Math.max(pct, 0), 100));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-neon-red via-deep-red to-warm-yellow transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%`, boxShadow: "0 0 8px rgba(230,57,70,0.7)" }}
      />
    </div>
  );
}
