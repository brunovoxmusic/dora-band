"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Ticket, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";

type Gig = {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketUrl: string | null;
  ticketPrice: string | null;
  status: string;
  notes: string | null;
};

const statusMap: Record<string, { label: string; cls: string }> = {
  upcoming: { label: "Nadchádzajúci", cls: "border-neon-red text-neon-red" },
  soldout: { label: "Vypredané", cls: "border-warm-yellow text-warm-yellow" },
  cancelled: { label: "Zrušené", cls: "border-silver text-silver" },
  past: { label: "Odohrané", cls: "border-charcoal text-silver" },
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return {
      day: d.toLocaleDateString("sk-SK", { day: "2-digit" }),
      month: d.toLocaleDateString("sk-SK", { month: "short" }).toUpperCase().replace(".", ""),
      year: d.getFullYear(),
      time: d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" }),
      weekday: d.toLocaleDateString("sk-SK", { weekday: "long" }),
    };
  } catch {
    return { day: "?", month: "?", year: "?", time: "", weekday: "" };
  }
}

export function GigsSection() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gigs")
      .then((r) => r.json())
      .then((d) => {
        setGigs(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="relative border-t border-charcoal bg-ink py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="06b"
          eyebrow="Koncerty"
          title="Nadchádzajúce vystúpenia"
          description="Rezervujte si miesto na ďalšom živom vystúpení D.O.R.A."
        />

        {loading ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-charcoal" />
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="mt-8 border border-charcoal bg-dark-gray p-8 text-center">
            <p className="text-sm text-silver">
              Momentálne nie sú naplánované žiadne vystúpenia.{" "}
              <a href="#kontakt" className="font-semibold text-neon-red hover:underline underline-offset-4">
                Naplánujte koncert s nami →
              </a>
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {gigs.map((g) => {
              const d = formatDate(g.date);
              const st = statusMap[g.status] ?? statusMap.upcoming;
              return (
                <article
                  key={g.id}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border border-charcoal bg-dark-gray p-4 transition-all hover:border-neon-red/50 hover:bg-charcoal/30 sm:gap-6 sm:p-5"
                >
                  {/* Date block */}
                  <div className="flex h-16 w-16 flex-col items-center justify-center border border-charcoal bg-ink sm:h-20 sm:w-20">
                    <span className="font-display text-2xl font-black leading-none text-neon-red sm:text-3xl">
                      {d.day}
                    </span>
                    <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
                      {d.month}
                    </span>
                    <span className="font-mono-brand text-[9px] text-silver">{d.year}</span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`border px-2 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider ${st.cls}`}>
                        {st.label}
                      </span>
                      {d.weekday && (
                        <span className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                          {d.weekday}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-bold text-off-white sm:text-xl">{g.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-off-white/70">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-warm-yellow" />
                        {g.venue}, {g.city}
                      </span>
                      {d.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-warm-yellow" />
                          {d.time}
                        </span>
                      )}
                      {g.ticketPrice && (
                        <span className="flex items-center gap-1.5">
                          <Ticket className="h-3 w-3 text-warm-yellow" />
                          {g.ticketPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href={g.ticketUrl || "#kontakt"}
                    className="hidden items-center gap-1 border border-charcoal px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-off-white transition-all hover:border-neon-red hover:text-neon-red sm:inline-flex"
                  >
                    Detail
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
