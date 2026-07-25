"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Database } from "lucide-react";

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

  // Detect database connection errors and show a helpful message
  const isDbError =
    error.message?.includes("DATABASE_URL") ||
    error.message?.includes("Prisma") ||
    error.message?.includes("relation") ||
    error.message?.includes("does not exist") ||
    error.message?.includes("connection") ||
    error.message?.includes("Can't reach database");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-neon-red/40 bg-neon-red/10">
          <AlertTriangle className="h-8 w-8 text-neon-red" />
        </div>

        <h1 className="font-display text-3xl font-black text-off-white sm:text-4xl">
          Niečo sa pokazilo
        </h1>

        {isDbError ? (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 text-warm-yellow">
              <Database className="h-4 w-4" />
              <p className="text-sm font-semibold">Databáza nie je pripojená</p>
            </div>
            <p className="mt-3 text-sm text-off-white/70">
              Na dokončenie nasadenia je potrebné nastaviť databázu. Postupujte podľa DEPLOYMENT.md.
            </p>
            <div className="mt-4 border border-charcoal bg-dark-gray p-3 text-left">
              <p className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                Kroky na opravu:
              </p>
              <ol className="mt-2 space-y-1 text-xs text-off-white/60">
                <li>1. Vytvorte Neon Postgres databázu (neon.tech)</li>
                <li>2. Pridajte <code className="text-warm-yellow">DATABASE_URL</code> do Vercel env vars</li>
                <li>3. Spustite <code className="text-warm-yellow">bun run db:push</code> + <code className="text-warm-yellow">bun run seed</code></li>
                <li>4. Redeploy na Vercel</li>
              </ol>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-base text-off-white/70">
            Nastala neočakávaná chyba. Skúste to znova alebo sa vráťte na domovskú stránku.
          </p>
        )}

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
