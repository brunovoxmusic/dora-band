"use client";

import { Facebook, Instagram, Youtube, Music2, ExternalLink, Heart } from "lucide-react";
import { BAND } from "@/lib/band-data";
import { Reveal } from "@/components/site/reveal";

const PLATFORMS = [
  {
    name: "Facebook",
    handle: "@dora.kapela",
    desc: "Novinky, eventy a komunita",
    href: BAND.social.facebook,
    icon: Facebook,
    color: "#E63946",
    bg: "bg-neon-red/10",
    border: "border-neon-red/40",
  },
  {
    name: "Instagram",
    handle: "@dora.funkypunk",
    desc: "Fotky a stories z koncertov",
    href: BAND.social.instagram,
    icon: Instagram,
    color: "#F4A300",
    bg: "bg-warm-yellow/10",
    border: "border-warm-yellow/40",
  },
  {
    name: "YouTube",
    handle: "@DORAkapela",
    desc: "Videoklipy a živé záznamy",
    href: BAND.social.youtube,
    icon: Youtube,
    color: "#E63946",
    bg: "bg-neon-red/10",
    border: "border-neon-red/40",
  },
  {
    name: "Spotify",
    handle: "D.O.R.A.",
    desc: "Streamujte našu hudbu",
    href: BAND.social.spotify,
    icon: Music2,
    color: "#F4A300",
    bg: "bg-warm-yellow/10",
    border: "border-warm-yellow/40",
  },
];

export function SocialSection() {
  return (
    <section className="relative overflow-hidden border-t border-charcoal bg-ink py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-stage-grid opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-neon-red/8 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">
              {"// Sledujte nás"}
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-off-white sm:text-4xl">
              Buďte v kontakte na{" "}
              <span className="text-neon-red text-glow-red">sociálnych sieťach</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-off-white/70">
              Sledujte D.O.R.A. na všetkých platformách — novinky, koncerty, fotky a hudba.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLATFORMS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.name} delay={i * 80} direction="up">
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex h-full flex-col items-start border ${p.border} ${p.bg} p-5 transition-all hover:bg-charcoal/40 clip-corner`}
                >
                  <div className="flex w-full items-center justify-between">
                    <Icon className="h-7 w-7" style={{ color: p.color }} />
                    <ExternalLink className="h-3.5 w-3.5 text-silver/40 transition-colors group-hover:text-off-white" />
                  </div>
                  <p className="mt-4 font-display text-lg font-bold text-off-white">{p.name}</p>
                  <p className="font-mono-brand text-[10px] uppercase tracking-wider" style={{ color: p.color }}>
                    {p.handle}
                  </p>
                  <p className="mt-1.5 text-xs text-off-white/60">{p.desc}</p>

                  {/* Hover accent line */}
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: `linear-gradient(to right, ${p.color}, transparent)` }}
                  />
                </a>
              </Reveal>
            );
          })}
        </div>

        {/* Bandcamp extra strip */}
        <Reveal delay={300}>
          <a
            href={BAND.social.bandcamp}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-3 flex flex-col items-center justify-between gap-3 border border-charcoal bg-dark-gray p-4 transition-colors hover:border-warm-yellow/40 sm:flex-row"
          >
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-warm-yellow" />
              <div>
                <p className="font-display text-sm font-bold text-off-white">
                  Podporte kapelu na Bandcampe
                </p>
                <p className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                  dorakapela.bandcamp.com · Priame nákupy podporujú hudobníkov
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 border border-warm-yellow/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-warm-yellow transition-colors group-hover:bg-warm-yellow group-hover:text-ink">
              <ExternalLink className="h-3.5 w-3.5" />
              Bandcamp
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
