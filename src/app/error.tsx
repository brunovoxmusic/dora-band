"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-neon-red/40 bg-neon-red/10">
          <AlertTriangle className="h-8 w-8 text-neon-red" />
        </div>

        <h1 className="font-display text-3xl font-black text-off-white sm:text-4xl">
          Niečo sa pokazilo
        </h1>
        <p className="mt-3 text-base text-off-white/70">
          Nastala neočakávaná chyba. Skúste to znova alebo sa vráťte na domovskú stránku.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono-brand text-[10px] uppercase tracking-wider text-silver/50">
            Kód chyby: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-neon-red px-6 py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red"
          >
            <RotateCcw className="h-4 w-4" />
            Skúsiť znova
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-charcoal bg-dark-gray px-6 py-3 text-sm font-bold uppercase tracking-wide text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
          >
            <Home className="h-4 w-4" />
            Domov
          </Link>
        </div>
      </div>
    </div>
  );
}
