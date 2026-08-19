"use client";

import { useState, useEffect } from "react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { Music2, Calendar, Users, Guitar, Star } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

type Stats = {
  yearsActive: number;
  gigsPlayed: number;
  songsReleased: number;
  fansCount: number;
};

function StatCard({ icon, value, label, delay = 0 }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay?: number;
}) {
  const { ref, display } = useCountUp(value, 2000);
  return (
    <Reveal delay={delay}>
      <div ref={ref as React.RefObject<HTMLDivElement>} className="group relative overflow-hidden border border-charcoal bg-ink/50 p-6 transition-all hover:border-neon-red/40 hover:bg-ink clip-corner">
        <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 bg-neon-red/5 blur-2xl transition-all group-hover:scale-150" />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center border border-charcoal bg-dark-gray text-neon-red transition-colors group-hover:border-neon-red/50">
              {icon}
            </span>
            <span className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver/50">{label}</span>
          </div>
          <div className="font-display text-4xl font-black tabular-nums text-off-white sm:text-5xl">
            {typeof display === "number" ? display.toLocaleString("sk-SK") : display}
          </div>
          <div className="h-px w-full bg-gradient-to-r from-neon-red/30 via-charcoal to-transparent" />
        </div>
      </div>
    </Reveal>
  );
}

export function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Fetch reálne dáta z verejného stats API (bez auth)
    fetch("/api/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setStats({
          yearsActive: d.yearsActive || 30,
          gigsPlayed: d.gigsPlayed || 0,
          songsReleased: d.songsReleased || 0,
          fansCount: d.fansCount || 0,
        });
      })
      .catch(() => {
        setStats({
          yearsActive: new Date().getFullYear() - 1996,
          gigsPlayed: 0,
          songsReleased: 0,
          fansCount: 0,
        });
      });
  }, []);

  const s = stats || { yearsActive: 30, gigsPlayed: 0, songsReleased: 0, fansCount: 0 };

  return (
    <section id="stats" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-16 sm:py-20">
      {/* Background noise + gradient */}
      <div className="absolute inset-0 bg-noise opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="∞"
            eyebrow="D.O.R.A. v číslach"
            title="Tri desaťročia na scéne"
            description="Od roku 1996 nosíme punkovú drzosť do klubov, festivalov a pódii po celom Slovensku."
            align="center"
          />
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            value={s.yearsActive}
            label="rokov kapele"
            delay={0}
          />
          <StatCard
            icon={<Guitar className="h-5 w-5" />}
            value={s.gigsPlayed}
            label="odohraných koncertov"
            delay={100}
          />
          <StatCard
            icon={<Music2 className="h-5 w-5" />}
            value={s.songsReleased}
            label="vydaných skladieb"
            delay={200}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            value={s.fansCount}
            label="verných fanúšikov"
            delay={300}
          />
        </div>
      </div>
    </section>
  );
}
