"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { BAND, EVENT_TYPES } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { toast } from "sonner";

type FormState = {
  organizer: string;
  email: string;
  phone: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  message: string;
  gdprConsent: boolean;
  website: string; // honeypot — musí ostať prázdne
};

const empty: FormState = {
  organizer: "",
  email: "",
  phone: "",
  eventDate: "",
  eventLocation: "",
  eventType: EVENT_TYPES[0],
  message: "",
  gdprConsent: false,
  website: "",
};

export function ContactSection({ content }: { content?: Record<string, string> }) {
  const c = content ?? {};
  const email = c["contact.email"] || BAND.contact.email;
  const phone = c["contact.phone"] || BAND.contact.phone;
  const phoneHref = phone.replace(/[\s\/]/g, "");
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Odoslanie zlyhalo.");
      }
      setDone(true);
      setForm(empty);
      toast.success("Ďakujeme! Vašu dopytovú požiadavku sme prijali.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nastala chyba. Skúste to znova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="kontakt" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="06"
          eyebrow="Kontakt & booking"
          title="Rezervovať koncert"
          description="Pre mediálne dopyty, booking a partnerstvá kontaktujte kapelu priamo. Ozveme sa čo najskôr."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <a
                href={`mailto:${email}`}
                className="group flex items-start gap-4 border border-charcoal bg-ink p-5 transition-all hover:border-neon-red/60 clip-corner"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-neon-red text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">E-mail</p>
                  <p className="mt-0.5 break-all text-sm font-semibold text-off-white group-hover:text-neon-red">
                    {email}
                  </p>
                </div>
              </a>

              <a
                href={`tel:${phoneHref}`}
                className="group flex items-start gap-4 border border-charcoal bg-ink p-5 transition-all hover:border-neon-red/60 clip-corner"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-neon-red text-white">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">Telefón</p>
                  <p className="mt-0.5 text-sm font-semibold text-off-white group-hover:text-neon-red">
                    {phone}
                  </p>
                </div>
              </a>

              <div className="flex items-start gap-4 border border-charcoal bg-ink p-5 clip-corner">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-warm-yellow text-ink">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">Sídlo</p>
                  <p className="mt-0.5 text-sm font-semibold text-off-white">Púchov, Slovenská republika</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border border-dashed border-charcoal bg-ink/60 p-5">
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">
                {"// Tipy pre organizátorov"}
              </p>
              <ul className="mt-3 space-y-2 text-xs text-off-white/70">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-red" />
                  <span>Uveďte predpokladaný dátum, miesto a typ podujatia.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-red" />
                  <span>Pre urgentné dopyty použite telefón s predmetom PR 2026.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-red" />
                  <span>Technické špecifikácie a stageplan nájdete v sekcii Pre médiá.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {done ? (
              <div className="flex h-full flex-col items-center justify-center border border-neon-red/40 bg-ink p-10 text-center clip-corner">
                <CheckCircle2 className="h-14 w-14 text-neon-red glow-red-sm" />
                <h3 className="mt-4 font-display text-2xl font-bold text-off-white">Ďakujeme za dopyt!</h3>
                <p className="mt-2 max-w-md text-sm text-off-white/70">
                  Vašu požiadavku sme prijali a uložili. Ozveme sa vám čo najskôr na uvedený kontakt.
                </p>
                <button
                  onClick={() => setDone(false)}
                  className="mt-6 border border-charcoal bg-dark-gray px-5 py-2.5 text-sm font-semibold text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
                >
                  Odoslať ďalší dopyt
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 border border-charcoal bg-ink p-6 clip-corner sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Meno usporiadateľa / Organizácia" required>
                    <input
                      required
                      value={form.organizer}
                      onChange={(e) => update("organizer", e.target.value)}
                      className="dora-input"
                      placeholder="napr. Jan Novák / Festival s.r.o."
                    />
                  </Field>
                  <Field label="Kontaktný e-mail" required>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="dora-input"
                      placeholder="organizacia@email.sk"
                    />
                  </Field>
                  <Field label="Kontaktný telefón" required>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="dora-input"
                      placeholder="+421 900 000 000"
                    />
                  </Field>
                  <Field label="Dátum a miesto podujatia" required>
                    <input
                      required
                      value={form.eventDate}
                      onChange={(e) => update("eventDate", e.target.value)}
                      className="dora-input"
                      placeholder="napr. 15.7.2026 — Púchov"
                    />
                  </Field>
                </div>

                <Field label="Miesto podujatia" required>
                  <input
                    required
                    value={form.eventLocation}
                    onChange={(e) => update("eventLocation", e.target.value)}
                    className="dora-input"
                    placeholder="napr. Hlavné pódium, Areál Púchov"
                  />
                </Field>

                <Field label="Typ podujatia">
                  <select
                    value={form.eventType}
                    onChange={(e) => update("eventType", e.target.value)}
                    className="dora-input"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Správa / Špecifikácie">
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    rows={4}
                    className="dora-input resize-none"
                    placeholder="Očakávaný začiatok vystúpenia, dĺžka setu, kapacita, technické požiadavky..."
                  />
                </Field>

                {/* A.4: Honeypot — skryté pole pre boty (ľudia ho nevidia) */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
                  <label>
                    Webstránka (nevyplňovať)
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                    />
                  </label>
                </div>

                {/* A.4: GDPR Consent — required checkbox */}
                <label className="flex items-start gap-3 p-3 border border-charcoal bg-ink cursor-pointer hover:border-neon-red/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.gdprConsent}
                    onChange={(e) => update("gdprConsent", e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 accent-neon-red"
                  />
                  <span className="text-xs text-silver leading-relaxed">
                    Súhlasím so spracovaním osobných údajov (meno, e-mail, telefón) za účelom vybavenia mojej bookingovej požiadavky.{" "}
                    <a href="/privacy" className="text-warm-yellow underline hover:text-neon-red transition-colors" target="_blank" rel="noopener">
                      Viac informácií
                    </a>
                    .<span className="text-neon-red"> *</span>
                  </span>
                </label>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="flex items-center gap-1.5 text-xs text-silver">
                    <AlertCircle className="h-3.5 w-3.5 text-warm-yellow" />
                    Polia označené * sú povinné.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-neon-red px-6 py-3 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {loading ? "Odosielam..." : "Odoslať dopyt"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.dora-input) {
          width: 100%;
          border: 1px solid #2d2d2d;
          background-color: #1a1a1a;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #e8e8e8;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        :global(.dora-input::placeholder) {
          color: #707070;
        }
        :global(.dora-input:focus) {
          border-color: #e63946;
          box-shadow: 0 0 0 1px #e63946, 0 0 18px -6px rgba(230, 57, 70, 0.6);
        }
        :global(.dora-input:hover:not(:focus)) {
          border-color: #4a4a4a;
        }
        :global(select.dora-input option) {
          background-color: #1a1a1a;
          color: #e8e8e8;
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
        {label} {required && <span className="text-neon-red">*</span>}
      </span>
      {children}
    </label>
  );
}
