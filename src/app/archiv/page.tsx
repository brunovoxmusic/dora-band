import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { ArchiveGigsClient } from "./archive-client";

export const metadata: Metadata = {
  title: "Archív koncertov",
  description:
    "Archív odohraných vystúpení kapely D.O.R.A. — história koncertov, festivalov a klubových vystúpení od roku 1996.",
  alternates: { canonical: "/archiv" },
  openGraph: {
    title: "Archív koncertov | D.O.R.A.",
    description: "História odohraných vystúpení kapely D.O.R.A.",
  },
};

export const dynamic = "force-dynamic";

type GigRow = {
  id: string;
  title: string;
  date: Date;
  venue: string;
  city: string;
  country: string;
  ticketUrl: string | null;
  ticketPrice: string | null;
  status: string;
  notes: string | null;
};

export default async function ArchivePage() {
  const now = new Date();
  let pastGigs: GigRow[] = [];

  try {
    pastGigs = await db.gig.findMany({
      where: { date: { lt: now }, status: { not: "cancelled" } },
      orderBy: { date: "desc" },
      take: 100,
    });
  } catch (e) {
    console.warn("[archiv] Gigs fetch failed, showing empty archive:", e instanceof Error ? e.message : e);
  }

  // Group by year
  const byYear = pastGigs.reduce(
    (acc, g) => {
      const year = new Date(g.date).getFullYear().toString();
      if (!acc[year]) acc[year] = [];
      acc[year].push(g);
      return acc;
    },
    {} as Record<string, typeof pastGigs>
  );

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="relative border-b border-charcoal bg-dark-gray py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-stage-grid opacity-20" />
          <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-neon-red/8 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2 border border-charcoal bg-ink/60 px-3 py-1.5">
              <span className="font-mono-brand text-[10px] uppercase tracking-[0.25em] text-silver">
                Archív
              </span>
            </div>
            <h1 className="font-display text-4xl font-black leading-tight text-off-white sm:text-5xl lg:text-6xl">
              História <span className="text-neon-red text-glow-red">koncertov</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-off-white/70 sm:text-lg">
              Kompletný archív odohraných vystúpení D.O.R.A. — od prvých klubových koncertov
              až po festivalové pódia. Spolu {pastGigs.length} odohraných podujatí
              {years.length > 0 && ` v ${years.length} rokoch`}.
            </p>

            {/* Year quick-nav */}
            {years.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {years.map((y) => (
                  <a
                    key={y}
                    href={`#rok-${y}`}
                    className="border border-charcoal bg-ink px-3 py-1.5 font-mono-brand text-xs font-bold text-warm-yellow transition-colors hover:border-neon-red hover:text-neon-red"
                  >
                    {y}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Gigs grouped by year */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {pastGigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-charcoal bg-dark-gray/50 py-20 text-center">
                <p className="text-sm text-silver">
                  Zatiaľ žiadne odohrané koncerty v archíve.
                </p>
              </div>
            ) : (
              <div className="space-y-16">
                {years.map((year) => (
                  <div key={year} id={`rok-${year}`} className="scroll-mt-20">
                    <div className="mb-6 flex items-center gap-4">
                      <h2 className="font-display text-3xl font-black text-neon-red text-glow-red sm:text-4xl">
                        {year}
                      </h2>
                      <span className="font-mono-brand text-xs uppercase tracking-[0.2em] text-silver">
                        {byYear[year].length} {byYear[year].length === 1 ? "koncert" : "koncertov"}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-neon-red/40 to-transparent" />
                    </div>
                    <ArchiveGigsClient gigs={byYear[year]} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
