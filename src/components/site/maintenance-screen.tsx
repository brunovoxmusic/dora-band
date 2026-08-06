import { Power, Clock, Mail, Hammer, RefreshCw, ShieldCheck } from "lucide-react";
import type { MaintenanceState } from "@/lib/settings";

type Props = {
  maintenance: MaintenanceState;
  /** True if the current viewer is an authenticated admin (allows bypass). */
  adminBypass: boolean;
  /** Server time string for display. */
  now?: Date;
};

export function MaintenanceScreen({ maintenance, adminBypass, now }: Props) {
  const showFull = !adminBypass || !maintenance.allowAdminBypass;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-off-white">
      {/* Strobe / animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-1/4 h-[60vh] w-[60vh] rounded-full bg-neon-red/20 blur-3xl" style={{ animation: "maintPulse 6s ease-in-out infinite" }} />
        <div className="absolute -right-1/4 bottom-1/4 h-[50vh] w-[50vh] rounded-full bg-warm-yellow/15 blur-3xl" style={{ animation: "maintPulse 8s ease-in-out infinite 1s" }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, #fff 25%, #fff 26%, transparent 27%, transparent 74%, #fff 75%, #fff 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #fff 25%, #fff 26%, transparent 27%, transparent 74%, #fff 75%, #fff 76%, transparent 77%, transparent)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Top bar — admin badge only */}
      {adminBypass && maintenance.allowAdminBypass && (
        <div className="relative z-10 flex items-center justify-between border-b border-charcoal bg-ink/80 px-4 py-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border border-warm-yellow/50 bg-warm-yellow/10 px-2 py-1 font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
              <ShieldCheck className="h-3 w-3" /> Admin náhľad
            </span>
            <span className="text-xs text-silver">
              Návštevníci vidia túto obrazovku — vy ju vidíte ako prihlásený admin.
            </span>
          </div>
          <a
            href="/admin"
            className="inline-flex items-center gap-1.5 border border-charcoal px-2.5 py-1.5 text-xs font-semibold text-off-white/80 hover:border-neon-red hover:text-neon-red"
          >
            Do administrácie →
          </a>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <img src="/dora-mark.svg" alt="D.O.R.A." className="h-12 w-12 opacity-80" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-display text-2xl font-extrabold tracking-tight text-neon-red text-glow-red">
                D.O.R.A.
              </span>
              <span className="font-mono-brand text-[10px] uppercase tracking-[0.25em] text-silver">
                Funky-Punk · Púchov
              </span>
            </div>
          </div>

          {/* Big icon */}
          <div className="mb-6 inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-neon-red/30" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-neon-red bg-neon-red/10">
                <Hammer className="h-9 w-9 text-neon-red" />
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div className="mb-3 inline-flex items-center gap-2 border border-neon-red/40 bg-neon-red/10 px-3 py-1 font-mono-brand text-[10px] uppercase tracking-[0.25em] text-neon-red">
            <Power className="h-3 w-3" />
            Režim údržby
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-extrabold text-off-white sm:text-4xl md:text-5xl">
            {maintenance.title || "Web sa pripravuje"}
          </h1>

          {/* Message */}
          {maintenance.message && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-silver sm:text-base">
              {maintenance.message}
            </p>
          )}

          {/* Estimated return */}
          {maintenance.estimatedReturn && (
            <div className="mt-6 inline-flex items-center gap-2 border border-warm-yellow/40 bg-warm-yellow/10 px-4 py-2">
              <Clock className="h-4 w-4 text-warm-yellow" />
              <span className="font-mono-brand text-[11px] uppercase tracking-wider text-warm-yellow">
                Predpokladaný návrat:
              </span>
              <span className="text-sm font-semibold text-off-white">{maintenance.estimatedReturn}</span>
            </div>
          )}

          {/* Scheduled window info */}
          {maintenance.startTime && maintenance.endTime && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-silver/70">
              <Clock className="h-3 w-3" />
              <span className="font-mono-brand uppercase tracking-wider">Plánované okno:</span>
              <span>{new Date(maintenance.startTime).toLocaleString("sk-SK")}</span>
              <span className="text-silver/40">→</span>
              <span>{new Date(maintenance.endTime).toLocaleString("sk-SK")}</span>
            </div>
          )}

          {/* Retry button */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 border border-neon-red bg-neon-red/10 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-neon-red transition-colors hover:bg-neon-red hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Skúsiť znova
            </button>
            {maintenance.contactEmail && (
              <a
                href={`mailto:${maintenance.contactEmail}`}
                className="inline-flex items-center gap-2 border border-charcoal bg-dark-gray px-5 py-2.5 text-sm font-semibold text-off-white/80 transition-colors hover:border-off-white/40 hover:text-off-white"
              >
                <Mail className="h-4 w-4" />
                {maintenance.contactEmail}
              </a>
            )}
          </div>

          {/* Footer note */}
          <p className="mt-12 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver/40">
            D.O.R.A. — Dnes Od Rána Abstinujem
          </p>
          {now && (
            <p className="mt-1 font-mono-brand text-[9px] text-silver/30">
              {now.toISOString()}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
