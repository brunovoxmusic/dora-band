"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.replace("/admin");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Prihlásenie zlyhalo.");
      toast.success("Prihlásenie úspešné.");
      router.replace("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba prihlásenia.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-6 w-6 animate-spin text-neon-red" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-stage-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/50 to-ink" />

      {/* Geometric accents */}
      <div className="pointer-events-none absolute inset-0">
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 900" fill="none">
          <line x1="0" y1="200" x2="1440" y2="100" stroke="#E63946" strokeWidth="1" opacity="0.2" />
          <path d="M60 120 L60 60 L120 60" stroke="#E63946" strokeWidth="2" fill="none" />
          <path d="M1380 780 L1380 840 L1320 840" stroke="#F4A300" strokeWidth="2" fill="none" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-silver transition-colors hover:text-neon-red">
          <ArrowLeft className="h-4 w-4" />
          Späť na web
        </a>

        <div className="border border-charcoal bg-dark-gray/80 p-8 backdrop-blur-xl clip-corner-lg">
          <div className="mb-6 flex items-center gap-3">
            <img src="/dora-mark.svg" alt="" className="h-12 w-12" />
            <div>
              <p className="font-display text-xl font-extrabold text-neon-red">D.O.R.A.</p>
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.25em] text-silver">
                Admin Dashboard
              </p>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-off-white">Prihlásenie</h1>
          <p className="mt-1 text-sm text-off-white/60">
            Zadajte prístupové údaje pre správu obsahu, dopytov a koncertov.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                E-mail
              </span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-charcoal bg-ink py-2.5 pl-10 pr-3 text-sm text-off-white outline-none transition-colors focus:border-neon-red"
                  placeholder="admin@dora.band"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                Heslo
              </span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-charcoal bg-ink py-2.5 pl-10 pr-3 text-sm text-off-white outline-none transition-colors focus:border-neon-red"
                  placeholder="••••••••"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-neon-red py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {loading ? "Prihlasujem..." : "Prihlásiť sa"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
