"use client";

import { useMusicPlayer } from "@/lib/music-player-context";
import { TRACKS } from "@/lib/band-data";
import { Play, Pause, Music2, Headphones, Volume2, Clock, Disc3 } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

export function MusicSection() {
  const { activeIdx, activeTrack, playing, select, togglePlay, setPlaying } = useMusicPlayer();

  return (
    <section
      id="hudba"
      className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28"
    >
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 bg-stage-grid opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-red/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="04"
            eyebrow="Hudba & Video"
            title="Vypočujte si D.O.R.A."
            description="Vyberte skladbu z tracklistu a pozrite si živé vystúpenie. Reprezentatívny výber z celej diskografie."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-5">
          {/* Video player */}
          <Reveal className="lg:col-span-3" direction="right">
            <div className="relative border border-charcoal bg-dark-gray clip-corner-lg overflow-hidden">
              {/* Aspect-ratio video frame */}
              <div className="relative aspect-video w-full bg-ink">
                {activeTrack.videoId && playing ? (
                  <iframe
                    key={activeTrack.id + "-play"}
                    src={`https://www.youtube.com/embed/${activeTrack.videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={`D.O.R.A. — ${activeTrack.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                ) : activeTrack.videoId ? (
                  <button
                    onClick={() => setPlaying(true)}
                    className="group absolute inset-0 flex flex-col items-center justify-center"
                    aria-label={`Prehrať: ${activeTrack.title}`}
                  >
                    {/* Thumbnail backdrop */}
                    <img
                      src={`https://i.ytimg.com/vi/${activeTrack.videoId}/hqdefault.jpg`}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity group-hover:opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                    {/* Play button */}
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-neon-red glow-red transition-transform group-hover:scale-110">
                      <Play className="ml-1 h-8 w-8 fill-white text-white" />
                      <span className="absolute inset-0 animate-ping rounded-full bg-neon-red/40" />
                    </div>
                    <p className="relative mt-4 font-display text-lg font-bold text-off-white">
                      {activeTrack.title}
                    </p>
                    <p className="relative font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">
                      {activeTrack.genre} · {activeTrack.year}
                    </p>
                  </button>
                ) : (
                  // Fallback: video nie je k dispozícii (TODO — pozri band-data.ts TRACKS)
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                    <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-charcoal text-silver">
                      <Play className="h-7 w-7 opacity-50" />
                    </div>
                    <p className="relative font-display text-lg font-bold text-off-white">
                      {activeTrack.title}
                    </p>
                    <p className="relative mt-2 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">
                      Video zatiaľ nie je k dispozícii
                    </p>
                    <p className="relative mt-3 max-w-xs text-xs text-silver/60">
                      YouTube embed sa pripravuje — sledujte oficiálny kanál{" "}
                      <a
                        href="https://www.youtube.com/@DORAkapela"
                        target="_blank"
                        rel="noreferrer"
                        className="text-neon-red hover:underline"
                      >
                        @DORAkapela
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>

              {/* Now playing bar */}
              <div className="flex items-center gap-3 border-t border-charcoal bg-ink p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-neon-red">
                  {playing ? (
                    <Volume2 className="h-5 w-5 text-white" />
                  ) : (
                    <Headphones className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-silver">
                    {playing ? "Now playing" : "Pripravené na prehrávanie"}
                  </p>
                  <p className="truncate text-sm font-semibold text-off-white">{activeTrack.title}</p>
                </div>
                <span className="font-mono-brand text-xs text-warm-yellow">{activeTrack.duration}</span>
                <button
                  onClick={togglePlay}
                  className="inline-flex h-9 w-9 items-center justify-center border border-charcoal text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
                  aria-label={playing ? "Pauza" : "Prehrať"}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </Reveal>

          {/* Tracklist */}
          <Reveal className="lg:col-span-2" direction="left" delay={100}>
            <div className="border border-charcoal bg-dark-gray">
              <div className="flex items-center justify-between border-b border-charcoal px-4 py-3">
                <div className="flex items-center gap-2">
                  <Disc3 className="h-4 w-4 text-neon-red" />
                  <span className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">
                    {"// Tracklist"}
                  </span>
                </div>
                <span className="font-mono-brand text-[10px] text-silver">{TRACKS.length} skladieb</span>
              </div>

              <ul className="max-h-[28rem] overflow-y-auto scroll-dora">
                {TRACKS.map((t, i) => {
                  const isActive = i === activeIdx;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => select(i)}
                        className={cn(
                          "group flex w-full items-center gap-3 border-b border-charcoal/50 px-4 py-3 text-left transition-colors",
                          isActive ? "bg-neon-red/10" : "hover:bg-charcoal/40"
                        )}
                      >
                        {/* Track number / playing indicator */}
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center font-mono-brand text-xs",
                            isActive
                              ? "bg-neon-red text-white"
                              : "border border-charcoal text-silver group-hover:border-off-white/40"
                          )}
                        >
                          {isActive && playing ? (
                            <span className="flex items-end gap-0.5">
                              <span className="h-2 w-0.5 animate-pulse bg-white" />
                              <span className="h-3 w-0.5 animate-pulse bg-white [animation-delay:150ms]" />
                              <span className="h-1.5 w-0.5 animate-pulse bg-white [animation-delay:300ms]" />
                            </span>
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-semibold",
                              isActive ? "text-neon-red" : "text-off-white"
                            )}
                          >
                            {t.title}
                          </p>
                          <p className="flex items-center gap-2 truncate font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                            <Music2 className="h-2.5 w-2.5 text-warm-yellow" />
                            {t.genre}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="flex items-center gap-1 font-mono-brand text-[10px] text-silver">
                            <Clock className="h-2.5 w-2.5" />
                            {t.duration}
                          </span>
                          <span className="font-mono-brand text-[10px] text-silver/70">{t.year}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-charcoal bg-ink p-3">
                <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-silver/60">
                  Video source: YouTube · Pre plnú kvalitu navštívte oficiálne kanály
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
