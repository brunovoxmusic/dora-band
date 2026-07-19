"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Ticket, ChevronRight, X, Info, ExternalLink, Music2, Archive } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

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
      full: d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" }),
    };
  } catch {
    return { day: "?", month: "?", year: "?", time: "", weekday: "", full: "?" };
  }
}

export function GigsSection() {
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Gig | null>(null);

  useEffect(() => {
    fetch(`/api/gigs?view=${view}`)
      .then((r) => r.json())
      .then((d) => {
        setGigs(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [view]);

  return (
    <section className="relative border-t border-charcoal bg-ink py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="06b"
            eyebrow="Koncerty"
            title="Vystúpenia D.O.R.A."
            description="Nadchádzajúce koncerty a archív odohraných vystúpení. Kliknite na koncert pre detail."
          />
        </Reveal>

        {/* View toggle */}
        <Reveal delay={100}>
          <div className="mt-8 inline-flex border border-charcoal bg-dark-gray p-1">
            {(["upcoming", "past"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-5 py-2 text-sm font-bold uppercase tracking-wide transition-all",
                  view === v
                    ? "bg-neon-red text-white glow-red-sm"
                    : "text-silver hover:text-off-white"
                )}
              >
                {v === "upcoming" ? "Nadchádzajúce" : "Archív"}
              </button>
            ))}
          </div>
          <a
            href="/archiv"
            className="inline-flex items-center gap-1.5 border border-charcoal bg-dark-gray px-3 py-2 text-xs font-bold uppercase tracking-wide text-silver transition-colors hover:border-neon-red hover:text-neon-red"
          >
            <Archive className="h-3.5 w-3.5" />
            Celý archív
          </a>
        </Reveal>

        {/* List */}
        {loading ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-charcoal" />
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="mt-8 border border-charcoal bg-dark-gray p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-silver/40" />
            <p className="mt-3 text-sm text-silver">
              {view === "upcoming"
                ? "Momentálne nie sú naplánované žiadne vystúpenia. "
                : "Žiadne odohrané vystúpenia v archíve. "}
              <a href="#kontakt" className="font-semibold text-neon-red hover:underline underline-offset-4">
                Naplánujte koncert s nami →
              </a>
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {gigs.map((g, i) => {
              const d = formatDate(g.date);
              const st = statusMap[g.status] ?? statusMap.upcoming;
              return (
                <Reveal key={g.id} delay={i * 50} direction="up">
                  <button
                    onClick={() => setSelected(g)}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 border border-charcoal bg-dark-gray p-4 text-left transition-all hover:border-neon-red/50 hover:bg-charcoal/30 sm:gap-6 sm:p-5"
                  >
                    {/* Date block */}
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border border-charcoal bg-ink transition-colors group-hover:border-neon-red/40 sm:h-20 sm:w-20">
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
                        <span className={cn("border px-2 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider", st.cls)}>
                          {st.label}
                        </span>
                        {d.weekday && (
                          <span className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                            {d.weekday}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 truncate font-display text-lg font-bold text-off-white sm:text-xl">
                        {g.title}
                      </h3>
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
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex shrink-0 items-center gap-1 text-silver transition-colors group-hover:text-neon-red">
                      <span className="hidden text-xs font-bold uppercase tracking-wide sm:inline">Detail</span>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* Gig detail modal */}
      {selected && (
        <GigDetailModal gig={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

function GigDetailModal({ gig, onClose }: { gig: Gig; onClose: () => void }) {
  const d = formatDate(gig.date);
  const st = statusMap[gig.status] ?? statusMap.upcoming;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detail: ${gig.title}`}
    >
      <div
        className="relative w-full max-w-lg border border-charcoal bg-dark-gray clip-corner-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header strip */}
        <div className="relative flex items-center justify-between border-b border-charcoal bg-ink p-5">
          <div className="pointer-events-none absolute inset-0 bg-stage-grid opacity-30" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 flex-col items-center justify-center border border-neon-red/40 bg-dark-gray">
              <span className="font-display text-xl font-black text-neon-red">{d.day}</span>
              <span className="font-mono-brand text-[9px] uppercase text-warm-yellow">{d.month}</span>
            </div>
            <div>
              <span className={cn("inline-block border px-2 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider", st.cls)}>
                {st.label}
              </span>
              <p className="mt-1 font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                {d.full} · {d.time}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative text-silver hover:text-neon-red"
            aria-label="Zavrieť"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          <h3 className="font-display text-2xl font-extrabold text-off-white">{gig.title}</h3>

          <div className="mt-5 space-y-3">
            <DetailRow icon={MapPin} label="Miesto" value={`${gig.venue}, ${gig.city}, ${gig.country}`} />
            <DetailRow icon={Clock} label="Začiatok" value={`${d.full} · ${d.time} (${d.weekday})`} />
            {gig.ticketPrice && (
              <DetailRow icon={Ticket} label="Vstupné" value={gig.ticketPrice} />
            )}
          </div>

          {gig.notes && (
            <div className="mt-5 border-t border-charcoal pt-4">
              <p className="mb-2 flex items-center gap-1.5 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">
                <Info className="h-3 w-3" />
                Poznámky
              </p>
              <p className="text-sm leading-relaxed text-off-white/80">{gig.notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 border-t border-charcoal pt-4 sm:flex-row">
            {gig.ticketUrl && gig.status === "upcoming" ? (
              <a
                href={gig.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 bg-neon-red px-5 py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red"
              >
                <Ticket className="h-4 w-4" />
                Kúpiť lístok
              </a>
            ) : (
              <a
                href="#kontakt"
                onClick={onClose}
                className="inline-flex flex-1 items-center justify-center gap-2 bg-neon-red px-5 py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red"
              >
                <Music2 className="h-4 w-4" />
                Rezervovať podobný koncert
              </a>
            )}
            <a
              href="#kontakt"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-charcoal bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
            >
              <ExternalLink className="h-4 w-4" />
              Kontaktovať
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-charcoal bg-ink">
        <Icon className="h-4 w-4 text-warm-yellow" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">{label}</p>
        <p className="text-sm font-semibold text-off-white">{value}</p>
      </div>
    </div>
  );
}
