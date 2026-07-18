"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `target` when the element scrolls into view.
 * Supports numeric targets; non-numeric strings are returned as-is.
 */
export function useCountUp(target: string | number, duration = 1600) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const numeric = typeof target === "number" ? target : parseInt(String(target).replace(/\D/g, ""), 10);
    if (isNaN(numeric)) {
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            // easeOutExpo
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            setValue(Math.round(numeric * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  // Return the original string with numeric portion replaced, or the number
  const display =
    typeof target === "string"
      ? target.replace(/\d+/, String(value))
      : value;
  return { ref, display };
}
