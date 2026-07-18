"use client";

import { MapPin, Clock, Ticket, Music2 } from "lucide-react";
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return {
      day: d.toLocaleDateString("sk-SK", { day: "2-digit" }),
      month: d.toLocaleDateString("sk-SK", { month: "short" }).replace(".", ""),
      weekday: d.toLocaleDateString("sk-SK", { weekday: "long" }),
      full: d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" }),
      time: d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { day: "?", month: "?", weekday: "", full: "?", time: "" };
  }
}

export function ArchiveGigsClient({ gigs }: { gigs: Gig[] }) {
  return (
    <div className="space-y-2">
      {gigs.map((g, i) => {
        const d = formatDate(g.date);
        return (
          <article
            key={g.id}
            className={cn(
              "group grid grid-cols-[auto_1fr] items-center gap-4 border border-charcoal bg-dark-gray p-4 transition-colors hover:border-off-white/20 sm:gap-6",
              i === 0 && "border-neon-red/30"
            )}
          >
            {/* Date block */}
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center border border-charcoal bg-ink sm:h-16 sm:w-16">
              <span className="font-display text-xl font-black text-neon-red sm:text-2xl">{d.day}</span>
              <span className="font-mono-brand text-[9px] uppercase text-warm-yellow">{d.month}</span>
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-charcoal px-2 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider text-silver">
                  Odohrané
                </span>
                {d.weekday && (
                  <span className="font-mono-brand text-[10px] uppercase tracking-wider text-silver/60">
                    {d.weekday}
                  </span>
                )}
              </div>
              <h3 className="mt-1 truncate font-display text-base font-bold text-off-white sm:text-lg">
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
                {g.ticketPrice && (
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3 w-3 text-warm-yellow" />
                    {g.ticketPrice}
                  </span>
                )}
              </div>
              {g.notes && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-off-white/50">
                  <Music2 className="mt-0.5 h-3 w-3 shrink-0 text-neon-red" />
                  {g.notes}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
