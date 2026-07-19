"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Prihlásenie zlyhalo.");
      setDone(true);
      setEmail("");
      toast.success(d.message || "Prihlásenie úspešné!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-charcoal bg-dark-gray py-16 sm:py-20">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 bg-stage-grid opacity-15" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-neon-red/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-warm-yellow/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-5 inline-flex items-center gap-2 border border-charcoal bg-ink/60 px-3 py-1.5 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-warm-yellow" />
          <span className="font-mono-brand text-[10px] uppercase tracking-[0.25em] text-silver">
            Novinky & koncerty
          </span>
        </div>

        <h2 className="font-display text-3xl font-extrabold leading-tight text-off-white sm:text-4xl">
          Buďte prví, kto vie o ďalšom{" "}
          <span className="text-neon-red text-glow-red">koncerte</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-off-white/70">
          Prihláste sa k odberu noviniek D.O.R.A. — informácie o vystúpeniach, nových nahrávkach
          a exkluzívnom obsahu priamo do vašej schránky. Žiadny spam, len funky-punk.
        </p>

        {done ? (
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 border border-neon-red/40 bg-ink/80 p-5 clip-corner">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-neon-red glow-red-sm" />
            <div className="text-left">
              <p className="text-sm font-semibold text-off-white">Ďakujeme za prihlásenie!</p>
              <p className="text-xs text-off-white/60">Potvrdenie nájdete v schránke.</p>
            </div>
            <button
              onClick={() => setDone(false)}
              className="ml-2 text-xs text-silver underline underline-offset-2 hover:text-neon-red"
            >
              Zrušiť
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.sk"
                className="w-full border border-charcoal bg-ink py-3 pl-10 pr-3 text-sm text-off-white outline-none transition-colors focus:border-neon-red clip-corner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-neon-red px-6 py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {loading ? "Prihlasujem..." : "Prihlásiť"}
            </button>
          </form>
        )}

        <p className="mt-4 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver/50">
          {"// Súhlasím so spracovaním e-mailu · Kedykoľvek sa môžete odhlásiť"}
        </p>
      </div>
    </section>
  );
}
