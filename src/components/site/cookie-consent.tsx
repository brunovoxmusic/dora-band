"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dora_cookie_consent_v1";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so it doesn't appear instantly on load
        const t = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const decide = (accepted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Súhlas s cookies"
      className={cn(
        "fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl border border-charcoal bg-ink/95 p-4 shadow-2xl backdrop-blur-xl clip-corner-lg sm:p-5",
        "animate-[fadeInUp_0.4s_ease-out]"
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-warm-yellow text-ink">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-off-white">Súbory cookies &amp; ochrana súkromia</p>
          <p className="mt-1 text-xs leading-relaxed text-off-white/70">
            Používame cookies na zlepšenie vášho zážitku a anonymnú analýzu návštevnosti. Súhlas
            môžete kedykoľvek odvolať. Niektoré cookies sú nevyhnutné pre fungovanie stránky.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => decide(true)}
              className="inline-flex items-center gap-1.5 bg-neon-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-deep-red"
            >
              <Check className="h-3.5 w-3.5" />
              Súhlasím
            </button>
            <button
              onClick={() => decide(false)}
              className="inline-flex items-center gap-1.5 border border-charcoal bg-dark-gray px-4 py-2 text-xs font-semibold text-off-white/80 transition-colors hover:border-off-white/40 hover:text-off-white"
            >
              Iba nevyhnutné
            </button>
          </div>
        </div>
        <button
          onClick={() => decide(false)}
          className="shrink-0 text-silver transition-colors hover:text-neon-red"
          aria-label="Zavrieť"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
