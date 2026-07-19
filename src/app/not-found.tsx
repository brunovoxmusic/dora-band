import Link from "next/link";
import { Home, ArrowLeft, Disc3 } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="relative w-full max-w-lg text-center">
          {/* Background glitch number */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="glitch font-display text-[12rem] font-black leading-none text-neon-red/10" data-text="404">
              404
            </span>
          </div>

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 border border-charcoal bg-dark-gray px-3 py-1.5">
              <Disc3 className="h-3.5 w-3.5 animate-spin text-neon-red" />
              <span className="font-mono-brand text-[10px] uppercase tracking-[0.25em] text-silver">
                Error 404
              </span>
            </div>

            <h1 className="glitch font-display text-6xl font-black text-neon-red text-glow-red sm:text-7xl" data-text="404">
              404
            </h1>
            <h2 className="mt-4 font-display text-2xl font-bold text-off-white sm:text-3xl">
              Stránka nenájdená
            </h2>
            <p className="mt-3 text-base text-off-white/70">
              Stránka, ktorú hľadáte, neexistuje alebo bola presunutá. Možno hľadáte koncert,
              galériu alebo kontakt na booking.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-neon-red px-6 py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red"
              >
                <Home className="h-4 w-4" />
                Domov
              </Link>
              <Link
                href="/archiv"
                className="inline-flex items-center justify-center gap-2 border border-charcoal bg-dark-gray px-6 py-3 text-sm font-bold uppercase tracking-wide text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
              >
                <ArrowLeft className="h-4 w-4" />
                Archív koncertov
              </Link>
            </div>

            {/* Quick links */}
            <div className="mt-10 border-t border-charcoal pt-6">
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver/60">
                Rýchle odkazy
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  { href: "/#hudba", label: "Hudba" },
                  { href: "/#galeria", label: "Galéria" },
                  { href: "/#kontakt", label: "Booking" },
                  { href: "/#press", label: "Press kit" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="border border-charcoal px-3 py-1.5 text-xs font-semibold text-silver transition-colors hover:border-neon-red hover:text-neon-red"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
